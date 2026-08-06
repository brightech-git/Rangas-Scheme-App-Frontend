// src/components/ui/premium/SummaryCard.tsx
//
// Paper panel that renders a titled list of label/value rows separated
// by hairlines. Used anywhere a screen needs a "receipt" block:
// scheme details, payment breakdowns, profile facts, KYC summaries.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

export type SummaryRow = {
  label: string;
  value: string;
  /** Renders the value in the accent colour */
  highlight?: boolean;
  /** Renders the row bigger, for totals */
  total?: boolean;
  icon?: string;
  onPress?: () => void;
  /** Allows value to wrap to multiple lines (e.g. for long addresses) */
  multiline?: boolean;
  numberOfLines?: number;
};

type Props = {
  title?: string;
  eyebrow?: string;
  rows: SummaryRow[];
  /** Optional footer slot, e.g. a PremiumButton */
  footer?: React.ReactNode;
  /** Dark variant for use inside the hero zone */
  surface?: 'light' | 'hero';
  style?: ViewStyle;
};

function SummaryCard({
  title,
  eyebrow,
  rows,
  footer,
  surface = 'light',
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS} = useTheme();
  const onHero = surface === 'hero';

  const bg = onHero ? COLORS.heroElevated : COLORS.canvasElevated;
  const border = onHero ? COLORS.heroHairline : COLORS.hairline;
  const labelColor = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;
  const valueColor = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const titleColor = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const accent = onHero ? COLORS.heroAccent : COLORS.primary;

  return (
    <View
      style={[
        s.card,
        {
          borderRadius: SIZES.radius.panel,
          backgroundColor: bg,
          borderColor: border,
        },
        !onHero && (SHADOWS.hairline as ViewStyle),
        style,
      ]}
    >
      {(!!title || !!eyebrow) && (
        <View
          style={{
            paddingHorizontal: SIZES.padding.xl,
            paddingTop: SIZES.padding.xl,
            paddingBottom: SIZES.padding.md,
          }}
        >
          {!!eyebrow && (
            <Text style={[asText(FONTS.eyebrow), { color: accent }]}>
              {eyebrow}
            </Text>
          )}
          {!!title && (
            <Text
              style={[
                asText(FONTS.displaySm),
                { color: titleColor, marginTop: eyebrow ? 3 : 0 },
              ]}
            >
              {title}
            </Text>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: SIZES.padding.xl }}>
        {rows.map((r, i) => {
          const RowWrapper: React.ElementType = r.onPress ? Pressable : View;
          const isMulti = r.multiline || (r.numberOfLines !== undefined && r.numberOfLines !== 1);
          const numLines = isMulti ? (r.numberOfLines && r.numberOfLines > 0 ? r.numberOfLines : undefined) : 1;

          return (
            <RowWrapper
              key={`${r.label}-${i}`}
              onPress={r.onPress}
              style={[
                s.row,
                {
                  paddingVertical: r.total ? SIZES.padding.lg : SIZES.padding.md,
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: border,
                  alignItems: isMulti ? 'flex-start' : 'center',
                },
              ]}
            >
              <View style={s.labelWrap}>
                {!!r.icon && (
                  <Ionicons
                    name={r.icon as any}
                    size={SIZES.icon.sm}
                    color={labelColor}
                  />
                )}
                <Text
                  numberOfLines={2}
                  style={[
                    asText(r.total ? FONTS.microBold : FONTS.micro),
                    { color: r.total ? valueColor : labelColor, flexShrink: 1 },
                  ]}
                >
                  {r.label}
                </Text>
              </View>

              <View style={[s.valueWrap, isMulti ? { flex: 1, flexShrink: 1 } : undefined]}>
                <Text
                  numberOfLines={numLines}
                  style={[
                    asText(r.total ? FONTS.numeral : FONTS.numeralSm),
                    { color: r.highlight ? accent : valueColor, textAlign: 'right' },
                  ]}
                >
                  {r.value}
                </Text>
                {!!r.onPress && (
                  <Ionicons
                    name="chevron-forward"
                    size={SIZES.icon.sm}
                    color={labelColor}
                  />
                )}
              </View>
            </RowWrapper>
          );
        })}
      </View>

      {!!footer && (
        <View
          style={{
            paddingHorizontal: SIZES.padding.xl,
            paddingTop: SIZES.padding.lg,
            paddingBottom: SIZES.padding.xl,
          }}
        >
          {footer}
        </View>
      )}

      {!footer && <View style={{ height: SIZES.padding.md }} />}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
});

export default memo(SummaryCard);
