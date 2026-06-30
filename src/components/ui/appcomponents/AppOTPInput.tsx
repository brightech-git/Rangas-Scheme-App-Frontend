import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Clipboard,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
  ViewStyle,
  Pressable,
} from "react-native";
import { useTheme } from "../../../theme";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppOTPInputRef {
  /** Focus first unfilled box (or first box). */
  focus: () => void;
  /** Clear all boxes. */
  clear: () => void;
  /** Return current OTP string. */
  getValue: () => string;
}

export interface AppOTPInputProps {
  /** Number of OTP digits (default 6). */
  length?: number;
  /** Controlled value. */
  value?: string;
  /** Called with the full OTP string on each change. */
  onChangeText?: (otp: string) => void;
  /** Called when all boxes are filled. */
  onComplete?: (otp: string) => void;
  /** Mask digits (show "•" instead). */
  secure?: boolean;
  /** Show error state. */
  error?: boolean;
  /** Error message below boxes. */
  errorMessage?: string;
  /** Show success state. */
  success?: boolean;
  /** Input type: numeric / alphanumeric. */
  keyboardType?: "numeric" | "default";
  /** Auto-focus on mount. */
  autoFocus?: boolean;
  /** Whether input is disabled. */
  disabled?: boolean;
  /** Label above the boxes. */
  label?: string;
  /** Sub-label / hint below the label. */
  hint?: string;
  /** Size of each box. */
  boxSize?: number;
  /** Gap between boxes. */
  gap?: number;
  /** Custom container style. */
  containerStyle?: ViewStyle;
  /** Custom box style. */
  boxStyle?: ViewStyle;
  /** Custom active (focused) box style. */
  activeBoxStyle?: ViewStyle;
  /** Resend callback. */
  onResend?: () => void;
  /** Resend countdown seconds (0 = always show). */
  resendCountdown?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

const AppOTPInput = forwardRef<AppOTPInputRef, AppOTPInputProps>(
  (
    {
      length = 6,
      value: controlledValue,
      onChangeText,
      onComplete,
      secure = false,
      error = false,
      errorMessage,
      success = false,
      keyboardType = "numeric",
      autoFocus = false,
      disabled = false,
      label,
      hint,
      boxSize,
      gap,
      containerStyle,
      boxStyle,
      activeBoxStyle,
      onResend,
      resendCountdown = 30,
    },
    ref
  ) => {
    const { COLORS, FONTS, SIZES, SHADOWS } = useTheme();

    const BOX_SIZE = boxSize ?? Math.min(48, Math.floor(300 / length) - 8);
    const BOX_GAP = gap ?? 8;

    const [otp, setOtp] = useState<string[]>(
      Array(length).fill("")
    );
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const [countdown, setCountdown] = useState(resendCountdown);

    const inputRefs = useRef<(TextInput | null)[]>(Array(length).fill(null));
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnims = useRef(
      Array(length)
        .fill(null)
        .map(() => new Animated.Value(1))
    ).current;

    // Sync controlled value
    useEffect(() => {
      if (controlledValue !== undefined) {
        const chars = controlledValue.slice(0, length).split("");
        const filled = [
          ...chars,
          ...Array(length - chars.length).fill(""),
        ];
        setOtp(filled);
      }
    }, [controlledValue, length]);

    // Resend countdown
    useEffect(() => {
      if (!onResend || resendCountdown === 0) return;
      if (countdown <= 0) return;
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }, [countdown, onResend, resendCountdown]);

    // Auto-focus
    useEffect(() => {
      if (autoFocus) {
        const t = setTimeout(() => inputRefs.current[0]?.focus(), 300);
        return () => clearTimeout(t);
      }
    }, [autoFocus]);

    // Shake on error change
    useEffect(() => {
      if (!error) return;
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }, [error, shakeAnim]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const focusBox = useCallback((index: number) => {
      const clamped = Math.min(Math.max(index, 0), length - 1);
      inputRefs.current[clamped]?.focus();
    }, [length]);

    const animateBox = useCallback(
      (index: number) => {
        Animated.sequence([
          Animated.timing(scaleAnims[index], {
            toValue: 1.15,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnims[index], {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 6,
          }),
        ]).start();
      },
      [scaleAnims]
    );

    const handleChange = useCallback(
      (text: string, index: number) => {
        // Handle paste
        if (text.length > 1) {
          const digits = text.replace(/\D/g, "").slice(0, length);
          const next = Array(length).fill("");
          digits.split("").forEach((d, i) => {
            next[i] = d;
          });
          setOtp(next);
          const fullOtp = next.join("");
          onChangeText?.(fullOtp);
          if (digits.length === length) {
            onComplete?.(fullOtp);
            inputRefs.current[length - 1]?.blur();
          } else {
            focusBox(digits.length);
          }
          return;
        }

        const digit = text.slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);
        animateBox(index);

        const fullOtp = next.join("");
        onChangeText?.(fullOtp);

        if (digit && index < length - 1) {
          focusBox(index + 1);
        }
        if (fullOtp.length === length && !next.includes("")) {
          onComplete?.(fullOtp);
        }
      },
      [otp, length, focusBox, animateBox, onChangeText, onComplete]
    );

    const handleKeyPress = useCallback(
      (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (e.nativeEvent.key === "Backspace") {
          if (otp[index]) {
            const next = [...otp];
            next[index] = "";
            setOtp(next);
            onChangeText?.(next.join(""));
            if (index > 0) focusBox(index - 1);
          } else if (index > 0) {
            const next = [...otp];
            next[index - 1] = "";
            setOtp(next);
            onChangeText?.(next.join(""));
            focusBox(index - 1);
          }
        }
      },
      [otp, focusBox, onChangeText]
    );

    // ── Imperative API ────────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      focus: () => {
        const first = otp.findIndex((d) => d === "");
        focusBox(first === -1 ? 0 : first);
      },
      clear: () => {
        setOtp(Array(length).fill(""));
        onChangeText?.("");
        focusBox(0);
      },
      getValue: () => otp.join(""),
    }));

    // ── Styles ────────────────────────────────────────────────────────────────

    const boxColor = (index: number) => {
      if (disabled) return COLORS.gray100;
      if (error) return COLORS.errorLight;
      if (success && otp[index]) return COLORS.success + '22';
      if (otp[index] && focusedIndex === index) return COLORS.primaryPale;
      if (focusedIndex === index) return COLORS.primaryPale;
      if (otp[index]) return COLORS.primaryPale;
      return COLORS.gray100;
    };

    const boxBorderColor = (index: number) => {
      if (error) return COLORS.error;
      if (success && otp[index]) return COLORS.success;
      if (focusedIndex === index) return COLORS.primary;
      if (otp[index]) return COLORS.primary;
      return COLORS.borderMedium;
    };

    const styles = StyleSheet.create({
      container: { alignItems: "center" },
      label: { ...FONTS.label, color: COLORS.textPrimary, marginBottom: 4 },
      hint: { ...FONTS.bodySmall, color: COLORS.textSecondary, marginBottom: 12 },
      row: {
        flexDirection: "row",
        alignItems: "center",
        gap: BOX_GAP,
      },
      box: {
        width: BOX_SIZE,
        height: BOX_SIZE,
        borderRadius: SIZES.radius.md,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        ...SHADOWS.sm,
      },
      hiddenInput: {
        position: "absolute",
        width: 1,
        height: 1,
        opacity: 0,
      },
      digit: {
        ...FONTS.h4,
        textAlign: "center",
      },
      cursor: {
        width: 2,
        height: BOX_SIZE * 0.45,
        backgroundColor: COLORS.primary,
        borderRadius: 1,
      },
      errorMsg: {
        ...FONTS.caption,
        color: COLORS.error,
        marginTop: 8,
        textAlign: "center",
      },
      resendRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        gap: 4,
      },
      resendLabel: { ...FONTS.bodySmall, color: COLORS.textSecondary },
      resendBtn: { ...FONTS.bodySmall, color: COLORS.primary },
      resendDisabled: { ...FONTS.bodySmall, color: COLORS.textTertiary },
    });

    const [cursorVisible, setCursorVisible] = useState(true);
    useEffect(() => {
      if (focusedIndex < 0) return;
      const t = setInterval(() => setCursorVisible((v) => !v), 500);
      return () => clearInterval(t);
    }, [focusedIndex]);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        {hint && <Text style={styles.hint}>{hint}</Text>}

        <Animated.View
          style={[styles.row, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array(length)
            .fill(null)
            .map((_, i) => {
              const isFocused = focusedIndex === i;
              const hasValue = !!otp[i];

              return (
                <Pressable key={i} onPress={() => focusBox(i)}>
                  <Animated.View
                    style={[
                      styles.box,
                      {
                        backgroundColor: boxColor(i),
                        borderColor: boxBorderColor(i),
                        transform: [{ scale: scaleAnims[i] }],
                      },
                      boxStyle,
                      isFocused && activeBoxStyle,
                    ]}
                  >
                    <TextInput
                      ref={(r) => {
                        inputRefs.current[i] = r;
                      }}
                      style={styles.hiddenInput}
                      value={otp[i]}
                      onChangeText={(t) => handleChange(t, i)}
                      onKeyPress={(e) => handleKeyPress(e, i)}
                      onFocus={() => setFocusedIndex(i)}
                      onBlur={() => setFocusedIndex(-1)}
                      keyboardType={keyboardType === "numeric" ? "number-pad" : "default"}
                      maxLength={length} // allow paste
                      editable={!disabled}
                      caretHidden
                      selectTextOnFocus
                      textContentType="oneTimeCode"
                      autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
                    />

                    {hasValue ? (
                      <Text
                        style={[
                          styles.digit,
                          {
                            color: error
                              ? COLORS.error
                              : success
                              ? COLORS.success
                              : COLORS.textPrimary,
                          },
                        ]}
                      >
                        {secure ? '•' : otp[i]}
                      </Text>
                    ) : isFocused ? (
                      cursorVisible && <View style={styles.cursor} />
                    ) : null}
                  </Animated.View>
                </Pressable>
              );
            })}
        </Animated.View>

        {error && errorMessage && (
          <Text style={styles.errorMsg}>{errorMessage}</Text>
        )}

        {onResend && (
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive code?</Text>
            {countdown > 0 ? (
              <Text style={styles.resendDisabled}>
                Resend in {countdown}s
              </Text>
            ) : (
              <Pressable
                onPress={() => {
                  onResend();
                  setCountdown(resendCountdown);
                }}
              >
                <Text style={styles.resendBtn}>Resend OTP</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  }
);

AppOTPInput.displayName = "AppOTPInput";
export default AppOTPInput;

/*
<AppOTPInput
  length={6}
  onComplete={(otp) => console.log("OTP:", otp)}
  onResend={() => requestNewOTP()}
  resendCountdown={60}
  error={hasError}
  errorMessage="Invalid OTP. Try again."
  autoFocus
/>
*/