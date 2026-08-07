// src/components/ui/premium/MetricCard.tsx
//
// Compact paper tile for a single number. Hairline border, no drop
// shadow — the body zone gets its structure from rules, not elevation.
// Sized to sit in asymmetric 2-up / 3-up grids.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

export type MetricTone = 'default' | 'gold' | 'positive' | 'negative' | 'primary';

type Props = {
  label: string;
  value: string;
  /** Small text under the value */
  caption?: string;
  icon?: string;
  tone?: MetricTone;
  /** Signed delta rendered as a coloured micro line, e.g. "+2.4%" */
  delta?: string;
  deltaUp?: boolean;
  onPress?: () => void;
  /** Fills a flex row cell */
  flex?: number;
  /** Taller variant for the lead tile in an asymmetric grid */
  emphasis?: boolean;
  style?: ViewStyle;
};

function MetricCard({
  label,
  value,
  caption,
  icon,
  tone = 'default',
  delta,
  deltaUp = true,
  onPress,
  flex,
  emphasis = false,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale, SHADOWS} = useTheme();

  const accents: Record<MetricTone, string> = {
    default: COLORS.inkPrimary,
    gold: COLORS.metalGold,
    positive: COLORS.success,
    negative: COLORS.error,
    primary: COLORS.primary,
  };
  const accent = accents[tone];

  const Wrapper: React.ElementType = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        s.card,
        {
          flex,
          borderRadius: SIZES.radius.tile,
          borderColor: COLORS.hairline,
          backgroundColor: COLORS.canvasElevated,
          padding: emphasis ? SIZES.padding.xl : SIZES.padding.lg,
          minHeight: emphasis ? moderateScale(120) : moderateScale(96),
        },
        SHADOWS.hairline as ViewStyle,
        style,
      ]}
    >
      {!!icon && (
        <View
          style={[
            s.iconChip,
            {
              width: moderateScale(30),
              height: moderateScale(30),
              borderRadius: moderateScale(10),
              backgroundColor: COLORS.canvasSunken,
              marginBottom: SIZES.margin.sm,
            },
          ]}
        >
          <Ionicons name={icon as any} size={SIZES.icon.sm} color={accent} />
        </View>
      )}

      <Text
        numberOfLines={1}
        style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}
      >
        {label}
      </Text>

      <Text
        numberOfLines={1}
        style={[
          asText(emphasis ? FONTS.displayMd : FONTS.displaySm),
          { color: accent, marginTop: 4 },
        ]}
      >
        {value}
      </Text>

      {!!caption && (
        <Text
          numberOfLines={1}
          style={[asText(FONTS.micro), { color: COLORS.inkTertiary, marginTop: 2 }]}
        >
          {caption}
        </Text>
      )}

      {!!delta && (
        <View style={[s.deltaRow, { marginTop: 6 }]}>
          <Ionicons
            name={deltaUp ? 'arrow-up' : 'arrow-down'}
            size={11}
            color={deltaUp ? COLORS.success : COLORS.error}
          />
          <Text
            style={[
              asText(FONTS.microBold),
              { color: deltaUp ? COLORS.success : COLORS.error },
            ]}
          >
            {delta}
          </Text>
        </View>
      )}
    </Wrapper>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, justifyContent: 'center' },
  iconChip: { alignItems: 'center', justifyContent: 'center' },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});

export default memo(MetricCard);
