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
import Sparkline from './Sparkline';

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
  /** Width available to the sparkline */
  sparkWidth?: number;
  style?: ViewStyle;
};

function GoldRateWidget({
  metal,
  rate,
  unit = 'per gram',
  purity,
  changePct = 0,
  updatedAt,
  history = [],
  onPress,
  surface = 'light',
  sparkWidth = 92,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const onHero = surface === 'hero';

  const isGold = String(metal).toLowerCase().startsWith('g');
  const metalColor = isGold ? COLORS.metalGold : COLORS.metalSilver;

  const bg = onHero ? COLORS.heroElevated : COLORS.canvasElevated;
  const border = onHero ? COLORS.heroHairline : COLORS.hairline;
  const fg = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const dim = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;

  const up = changePct >= 0;
  const trendColor = up
    ? onHero
      ? COLORS.successLight
      : COLORS.success
    : onHero
    ? COLORS.primaryLighter
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
          padding: SIZES.padding.xl,
        },
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
        <View style={{ flex: 1 }}>
          <View style={s.metalRow}>
            <Text style={[asText(FONTS.microBold), { color: COLORS.whiteOpacity50, fontSize: 10 }]}>
              {String(metal).toUpperCase()}
            </Text>
            {!!purity && (
              <Text style={[asText(FONTS.microBold), { color: COLORS.whiteOpacity50, fontSize: 10 }]}>
                · {purity}
              </Text>
            )}
          </View>

          <Text
            numberOfLines={1}
            style={[asText(FONTS.displaySm), { color: fg, marginTop: 4 }]}
          >
            {rate}
          </Text>

          
          {!!updatedAt && (
            <Text
              numberOfLines={1}
              style={[asText(FONTS.microBold), { color: COLORS.whiteOpacity50, fontSize: 10, marginTop: 2 }]}
            >
              Updated {updatedAt}
            </Text>
          )}
        </View>

        {/* Right: trend */}
        {/* {history.length > 1 && (
          <View style={{ justifyContent: 'center' }}>
            <Sparkline
              data={history}
              width={sparkWidth}
              height={moderateScale(46)}
              color={metalColor}
            />
          </View>
        )} */}
      </View>
    </Wrapper>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  rule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  body: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 6 },
  metalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
});

export default memo(GoldRateWidget);
