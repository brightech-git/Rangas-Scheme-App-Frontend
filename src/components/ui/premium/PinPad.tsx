// src/components/ui/premium/PinPad.tsx
//
// Hero-aware PIN entry: a row of dots plus a borderless keypad.
//
// WHY THIS EXISTS
//   The legacy AppPinInput is styled for a light page — its label uses
//   textPrimary and its hint textSecondary, which measure 1.79:1 and
//   1.16:1 against the cinnamon hero. On any AuthShell screen the
//   labels were effectively invisible. This component reads the hero
//   token ramp instead, so it is legible on the brand band in both
//   themes.
//
// Presentation only: it owns the digit buffer and reports up via
// onChange / onComplete. No storage, no dispatch, no navigation.

import React, { memo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  /** Current digits. Controlled — the parent owns the value. */
  value: string;
  onChange: (next: string) => void;
  /** Fires once the buffer reaches `length` */
  onComplete?: (value: string) => void;
  length?: number;
  /** Micro-caps line above the dots */
  label?: string;
  /** Small helper under the dots */
  hint?: string;
  error?: boolean;
  errorMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Optional extra key bottom-left, e.g. biometric unlock */
  auxIcon?: string;
  onAuxPress?: () => void;
  style?: ViewStyle;
};

const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

// ── One keypad key ───────────────────────────────────────────────
const Key = memo(function Key({
  label,
  icon,
  onPress,
  disabled,
}: {
  label?: string;
  icon?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { COLORS, FONTS, moderateScale } = useTheme();
  const press = useRef(new Animated.Value(0)).current;

  const bg = press.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.14)'],
  });

  if (!label && !icon) return <View style={s.key} />;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() =>
        Animated.timing(press, {
          toValue: 1,
          duration: 60,
          useNativeDriver: false,
        }).start()
      }
      onPressOut={() =>
        Animated.timing(press, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false,
        }).start()
      }
      style={s.key}
    >
      <Animated.View
        style={[
          s.keyInner,
          {
            width: moderateScale(64),
            height: moderateScale(64),
            borderRadius: moderateScale(32),
            backgroundColor: bg,
            opacity: disabled ? 0.35 : 1,
          },
        ]}
      >
        {label ? (
          <Text
            style={{
              fontFamily: FONTS.family.regular,
              fontSize: moderateScale(27),
              color: COLORS.heroTextPrimary,
              letterSpacing: -0.5,
            }}
          >
            {label}
          </Text>
        ) : (
          <Ionicons
            name={icon as any}
            size={moderateScale(23)}
            color={COLORS.heroTextSecondary}
          />
        )}
      </Animated.View>
    </Pressable>
  );
});

function PinPad({
  value,
  onChange,
  onComplete,
  length = 4,
  label,
  hint,
  error = false,
  errorMessage,
  loading = false,
  disabled = false,
  auxIcon,
  onAuxPress,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const shake = useRef(new Animated.Value(0)).current;

  // Shake the dot row whenever the parent flags an error.
  useEffect(() => {
    if (!error) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [error, shake]);

  const locked = disabled || loading;

  const push = useCallback(
    (d: string) => {
      if (locked || value.length >= length) return;
      const next = value + d;
      onChange(next);
      if (next.length === length) {
        // defer so the final dot paints before the parent reacts
        setTimeout(() => onComplete?.(next), 60);
      }
    },
    [locked, value, length, onChange, onComplete],
  );

  const pop = useCallback(() => {
    if (locked || value.length === 0) return;
    onChange(value.slice(0, -1));
  }, [locked, value, onChange]);

  const dot = moderateScale(14);

  return (
    <View style={[{ width: '100%', alignItems: 'center' }, style]}>
      {!!label && (
        <Text style={[asText(FONTS.eyebrow), { color: COLORS.heroTextTertiary }]}>
          {label}
        </Text>
      )}

      {/* ── Dots ── */}
      <Animated.View
        style={[
          s.dotsRow,
          {
            marginTop: label ? SIZES.margin.md : 0,
            transform: [{ translateX: shake }],
          },
        ]}
      >
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <View
              key={i}
              style={{
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                borderWidth: 1.5,
                backgroundColor: error
                  ? COLORS.heroDanger
                  : filled
                  ? COLORS.heroAccent
                  : 'transparent',
                borderColor: error
                  ? COLORS.heroDanger
                  : filled
                  ? COLORS.heroAccent
                  // An unfilled dot is a control boundary, so it needs
                  // 3:1 — heroHairlineBold (30% white) only gives 2.06.
                  : COLORS.heroDotIdle,
              }}
            />
          );
        })}
      </Animated.View>

      {/* ── Status line (fixed height so the pad never jumps) ── */}
      <View style={s.statusRow}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.heroAccent} />
        ) : error && errorMessage ? (
          <Text
            numberOfLines={1}
            style={[asText(FONTS.micro), { color: COLORS.heroDanger }]}
          >
            {errorMessage}
          </Text>
        ) : hint ? (
          <Text
            numberOfLines={1}
            style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary }]}
          >
            {hint}
          </Text>
        ) : null}
      </View>

      {/* ── Keypad ── */}
      <View style={{ width: '100%', marginTop: SIZES.margin.md }}>
        {KEY_ROWS.map((row, i) => (
          <View key={i} style={s.keyRow}>
            {row.map((d) => (
              <Key key={d} label={d} onPress={() => push(d)} disabled={locked} />
            ))}
          </View>
        ))}

        <View style={s.keyRow}>
          {auxIcon ? (
            <Key icon={auxIcon} onPress={onAuxPress} disabled={locked} />
          ) : (
            <View style={s.key} />
          )}
          <Key label="0" onPress={() => push('0')} disabled={locked} />
          <Key
            icon="backspace-outline"
            onPress={pop}
            disabled={locked || value.length === 0}
          />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  dotsRow: { flexDirection: 'row', gap: 18 },
  statusRow: { height: 22, justifyContent: 'center', marginTop: 10 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-around' },
  key: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  keyInner: { alignItems: 'center', justifyContent: 'center' },
});

export default memo(PinPad);
