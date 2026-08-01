// src/components/ui/premium/FeatureCard.tsx
//
// Promotional / editorial card. Comes in three weights so a screen can
// mix sizes without repeating the same rectangle:
//   'wide'    — full-bleed dark banner with a gold rule
//   'compact' — paper tile, icon left, text right
//   'poster'  — tall paper tile with a large numeral or emoji-free mark

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  title: string;
  body?: string;
  eyebrow?: string;
  icon?: string;
  weight?: 'wide' | 'compact' | 'poster';
  /** Text shown on the right edge of a 'wide' card */
  actionLabel?: string;
  onPress?: () => void;
  /** Overrides the accent, e.g. per-offer colour */
  accent?: string;
  width?: number;
  style?: ViewStyle;
};

function FeatureCard({
  title,
  body,
  eyebrow,
  icon,
  weight = 'wide',
  actionLabel,
  onPress,
  accent,
  width,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS, moderateScale } = useTheme();
  const gold = accent ?? COLORS.metalGold;

  // ── WIDE: dark banner ────────────────────────────────────────
  if (weight === 'wide') {
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          s.wide,
          {
            width,
            borderRadius: SIZES.radius.panel,
            borderColor: COLORS.heroHairline,
            opacity: pressed ? 0.92 : 1,
          },
          SHADOWS.lift as ViewStyle,
          style,
        ]}
      >
        <LinearGradient
          colors={COLORS.gradient.heroEmber as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[s.goldRule, { backgroundColor: gold }]} />

        <View
          style={{
            padding: SIZES.padding.xl,
            paddingLeft: SIZES.padding.xl + 4,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {!!icon && (
            <View
              style={[
                s.iconChip,
                {
                  width: moderateScale(42),
                  height: moderateScale(42),
                  borderRadius: moderateScale(14),
                  backgroundColor: COLORS.heroGlass,
                  borderColor: COLORS.heroHairline,
                },
              ]}
            >
              <Ionicons name={icon as any} size={SIZES.icon.lg} color={gold} />
            </View>
          )}

          <View style={{ flex: 1 }}>
            {!!eyebrow && (
              <Text style={[asText(FONTS.eyebrow), { color: gold }]}>
                {eyebrow}
              </Text>
            )}
            <Text
              numberOfLines={2}
              style={[
                asText(FONTS.microBold),
                {
                  color: COLORS.heroTextPrimary,
                  fontSize: SIZES.font.md,
                  marginTop: eyebrow ? 3 : 0,
                },
              ]}
            >
              {title}
            </Text>
            {!!body && (
              <Text
                numberOfLines={2}
                style={[
                  asText(FONTS.micro),
                  { color: COLORS.heroTextTertiary, marginTop: 3 },
                ]}
              >
                {body}
              </Text>
            )}
          </View>

          {!!actionLabel ? (
            <Text style={[asText(FONTS.microBold), { color: gold }]}>
              {actionLabel}
            </Text>
          ) : (
            !!onPress && (
              <Ionicons
                name="arrow-forward"
                size={SIZES.icon.md}
                color={COLORS.heroTextTertiary}
              />
            )
          )}
        </View>
      </Pressable>
    );
  }

  // ── POSTER: tall paper tile ──────────────────────────────────
  if (weight === 'poster') {
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          s.poster,
          {
            width,
            borderRadius: SIZES.radius.panel,
            backgroundColor: COLORS.canvasElevated,
            borderColor: COLORS.hairline,
            padding: SIZES.padding.xl,
            minHeight: moderateScale(150),
            opacity: pressed ? 0.9 : 1,
          },
          style,
        ]}
      >
        {!!icon && (
          <View
            style={[
              s.iconChip,
              {
                width: moderateScale(40),
                height: moderateScale(40),
                borderRadius: moderateScale(13),
                backgroundColor: COLORS.canvasSunken,
                borderColor: 'transparent',
              },
            ]}
          >
            <Ionicons name={icon as any} size={SIZES.icon.lg} color={gold} />
          </View>
        )}

        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {!!eyebrow && (
            <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}>
              {eyebrow}
            </Text>
          )}
          <Text
            numberOfLines={2}
            style={[
              asText(FONTS.displaySm),
              { color: COLORS.inkPrimary, marginTop: 3 },
            ]}
          >
            {title}
          </Text>
          {!!body && (
            <Text
              numberOfLines={3}
              style={[
                asText(FONTS.micro),
                { color: COLORS.inkTertiary, marginTop: 4 },
              ]}
            >
              {body}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  // ── COMPACT: paper row ───────────────────────────────────────
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        s.compact,
        {
          width,
          borderRadius: SIZES.radius.tile,
          backgroundColor: COLORS.canvasElevated,
          borderColor: COLORS.hairline,
          padding: SIZES.padding.lg,
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {!!icon && (
        <View
          style={[
            s.iconChip,
            {
              width: moderateScale(38),
              height: moderateScale(38),
              borderRadius: moderateScale(12),
              backgroundColor: COLORS.canvasSunken,
              borderColor: 'transparent',
            },
          ]}
        >
          <Ionicons name={icon as any} size={SIZES.icon.md} color={gold} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[asText(FONTS.microBold), { color: COLORS.inkPrimary }]}
        >
          {title}
        </Text>
        {!!body && (
          <Text
            numberOfLines={2}
            style={[
              asText(FONTS.micro),
              { color: COLORS.inkTertiary, fontSize: 10, marginTop: 2 },
            ]}
          >
            {body}
          </Text>
        )}
      </View>

      {!!onPress && (
        <Ionicons
          name="chevron-forward"
          size={SIZES.icon.sm}
          color={COLORS.inkMuted}
        />
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  wide: { borderWidth: 1, overflow: 'hidden' },
  poster: { borderWidth: 1, gap: 12 },
  compact: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goldRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  iconChip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default memo(FeatureCard);
