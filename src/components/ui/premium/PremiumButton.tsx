// src/components/ui/premium/PremiumButton.tsx
//
// The V2 action primitive. Flat, tall, wide-tracked label, generous
// radius. Deliberately different from AppButton (which stays available
// for any screen not yet migrated).

import React, { memo, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

export type PremiumButtonVariant =
  /** Solid cinnamon — the single primary action on a screen */
  | 'solid'
  /** Gold foil gradient — reserved for money-moving actions */
  | 'gold'
  /** Ink-on-paper hairline outline */
  | 'outline'
  /** Frosted glass — for use on the warm hero zone */
  | 'glass'
  /** Text-only */
  | 'quiet'
  /** Destructive */
  | 'danger';

export type PremiumButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: PremiumButtonVariant;
  size?: PremiumButtonSize;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Defaults to true — set false to size to content */
  block?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
};

function PremiumButton({
  label,
  onPress,
  variant = 'solid',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  block = true,
  style,
  labelStyle,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS, moderateScale } = useTheme();
  const press = useRef(new Animated.Value(0)).current;

  const isOff = disabled || loading;

  const heights: Record<PremiumButtonSize, number> = {
    sm: moderateScale(40),
    md: moderateScale(52),
    lg: moderateScale(58),
  };
  const fonts: Record<PremiumButtonSize, number> = {
    sm: SIZES.font.sm,
    md: SIZES.font.md,
    lg: SIZES.font.lg,
  };
  const icons: Record<PremiumButtonSize, number> = {
    sm: SIZES.icon.sm,
    md: SIZES.icon.md,
    lg: SIZES.icon.lg,
  };

  type Skin = {
    bg: string;
    fg: string;
    border: string;
    shadow: ViewStyle;
    gradient?: readonly string[];
  };

  const skins: Record<PremiumButtonVariant, Skin> = {
    solid: {
      // primaryFill, not primary — cinnamon at full strength only gives
      // 3.61:1 against a white label, which fails WCAG AA.
      bg: COLORS.primaryFill,
      fg: COLORS.textOnPrimary,
      border: 'transparent',
      shadow: SHADOWS.lift as ViewStyle,
    },
    gold: {
      bg: COLORS.metalGold,
      // Ink, not heroCanvas — the gold foil is light, so the label must
      // be the dark brown ramp in BOTH themes to stay legible.
      fg: COLORS.textOnGold,
      border: 'transparent',
      shadow: SHADOWS.goldGlow as ViewStyle,
      gradient: COLORS.gradient.goldFoil,
    },
    outline: {
      bg: 'transparent',
      fg: COLORS.inkPrimary,
      border: COLORS.hairlineBold,
      shadow: {},
    },
    glass: {
      bg: COLORS.heroGlassBold,
      fg: COLORS.heroTextPrimary,
      border: COLORS.heroHairlineBold,
      shadow: {},
    },
    quiet: {
      bg: 'transparent',
      fg: COLORS.primary,
      border: 'transparent',
      shadow: {},
    },
    danger: {
      bg: COLORS.error,
      fg: COLORS.textOnStatus,
      border: 'transparent',
      shadow: SHADOWS.lift as ViewStyle,
    },
  };

  const skin = skins[variant];

  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.975],
  });

  const fg = isOff
    ? variant === 'glass'
      ? COLORS.heroTextMuted
      : COLORS.inkMuted
    : skin.fg;

  const body = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {!!icon && <Ionicons name={icon as any} size={icons[size]} color={fg} />}
          <Text
            numberOfLines={1}
            style={[
              asText(FONTS.button),
              {
                fontSize: fonts[size],
                color: fg,
                fontFamily: FONTS.family.semiBold,
                letterSpacing: 0.6,
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
          {!!iconRight && (
            <Ionicons name={iconRight as any} size={icons[size]} color={fg} />
          )}
        </>
      )}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      onPressIn={() =>
        Animated.spring(press, {
          toValue: 1,
          useNativeDriver: true,
          speed: 40,
          bounciness: 0,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(press, {
          toValue: 0,
          useNativeDriver: true,
          speed: 28,
          bounciness: 6,
        }).start()
      }
      style={block ? { width: '100%' } : undefined}
    >
      <Animated.View
        style={[
          s.btn,
          {
            height: heights[size],
            borderRadius: SIZES.radius.tile,
            paddingHorizontal: SIZES.padding.xxl,
            backgroundColor: isOff
              ? variant === 'glass'
                ? COLORS.heroGlass
                : COLORS.canvasSunken
              : skin.bg,
            borderWidth: skin.border === 'transparent' ? 0 : 1,
            borderColor: skin.border,
            transform: [{ scale }],
          },
          !isOff && skin.shadow,
          style,
        ]}
      >
        {/* Gold foil gets a real gradient fill */}
        {!!skin.gradient && !isOff && (
          <LinearGradient
            colors={skin.gradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: SIZES.radius.tile }]}
          />
        )}
        <View style={s.row}>{body}</View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default memo(PremiumButton);
