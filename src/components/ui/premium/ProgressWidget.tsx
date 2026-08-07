// src/components/ui/premium/ProgressWidget.tsx
//
// Segmented instalment progress. Instead of a continuous bar, this
// renders one tick per instalment so a member can literally count what
// they've paid — far more legible for scheme savings than a percentage.
// Falls back to a slim continuous bar when the count is large.

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme';
import { asText, clamp01 } from './tokens';

type Props = {
  /** Instalments already paid */
  paid: number;
  /** Total instalments in the scheme */
  total: number;
  label?: string;
  /** Right-aligned note, e.g. "Next due 12 Mar" */
  note?: string;
  surface?: 'light' | 'hero';
  /** Above this many instalments, use a continuous bar */
  segmentLimit?: number;
  /** Colour of the filled portion */
  color?: string;
  compact?: boolean;
  style?: ViewStyle;
};

function ProgressWidget({
  paid,
  total,
  label,
  note,
  surface = 'light',
  segmentLimit = 24,
  color,
  compact = false,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const onHero = surface === 'hero';

  const fillColor = color ?? (onHero ? COLORS.heroAccent : COLORS.metalGold);
  const trackColor = onHero ? COLORS.heroHairline : COLORS.canvasSunken;
  const fg = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const dim = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;

  const safeTotal = Math.max(0, Math.floor(total || 0));
  const safePaid = Math.max(0, Math.min(safeTotal, Math.floor(paid || 0)));
  const ratio = safeTotal > 0 ? clamp01(safePaid / safeTotal) : 0;

  const segments = useMemo(
    () =>
      safeTotal > 0 && safeTotal <= segmentLimit
        ? Array.from({ length: safeTotal }, (_, i) => i < safePaid)
        : null,
    [safeTotal, safePaid, segmentLimit],
  );

  const barH = compact ? 4 : 6;

  return (
    <View style={style}>
      {(!!label || !!note) && (
        <View style={[s.headRow, { marginBottom: SIZES.margin.sm }]}>
          {!!label && (
            <Text
              numberOfLines={1}
              style={[asText(FONTS.eyebrow), { color: dim, flexShrink: 1 }]}
            >
              {label}
            </Text>
          )}
          {!!note && (
            <Text numberOfLines={1} style={[asText(FONTS.micro), { color: dim }]}>
              {note}
            </Text>
          )}
        </View>
      )}

      {segments ? (
        <View style={[s.segRow, { gap: safeTotal > 14 ? 2 : 3 }]}>
          {segments.map((filled, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: barH,
                borderRadius: barH / 2,
                backgroundColor: filled ? fillColor : trackColor,
              }}
            />
          ))}
        </View>
      ) : (
        <View
          style={{
            height: barH,
            borderRadius: barH / 2,
            backgroundColor: trackColor,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${ratio * 100}%`,
              height: '100%',
              borderRadius: barH / 2,
              backgroundColor: fillColor,
            }}
          />
        </View>
      )}

      {!compact && (
        <View style={[s.footRow, { marginTop: moderateScale(8) }]}>
          <Text style={[asText(FONTS.microBold), { color: fg }]}>
            {safePaid}
            <Text style={{ color: dim, fontFamily: FONTS.family.regular }}>
              {' '}
              of {safeTotal} paid
            </Text>
          </Text>
          <Text style={[asText(FONTS.microBold), { color: fillColor }]}>
            {Math.round(ratio * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  segRow: { flexDirection: 'row', alignItems: 'center' },
  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default memo(ProgressWidget);
