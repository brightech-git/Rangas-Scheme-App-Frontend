// src/components/ui/premium/MpinBoxes.tsx
//
// MPIN entry primitive: four visible input boxes (like an OTP field)
// instead of plain dots, with a single eye-icon toggle that reveals
// or masks all four digits together. Still driven entirely by the
// OS's own number-pad keyboard via an off-screen TextInput -- there
// is no on-screen keypad here, exactly like MpinDots.
//
// Visual language: boxes use the same warm ivory fill + hairline
// border as every other input field in the app (PillField), so MPIN
// entry reads as "a field", not a game widget. A freshly-filled box
// gets a brief gold-flash + settle; a wrong PIN shakes the row.

import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

export interface MpinBoxesRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

type Props = {
  length?: number;
  value: string;
  onChangeText: (v: string) => void;
  /** Fires once the buffer reaches `length` digits. */
  onComplete?: (v: string) => void;
  /** Tints boxes red and shakes the row. */
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
};

const MpinBoxes = forwardRef<MpinBoxesRef, Props>(function MpinBoxes(
  { length = 4, value, onChangeText, onComplete, error = false, disabled = false, autoFocus = true, style },
  ref,
) {
  const { COLORS, FONTS, moderateScale } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const fillAnims = useRef(
    Array.from({ length }, () => new Animated.Value(0)),
  ).current;
  const prevLength = useRef(0);
  const [reveal, setReveal] = useState(false);
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => onChangeText(''),
  }));

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 260);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  // Animate only the box whose fill state actually changed.
  useEffect(() => {
    const prev = prevLength.current;
    const next = value.length;
    if (next > prev) {
      for (let i = prev; i < next; i++) {
        fillAnims[i].setValue(0);
        Animated.spring(fillAnims[i], {
          toValue: 1,
          useNativeDriver: false,
          speed: 22,
          bounciness: 9,
        }).start();
      }
    } else if (next < prev) {
      for (let i = next; i < prev; i++) {
        Animated.timing(fillAnims[i], {
          toValue: 0,
          duration: 120,
          useNativeDriver: false,
        }).start();
      }
    }
    prevLength.current = next;
    if (next === length) onComplete?.(value);
  }, [value, length, fillAnims, onComplete]);

  useEffect(() => {
    if (!error) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [error, shake]);

  const handleChange = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, '').slice(0, length);
      onChangeText(digits);
    },
    [length, onChangeText],
  );

  const boxSize = moderateScale(52);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View style={[s.wrap, style]}>
      <Animated.View style={[s.row, { transform: [{ translateX: shake }] }]}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const isActive = focused && !error && i === activeIndex;
          const borderColor = error
            ? COLORS.error
            : filled
            ? COLORS.primary
            : isActive
            ? COLORS.primary
            : COLORS.inputBorder;
          const goldFlash = fillAnims[i].interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 1, 0],
          });
          return (
            <Pressable
              key={i}
              disabled={disabled}
              onPress={() => inputRef.current?.focus()}
              style={[
                s.box,
                {
                  width: boxSize,
                  height: boxSize,
                  borderRadius: moderateScale(14),
                  borderColor,
                  borderWidth: isActive || filled ? moderateScale(2) : moderateScale(1.5),
                  backgroundColor: error ? COLORS.errorBg : COLORS.inputBackground,
                },
                isActive && {
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                },
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: moderateScale(14),
                    backgroundColor: COLORS.secondary,
                    opacity: goldFlash,
                  },
                ]}
              />
              <Text
                style={[
                  asText(FONTS.displaySm),
                  {
                    color: error ? COLORS.error : COLORS.inkPrimary,
                    fontSize: reveal ? moderateScale(22) : moderateScale(26),
                  },
                ]}
              >
                {filled ? (reveal ? value[i] : '•') : ''}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => setReveal((p) => !p)}
          disabled={disabled}
          hitSlop={10}
          style={({ pressed }) => [
            s.revealBtn,
            {
              width: moderateScale(40),
              height: boxSize,
              opacity: pressed ? 0.55 : 1,
            },
          ]}
        >
          <Ionicons
            name={reveal ? 'eye-off-outline' : 'eye-outline'}
            size={moderateScale(20)}
            color={COLORS.inkTertiary}
          />
        </Pressable>
      </Animated.View>

      {/* Off-screen native numeric input -- this is the ONLY way digits
          are entered. Position off-canvas rather than opacity:0 so it
          can't intercept touches meant for anything behind it. */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        secureTextEntry
        editable={!disabled}
        caretHidden
        contextMenuHidden
        style={s.hiddenInput}
        autoComplete="off"
        textContentType="none"
        importantForAutofill="no"
      />
    </View>
  );
});

const s = StyleSheet.create({
  wrap: { alignItems: 'center' },
  revealBtn: { alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  box: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    top: -1000,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default memo(MpinBoxes);
