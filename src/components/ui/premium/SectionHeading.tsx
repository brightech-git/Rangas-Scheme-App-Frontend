// src/components/ui/premium/SectionHeading.tsx
//
// Editorial section header: wide-tracked micro-caps eyebrow stacked
// over a large title, with an optional quiet trailing action.
// Replaces the old left-red-bar + "See all" pill pattern entirely.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  /** Micro-caps line above the title, e.g. "PORTFOLIO" */
  eyebrow?: string;
  title: string;
  /** Small note under the title */
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Render for the dark hero zone */
  surface?: 'light' | 'hero';
  /** Counter shown as a hairline pill next to the title */
  count?: number;
  style?: ViewStyle;
};

function SectionHeading({
  eyebrow,
  title,
  caption,
  actionLabel,
  onAction,
  surface = 'light',
  count,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES } = useTheme();
  const onHero = surface === 'hero';

  const titleColor = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const eyebrowColor = onHero ? COLORS.heroAccent : COLORS.primaryInk;
  const captionColor = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;
  const countBorder = onHero ? COLORS.heroHairline : COLORS.hairline;

  return (
    <View style={[s.wrap, style]}>
      <View style={s.textCol}>
        {!!eyebrow && (
          <Text style={[asText(FONTS.eyebrow), { color: eyebrowColor }]}>
            {eyebrow}
          </Text>
        )}

        <View style={s.titleRow}>
          <Text
            numberOfLines={1}
            style={[
              asText(FONTS.displaySm),
              { color: titleColor, flexShrink: 1 },
            ]}
          >
            {title}
          </Text>

          {count != null && count > 0 && (
            <View
              style={[
                s.countPill,
                {
                  borderColor: countBorder,
                  borderRadius: SIZES.radius.pill,
                },
              ]}
            >
              <Text style={[asText(FONTS.micro), { color: captionColor }]}>
                {count}
              </Text>
            </View>
          )}
        </View>

        {!!caption && (
          <Text
            numberOfLines={1}
            style={[asText(FONTS.micro), { color: captionColor, marginTop: 2 }]}
          >
            {caption}
          </Text>
        )}
      </View>

      {!!actionLabel && !!onAction && (
        <Pressable
          onPress={onAction}
          hitSlop={12}
          style={({ pressed }) => [s.action, { opacity: pressed ? 0.55 : 1 }]}
        >
          <Text
            style={[
              asText(FONTS.microBold),
              { color: onHero ? COLORS.heroAccent : COLORS.primaryInk },
            ]}
          >
            {actionLabel}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={SIZES.icon.xs}
            color={onHero ? COLORS.heroAccent : COLORS.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  textCol: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 1,
    minWidth: 24,
    alignItems: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 3,
  },
});

export default memo(SectionHeading);
