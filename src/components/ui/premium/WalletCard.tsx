// src/components/ui/premium/WalletCard.tsx
//
// Apple-Wallet-style pass. A dark slab with a metal foil edge, a large
// holding figure, and a masked account line at the bottom. Used on the
// Wallet screen and anywhere a "single holding" needs to feel physical.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  /** Micro-caps label, e.g. "GOLD HOLDING" */
  eyebrow: string;
  /** Big figure, e.g. "12.480 g" */
  value: string;
  /** Secondary figure, e.g. "≈ ₹90,357" */
  secondary?: string;
  /** Bottom-left label, e.g. "REG NO" */
  footLabel?: string;
  /** Bottom-left value, e.g. "•••• 4471" */
  footValue?: string;
  /** Bottom-right label */
  footLabel2?: string;
  footValue2?: string;
  /** 'G' | 'S' | 'P' | 'D' — drives the foil colour */
  metal?: string;
  icon?: string;
  onPress?: () => void;
  /** Stacked-card effect offset, for wallet stacks */
  stacked?: boolean;
  style?: ViewStyle;
};

function WalletCard({
  eyebrow,
  value,
  secondary,
  footLabel,
  footValue,
  footLabel2,
  footValue2,
  metal = 'G',
  icon = 'diamond',
  onPress,
  stacked = false,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS, moderateScale } = useTheme();

  const foils: Record<string, string> = {
    G: COLORS.metalGold,
    S: COLORS.metalSilver,
    P: COLORS.metalPlatinum,
    D: COLORS.metalDiamond,
  };
  const foil = foils[metal] ?? COLORS.metalGold;

  const Wrapper: React.ElementType = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        s.card,
        {
          borderRadius: SIZES.radius.hero,
          borderColor: COLORS.heroHairline,
          minHeight: moderateScale(180),
        },
        SHADOWS.heroLift as ViewStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={COLORS.gradient.heroOxblood as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Foil edge along the top */}
      <LinearGradient
        colors={[foil, 'transparent'] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.foil}
      />

      {/* Diagonal sheen */}
      <LinearGradient
        colors={COLORS.gradient.glassSheen as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {stacked && (
        <View
          pointerEvents="none"
          style={[
            s.stackHint,
            { backgroundColor: COLORS.heroHairline, borderRadius: SIZES.radius.hero },
          ]}
        />
      )}

      <View style={{ padding: SIZES.padding.xxl, flex: 1, justifyContent: 'space-between' }}>
        {/* Head */}
        <View style={s.headRow}>
          <Text style={[asText(FONTS.eyebrow), { color: COLORS.heroTextTertiary }]}>
            {eyebrow}
          </Text>
          <View
            style={[
              s.iconChip,
              {
                width: moderateScale(34),
                height: moderateScale(34),
                borderRadius: moderateScale(11),
                backgroundColor: COLORS.heroGlass,
                borderColor: COLORS.heroHairline,
              },
            ]}
          >
            <Ionicons name={icon as any} size={SIZES.icon.md} color={foil} />
          </View>
        </View>

        {/* Value block */}
        <View style={{ marginTop: SIZES.margin.lg }}>
          <Text
            numberOfLines={1}
            style={[asText(FONTS.displayLg), { color: COLORS.heroTextPrimary }]}
          >
            {value}
          </Text>
          {!!secondary && (
            <Text
              numberOfLines={1}
              style={[
                asText(FONTS.micro),
                { color: COLORS.heroTextSecondary, marginTop: 2 },
              ]}
            >
              {secondary}
            </Text>
          )}
        </View>

        {/* Foot rail */}
        {(!!footValue || !!footValue2) && (
          <View
            style={[
              s.footRow,
              {
                marginTop: SIZES.margin.xl,
                paddingTop: SIZES.padding.md,
                borderTopColor: COLORS.heroHairline,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              {!!footLabel && (
                <Text
                  style={[
                    asText(FONTS.micro),
                    { color: COLORS.heroTextMuted, fontSize: 9, letterSpacing: 1.2 },
                  ]}
                >
                  {footLabel.toUpperCase()}
                </Text>
              )}
              {!!footValue && (
                <Text
                  numberOfLines={1}
                  style={[
                    asText(FONTS.microBold),
                    { color: COLORS.heroTextSecondary, marginTop: 2 },
                  ]}
                >
                  {footValue}
                </Text>
              )}
            </View>

            {!!footValue2 && (
              <View style={{ alignItems: 'flex-end' }}>
                {!!footLabel2 && (
                  <Text
                    style={[
                      asText(FONTS.micro),
                      { color: COLORS.heroTextMuted, fontSize: 9, letterSpacing: 1.2 },
                    ]}
                  >
                    {footLabel2.toUpperCase()}
                  </Text>
                )}
                <Text
                  numberOfLines={1}
                  style={[
                    asText(FONTS.microBold),
                    { color: COLORS.heroTextSecondary, marginTop: 2 },
                  ]}
                >
                  {footValue2}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Wrapper>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  foil: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  stackHint: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: -6,
    height: 12,
    opacity: 0.5,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconChip: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  footRow: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1 },
});

export default memo(WalletCard);
