// src/components/ui/premium/GoldRateWidget.tsx
//
// Live rate module. Two-column asymmetric split: the rate owns the
// left, a sparkline owns the right. Metal identity is carried by a
// thin vertical rule rather than a coloured icon chip.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  metal: 'Gold' | 'Silver' | string;
  /** Pre-formatted, e.g. "₹7,240" */
  rate: string;
  unit?: string;
  purity?: string;
  changePct?: number;
  updatedAt?: string;
  /** Recent values, oldest first */
  history?: number[];
  onPress?: () => void;
  surface?: 'light' | 'hero';
  style?: ViewStyle;
};

function GoldRateWidget({
  metal,
  rate,
  unit = 'per gram',
  purity,
  changePct,
  updatedAt,
  history = [],
  onPress,
  surface = 'light',
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale, SHADOWS} = useTheme();
  const onHero = surface === 'hero';

  const isGold = String(metal).toLowerCase().startsWith('g');
  const metalColor = isGold ? COLORS.metalGold : COLORS.metalSilver;

  const bg = onHero ? COLORS.heroElevated : COLORS.canvasElevated;
  const border = onHero ? COLORS.heroHairline : COLORS.hairline;
  const fg = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const dim = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;

  const hasChange = typeof changePct === 'number' && Number.isFinite(changePct);
  const change = hasChange ? changePct : 0;
  const up = change > 0;
  const trendColor = !hasChange || change === 0 ? dim : up
    ? onHero
      ? COLORS.heroSuccess
      : COLORS.success
    : onHero
    ? COLORS.heroDanger
    : COLORS.error;

  const Wrapper: React.ElementType = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        s.card,
        {
          borderRadius: SIZES.radius.tile,
          backgroundColor: bg,
          borderColor: border,
          padding: SIZES.padding.lg,
        },
        !onHero && (SHADOWS.hairline as ViewStyle),
        style,
      ]}
    >
      {/* Metal identity rule */}
      <View
        style={[
          s.rule,
          { backgroundColor: metalColor, borderTopLeftRadius: SIZES.radius.tile, borderBottomLeftRadius: SIZES.radius.tile },
        ]}
      />

      <View style={s.body}>
        {/* Left: identity + numeral */}
        <View style={s.leftCol}>
          <View style={s.metalRow}>
            <Text
              numberOfLines={1}
              style={[asText(FONTS.microBold), { color: dim, fontSize: 10 }]}
            >
              {String(metal).toUpperCase()}{isGold && !!purity ? ` · ${purity}` : ''}
            </Text>
          </View>

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[asText(FONTS.displaySm), { color: fg, marginTop: 4 }]}
          >
            {rate}
          </Text>

          {!!updatedAt && (
            <Text
              numberOfLines={1}
              style={[asText(FONTS.microBold), { color: dim, fontSize: 10, marginTop: 4 }]}
            >
              {updatedAt}
            </Text>
          )}
        </View>

          {hasChange && change !== 0 && (
          <View
            style={s.trendCol}
            accessible
            accessibilityLabel={`${metal} rate ${!hasChange ? 'change unavailable' : change === 0 ? 'unchanged' : `${up ? 'up' : 'down'} ${Math.abs(change).toFixed(2)} percent`}`}
          >
            <Ionicons
              name={!hasChange || change === 0 ? 'remove-outline' : up ? 'trending-up-outline' : 'trending-down-outline'}
              size={24}
              color={trendColor}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={[asText(FONTS.microBold), { color: trendColor, fontSize: 10, textAlign: 'center' }]}
            >
              {!hasChange ? 'N/A' : change === 0 ? '0.00%' : `${up ? '+' : '-'}${Math.abs(change).toFixed(2)}%`}
            </Text>
          </View>
          )}
      </View>
    </Wrapper>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  rule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  body: { flexDirection: 'row', alignItems: 'center', paddingLeft: 6 },
  leftCol: { flex: 1, minWidth: 0 },
  metalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendCol: { alignItems: 'center', justifyContent: 'center', gap: 3, width: 44, marginLeft: 6 },
});

export default memo(GoldRateWidget);
