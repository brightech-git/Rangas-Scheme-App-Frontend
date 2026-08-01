// src/components/ui/premium/FormField.tsx
//
// V2 text field. Structural difference from the old boxed input: the
// label is a persistent micro-caps line ABOVE the value, the control
// itself is an underlined row rather than a rounded box, and the focus
// state is expressed by the rule thickening and taking the accent
// colour. Errors slide a message in beneath without shifting layout.
//
// Presentation only — validation stays in the screen.

import React, { memo, useState, useRef, useEffect, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  ViewStyle,
  KeyboardTypeOptions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  error?: string;
  editable?: boolean;
  /** 'required' renders a gold asterisk, 'optional' a muted tag */
  indicator?: 'required' | 'optional';
  icon?: string;
  /** Trailing affordance */
  rightIcon?: string;
  onRightIconPress?: () => void;
  /** Small helper text under the field when there's no error */
  hint?: string;
  /** Renders as a pressable row instead of a text input (pickers) */
  asButton?: boolean;
  onPress?: () => void;
  /** Right-aligned status text, e.g. an age readout */
  badge?: string;
  badgeTone?: 'default' | 'success' | 'error';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** 'hero' renders for the dark noir zone (auth screens) */
  surface?: 'light' | 'hero';
  secureTextEntry?: boolean;
  /** Toggles a show/hide eye for password fields */
  isPassword?: boolean;
  style?: ViewStyle;
};

const FormField = forwardRef<View, Props>(function FormField(
  {
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    maxLength,
    error,
    editable = true,
    indicator,
    icon,
    rightIcon,
    onRightIconPress,
    hint,
    asButton = false,
    onPress,
    badge,
    badgeTone = 'default',
    autoCapitalize = 'sentences',
    surface = 'light',
    secureTextEntry,
    isPassword = false,
    style,
  },
  ref,
) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const errAnim = useRef(new Animated.Value(0)).current;

  const onHero = surface === 'hero';
  const c = {
    label: onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary,
    value: onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary,
    muted: onHero ? COLORS.heroTextMuted : COLORS.inkMuted,
    rule: onHero ? COLORS.heroHairlineBold : COLORS.hairline,
    accent: onHero ? COLORS.heroAccent : COLORS.primary,
    error: onHero ? COLORS.primaryLighter : COLORS.error,
    disabled: onHero ? COLORS.heroTextMuted : COLORS.inkTertiary,
  };

  useEffect(() => {
    Animated.timing(errAnim, {
      toValue: error ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [error, errAnim]);

  const ruleColor = error ? c.error : focused ? c.accent : c.rule;
  const ruleWidth = error || focused ? 1.5 : 1;

  const badgeColor =
    badgeTone === 'success'
      ? onHero
        ? COLORS.successLight
        : COLORS.success
      : badgeTone === 'error'
      ? c.error
      : c.label;

  const isSecure = isPassword ? !reveal : secureTextEntry;

  const body = (
    <View
      style={[
        s.row,
        {
          minHeight: moderateScale(44),
          borderBottomColor: ruleColor,
          borderBottomWidth: ruleWidth,
        },
      ]}
    >
      {!!icon && (
        <Ionicons
          name={icon as any}
          size={SIZES.icon.md}
          color={error ? c.error : focused ? c.accent : c.muted}
        />
      )}

      {asButton ? (
        <Text
          numberOfLines={1}
          style={[
            asText(FONTS.bodyMedium),
            {
              flex: 1,
              color: value ? c.value : c.muted,
              fontSize: SIZES.font.lg,
            },
          ]}
        >
          {value || placeholder}
        </Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.muted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isSecure}
          selectionColor={c.accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            asText(FONTS.bodyMedium),
            {
              flex: 1,
              color: editable ? c.value : c.disabled,
              fontSize: SIZES.font.lg,
              padding: 0,
              paddingVertical: SIZES.padding.sm,
            },
          ]}
        />
      )}

      {!!badge && (
        <Text style={[asText(FONTS.microBold), { color: badgeColor }]}>
          {badge}
        </Text>
      )}

      {isPassword && (
        <Pressable onPress={() => setReveal((p) => !p)} hitSlop={10}>
          <Ionicons
            name={reveal ? 'eye-off-outline' : 'eye-outline'}
            size={SIZES.icon.md}
            color={c.muted}
          />
        </Pressable>
      )}

      {!!rightIcon && (
        <Pressable onPress={onRightIconPress} hitSlop={10}>
          <Ionicons
            name={rightIcon as any}
            size={SIZES.icon.md}
            color={c.accent}
          />
        </Pressable>
      )}
    </View>
  );

  return (
    <View ref={ref} collapsable={false} style={[s.wrap, style]}>
      {/* Label rail */}
      <View style={s.labelRow}>
        <Text style={[asText(FONTS.eyebrow), { color: c.label }]}>
          {label}
          {indicator === 'required' && (
            <Text style={{ color: COLORS.metalGold }}> *</Text>
          )}
        </Text>
        {indicator === 'optional' && (
          <Text
            style={[
              asText(FONTS.micro),
              { color: c.muted, fontSize: 9, letterSpacing: 0.6 },
            ]}
          >
            OPTIONAL
          </Text>
        )}
      </View>

      {asButton ? (
        <Pressable onPress={onPress} disabled={!editable}>
          {body}
        </Pressable>
      ) : (
        body
      )}

      {/* Error / hint */}
      {error ? (
        <Animated.View style={[s.msgRow, { opacity: errAnim }]}>
          <Ionicons name="alert-circle" size={12} color={c.error} />
          <Text
            style={[
              asText(FONTS.micro),
              { color: c.error, fontSize: 10, flex: 1 },
            ]}
          >
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Text
          style={[
            asText(FONTS.micro),
            { color: c.muted, fontSize: 10, marginTop: 5 },
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const s = StyleSheet.create({
  wrap: { marginBottom: 4 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
});

export default memo(FormField);
