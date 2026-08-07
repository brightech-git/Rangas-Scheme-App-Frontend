// src/components/ui/premium/AnalyticsCard.tsx
//
// Full-width trend panel: headline figure top-left, delta chip
// top-right, wide sparkline beneath, and an optional axis rail of
// labels. Used for rate history and savings-over-time views.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme';
import { asText } from './tokens';
import Sparkline from './Sparkline';
import StatusChip from './StatusChip';

export type RangeOption = { key: string; label: string };

type Props = {
  eyebrow?: string;
  /** Headline figure */
  value: string;
  caption?: string;
  changePct?: number;
  data: number[];
  /** Inner width available for the chart — pass the measured width */
  chartWidth: number;
  chartHeight?: number;
  color?: string;
  /** Labels rendered under the chart, evenly spaced */
  axisLabels?: string[];
  /** Optional range selector rail */
  ranges?: RangeOption[];
  activeRange?: string;
  onRangeChange?: (key: string) => void;
  surface?: 'light' | 'hero';
  style?: ViewStyle;
};

function AnalyticsCard({
  eyebrow,
  value,
  caption,
  changePct,
  data,
  chartWidth,
  chartHeight,
  color,
  axisLabels = [],
  ranges = [],
  activeRange,
  onRangeChange,
  surface = 'light',
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale, SHADOWS} = useTheme();
  const onHero = surface === 'hero';

  const bg = onHero ? COLORS.heroElevated : COLORS.canvasElevated;
  const border = onHero ? COLORS.heroHairline : COLORS.hairline;
  const fg = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const dim = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;
  const line = color ?? COLORS.metalGold;

  const up = (changePct ?? 0) >= 0;
  const h = chartHeight ?? moderateScale(92);

  return (
    <View
      style={[
        s.card,
        {
          borderRadius: SIZES.radius.panel,
          backgroundColor: bg,
          borderColor: border,
          paddingTop: SIZES.padding.xl,
        },
        !onHero && (SHADOWS.hairline as ViewStyle),
        style,
      ]}
    >
      {/* Head */}
      <View style={[s.head, { paddingHorizontal: SIZES.padding.xl }]}>
        <View style={{ flex: 1 }}>
          {!!eyebrow && (
            <Text style={[asText(FONTS.eyebrow), { color: dim }]}>{eyebrow}</Text>
          )}
          <Text
            numberOfLines={1}
            style={[asText(FONTS.displayMd), { color: fg, marginTop: 3 }]}
          >
            {value}
          </Text>
          {!!caption && (
            <Text
              numberOfLines={1}
              style={[asText(FONTS.micro), { color: dim, marginTop: 2 }]}
            >
              {caption}
            </Text>
          )}
        </View>

        {changePct != null && (
          <StatusChip
            label={`${up ? '+' : ''}${changePct.toFixed(2)}%`}
            tone={up ? 'success' : 'danger'}
            surface={onHero ? 'hero' : 'light'}
            icon={up ? 'trending-up' : 'trending-down'}
          />
        )}
      </View>

      {/* Chart */}
      <View style={{ marginTop: SIZES.margin.xl }}>
        <Sparkline
          data={data}
          width={chartWidth}
          height={h}
          color={line}
          strokeWidth={2.5}
        />
      </View>

      {/* Axis rail */}
      {axisLabels.length > 0 && (
        <View
          style={[
            s.axis,
            {
              paddingHorizontal: SIZES.padding.xl,
              paddingTop: SIZES.padding.sm,
            },
          ]}
        >
          {axisLabels.map((l, i) => (
            <Text
              key={`${l}-${i}`}
              style={[asText(FONTS.micro), { color: dim, fontSize: 9 }]}
            >
              {l}
            </Text>
          ))}
        </View>
      )}

      {/* Range selector */}
      {ranges.length > 0 && (
        <View
          style={[
            s.ranges,
            {
              borderTopColor: border,
              marginTop: SIZES.margin.md,
            },
          ]}
        >
          {ranges.map((r, i) => {
            const active = r.key === activeRange;
            return (
              <Pressable
                key={r.key}
                onPress={() => onRangeChange?.(r.key)}
                style={({ pressed }) => [
                  s.rangeBtn,
                  {
                    paddingVertical: SIZES.padding.md,
                    borderLeftWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                    borderLeftColor: border,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    asText(FONTS.microBold),
                    { color: active ? line : dim },
                  ]}
                >
                  {r.label}
                </Text>
                {active && (
                  <View style={[s.activeRule, { backgroundColor: line }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {ranges.length === 0 && <View style={{ height: SIZES.padding.lg }} />}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  ranges: { flexDirection: 'row', borderTopWidth: 1 },
  rangeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeRule: {
    position: 'absolute',
    bottom: 0,
    left: '30%',
    right: '30%',
    height: 2,
    borderRadius: 1,
  },
});

export default memo(AnalyticsCard);
