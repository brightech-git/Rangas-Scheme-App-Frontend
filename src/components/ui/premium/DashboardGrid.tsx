// src/components/ui/premium/DashboardGrid.tsx
//
// Quick-action grid. Deliberately NOT the old horizontal strip of
// circles: this is a bordered lattice where each cell is a square with
// the icon top-left and the label bottom-left, sharing hairlines with
// its neighbours so the whole block reads as one engraved panel.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

export type GridAction = {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
  /** Small corner tag, e.g. "NEW" */
  tag?: string;
  /** Tints the icon gold */
  featured?: boolean;
  disabled?: boolean;
};

type Props = {
  actions: GridAction[];
  /** Cells per row. 3 gives the intended rhythm. */
  columns?: number;
  /** Dark variant for placing the lattice inside the hero zone */
  surface?: 'light' | 'hero';
  style?: ViewStyle;
};

function DashboardGrid({
  actions,
  columns = 3,
  surface = 'light',
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale, SHADOWS} = useTheme();
  const onHero = surface === 'hero';

  const bg = onHero ? COLORS.heroElevated : COLORS.canvasElevated;
  const border = onHero ? COLORS.heroHairline : COLORS.hairline;
  const fg = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const iconFg = onHero ? COLORS.heroTextSecondary : COLORS.inkSecondary;
  const accent = onHero ? COLORS.heroAccent : COLORS.metalGold;

  const rows: GridAction[][] = [];
  for (let i = 0; i < actions.length; i += columns) {
    rows.push(actions.slice(i, i + columns));
  }

  return (
    <View
      style={[
        s.wrap,
        {
          borderRadius: SIZES.radius.panel,
          backgroundColor: bg,
          borderColor: border,
        },
        !onHero && (SHADOWS.hairline as ViewStyle),
        style,
      ]}
    >
      {rows.map((row, rIdx) => (
        <View
          key={`row-${rIdx}`}
          style={[
            s.row,
            rIdx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border },
          ]}
        >
          {row.map((a, cIdx) => (
            <Pressable
              key={a.key}
              onPress={a.onPress}
              disabled={a.disabled}
              style={({ pressed }) => [
                s.cell,
                {
                  minHeight: moderateScale(88),
                  padding: SIZES.padding.lg,
                  opacity: a.disabled ? 0.38 : pressed ? 0.55 : 1,
                  borderLeftWidth: cIdx === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderLeftColor: border,
                },
              ]}
            >
              <View style={s.cellTop}>
                <Ionicons
                  name={a.icon as any}
                  size={SIZES.icon.lg}
                  color={a.featured ? accent : iconFg}
                />
                {!!a.tag && (
                  <View
                    style={[
                      s.tag,
                      {
                        backgroundColor: onHero
                          ? COLORS.heroAccentSoft
                          : COLORS.metalGoldSoft,
                        borderRadius: SIZES.radius.xs,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.family.semiBold,
                        fontSize: 8,
                        letterSpacing: 0.8,
                        color: accent,
                      }}
                    >
                      {a.tag}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                numberOfLines={2}
                style={[
                  asText(FONTS.microBold),
                  { color: fg, marginTop: SIZES.margin.md },
                ]}
              >
                {a.label}
              </Text>
            </Pressable>
          ))}

          {/* Pad the final row so cells keep their width */}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View
                key={`pad-${i}`}
                style={[
                  s.cell,
                  {
                    borderLeftWidth: StyleSheet.hairlineWidth,
                    borderLeftColor: border,
                  },
                ]}
              />
            ))}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  cell: { flex: 1, justifyContent: 'space-between' },
  cellTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tag: { paddingHorizontal: 5, paddingVertical: 2 },
});

export default memo(DashboardGrid);
