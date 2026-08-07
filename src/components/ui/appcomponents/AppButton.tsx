// components/AppButton.tsx
import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Animated,
  ActivityIndicator, View, ViewStyle, TextStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
export type ButtonSize    = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  iconSize?: number;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function AppButton({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false,
  leftIcon, rightIcon, iconSize,
  fullWidth = true, style, textStyle,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS, moderateScale } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 24 }).start();

  const isDisabled = disabled || loading;

  // ── Sizes ──
  const heights:   Record<ButtonSize, number> = { sm: moderateScale(38), md: moderateScale(48), lg: moderateScale(56) };
  const fontSizes: Record<ButtonSize, number> = { sm: SIZES.font.sm,     md: SIZES.font.md,    lg: SIZES.font.lg    };
  const iconSizes: Record<ButtonSize, number> = { sm: 16,                md: 20,               lg: 22               };

  // ── Variant colors ──
  type VC = { bg: string; border: string; text: string; loaderColor: string };
  const variants: Record<ButtonVariant, VC> = {
    primary:   { bg: COLORS.primaryFill, border: COLORS.primaryFill, text: COLORS.textOnPrimary, loaderColor: COLORS.textOnPrimary },
    secondary: { bg: COLORS.gray100,   border: COLORS.gray100,     text: COLORS.textPrimary,  loaderColor: COLORS.primaryInk  },
    outline:   { bg: 'transparent',    border: COLORS.primaryFill, text: COLORS.primaryInk,   loaderColor: COLORS.primaryInk  },
    ghost:     { bg: 'transparent',    border: 'transparent',      text: COLORS.textSecondary,loaderColor: COLORS.primaryInk  },
    danger:    { bg: COLORS.error,     border: COLORS.error,       text: COLORS.textOnStatus, loaderColor: COLORS.textOnStatus },
    gold:      { bg: COLORS.secondary, border: COLORS.secondary,   text: COLORS.textOnGold,   loaderColor: COLORS.textOnGold  },
  };
  const vc = variants[variant];
  const iSize = iconSize ?? iconSizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      activeOpacity={1}
      disabled={isDisabled}
      style={[fullWidth && { width: '100%' }]}
    >
      <Animated.View
        style={[
          styles.btn,
          {
            height: heights[size],
            backgroundColor: isDisabled ? COLORS.gray200 : vc.bg,
            borderColor: isDisabled ? COLORS.gray200 : vc.border,
            borderWidth: variant === 'outline' ? 1.5 : 0,
            transform: [{ scale }],
            ...(variant === 'primary' || variant === 'gold' || variant === 'danger' ? SHADOWS.orange : {}),
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={vc.loaderColor} size="small" />
        ) : (
          <>
            {leftIcon && (
              <Ionicons name={leftIcon as any} size={iSize} color={isDisabled ? COLORS.textDisabled : vc.text} style={{ marginRight: 6 }} />
            )}
            <Text style={[
              styles.label,
              { fontSize: fontSizes[size], color: isDisabled ? COLORS.textDisabled : vc.text, fontFamily: FONTS.family.semiBold },
              textStyle,
            ]}>
              {label}
            </Text>
            {rightIcon && (
              <Ionicons name={rightIcon as any} size={iSize} color={isDisabled ? COLORS.textDisabled : vc.text} style={{ marginLeft: 6 }} />
            )}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 20,
  },
  label: {
    letterSpacing: 0.3,
  },
});