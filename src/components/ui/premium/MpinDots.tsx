// src/components/ui/premium/MpinDots.tsx
//
// The single MPIN entry primitive for the whole app -- replaces the
// three separate hand-built numeric-keypad grids that used to exist
// (AppPinInput's Keypad, VerifyMpinScreen's inline Key grid, and this
// folder's old PinPad.tsx). There is no on-screen keypad here: digits
// come from the OS's own number-pad keyboard, captured by an
// off-screen TextInput, exactly like a native passcode screen.
//
// Visual language: four dots that scale up and flash gold for a beat
// when a digit lands, then settle to a solid brand-red fill -- quiet
// enough to not read as a game, present enough to feel responsive.
// Wrong PIN shakes the row in place; nothing about the entered digits
// is ever shown as plain text.

import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Animated, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme';

export interface MpinDotsRef {
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
  /** Shakes the row and tints dots for the error colour. */
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
};

const MpinDots = forwardRef<MpinDotsRef, Props>(function MpinDots(
  { length = 4, value, onChangeText, onComplete, error = false, disabled = false, autoFocus = true, style },
  ref,
) {
  const { COLORS, moderateScale } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const fillAnims = useRef(
    Array.from({ length }, () => new Animated.Value(0)),
  ).current;
  const prevLength = useRef(0);

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

  // Animate the newly-filled dot with a quick gold-flash + settle; the
  // popped dot (backspace) just fades back down. Only the dot whose
  // fill state actually changed animates -- not the whole row.
  useEffect(() => {
    const prev = prevLength.current;
    const next = value.length;
    if (next > prev) {
      for (let i = prev; i < next; i++) {
        fillAnims[i].setValue(0);
        Animated.spring(fillAnims[i], {
          toValue: 1,
          useNativeDriver: true,
          speed: 22,
          bounciness: 9,
        }).start();
      }
    } else if (next < prev) {
      for (let i = next; i < prev; i++) {
        Animated.timing(fillAnims[i], {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
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

  const dotSize = moderateScale(16);

  return (
    <View style={[s.wrap, style]}>
      <Animated.View style={[s.row, { transform: [{ translateX: shake }] }]}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const goldFlash = fillAnims[i].interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 1, 0],
          });
          const scale = fillAnims[i].interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0.7, 1.25, 1],
          });
          return (
            <View
              key={i}
              style={[
                s.dotBase,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  borderColor: error ? COLORS.error : filled ? COLORS.primary : COLORS.hairlineBold,
                  backgroundColor: error
                    ? COLORS.errorBg
                    : filled
                    ? COLORS.primary
                    : 'transparent',
                },
              ]}
            >
              {/* Gold flash overlay -- fades out right after the dot fills */}
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: dotSize / 2,
                    backgroundColor: COLORS.secondary,
                    opacity: goldFlash,
                    transform: [{ scale }],
                  },
                ]}
              />
            </View>
          );
        })}
      </Animated.View>

      {/* Off-screen native numeric input -- this is the ONLY way digits
          are entered. Position off-canvas rather than opacity:0 so it
          can't intercept touches meant for anything behind it. */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
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
  row: { flexDirection: 'row', gap: 22 },
  dotBase: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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

export default memo(MpinDots);
