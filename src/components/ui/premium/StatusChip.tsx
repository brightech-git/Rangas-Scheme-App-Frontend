// src/components/ui/premium/StatusChip.tsx
//
// Small status pill. Two surfaces: `light` (on the paper body) and
// `hero` (on the dark hero zone). UI only.

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

export type ChipTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gold';

export type ChipSurface = 'light' | 'hero';

type Props = {
  label: string;
  tone?: ChipTone;
  surface?: ChipSurface;
  icon?: string;
  /** Show a small leading dot instead of an icon */
  dot?: boolean;
  style?: ViewStyle;
};

function StatusChip({
  label,
  tone = 'neutral',
  surface = 'light',
  icon,
  dot = false,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES } = useTheme();

  const palette: Record<ChipTone, { fg: string; bg: string }> = {
    neutral: { fg: COLORS.inkSecondary, bg: COLORS.canvasSunken },
    success: { fg: COLORS.success, bg: COLORS.successBg },
    warning: { fg: COLORS.warningDark, bg: COLORS.warningBg },
    danger: { fg: COLORS.error, bg: COLORS.errorBg },
    info: { fg: COLORS.info, bg: COLORS.infoBg },
    gold: { fg: COLORS.metalGold, bg: COLORS.metalGoldSoft },
  };

  const heroPalette: Record<ChipTone, { fg: string; bg: string }> = {
    neutral: { fg: COLORS.heroTextSecondary, bg: COLORS.heroGlass },
    success: { fg: COLORS.successLight, bg: 'rgba(39, 174, 96, 0.16)' },
    warning: { fg: COLORS.secondaryLight, bg: 'rgba(255, 204, 0, 0.16)' },
    danger: { fg: COLORS.primaryLighter, bg: 'rgba(221, 32, 32, 0.20)' },
    info: { fg: COLORS.infoLight, bg: 'rgba(46, 134, 222, 0.18)' },
    gold: { fg: COLORS.heroAccent, bg: COLORS.heroAccentSoft },
  };

  const c = surface === 'hero' ? heroPalette[tone] : palette[tone];

  return (
    <View
      style={[
        s.chip,
        {
          backgroundColor: c.bg,
          borderRadius: SIZES.radius.pill,
          paddingHorizontal: SIZES.padding.md,
          paddingVertical: SIZES.padding.xs + 1,
        },
        style,
      ]}
    >
      {dot ? (
        <View style={[s.dot, { backgroundColor: c.fg }]} />
      ) : icon ? (
        <Ionicons name={icon as any} size={SIZES.icon.xs} color={c.fg} />
      ) : null}

      <Text
        numberOfLines={1}
        style={[
          asText(FONTS.microBold),
          { color: c.fg, letterSpacing: 0.4 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

export default memo(StatusChip);
