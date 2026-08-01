// src/components/ui/premium/EmptyState.tsx
//
// Calm empty state. No dashed borders, no oversized icon rings — a
// hairline square mark, a short headline, one line of body copy and at
// most one action.

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';
import PremiumButton from './PremiumButton';

type Props = {
  title: string;
  body?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  surface?: 'light' | 'hero';
  compact?: boolean;
  style?: ViewStyle;
};

function EmptyState({
  title,
  body,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  surface = 'light',
  compact = false,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const onHero = surface === 'hero';

  const fg = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const dim = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;
  const border = onHero ? COLORS.heroHairline : COLORS.hairline;
  const mark = moderateScale(compact ? 44 : 56);

  return (
    <View
      style={[
        s.wrap,
        { paddingVertical: compact ? SIZES.padding.xxl : SIZES.padding.xxxl * 1.5 },
        style,
      ]}
    >
      <View
        style={[
          s.mark,
          {
            width: mark,
            height: mark,
            borderRadius: SIZES.radius.tile,
            borderColor: border,
          },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={compact ? SIZES.icon.lg : SIZES.icon.xl}
          color={dim}
        />
      </View>

      <Text
        style={[
          asText(compact ? FONTS.microBold : FONTS.displaySm),
          { color: fg, textAlign: 'center', marginTop: SIZES.margin.lg },
        ]}
      >
        {title}
      </Text>

      {!!body && (
        <Text
          style={[
            asText(FONTS.micro),
            {
              color: dim,
              textAlign: 'center',
              marginTop: 6,
              maxWidth: moderateScale(260),
            },
          ]}
        >
          {body}
        </Text>
      )}

      {!!actionLabel && !!onAction && (
        <PremiumButton
          label={actionLabel}
          onPress={onAction}
          variant={onHero ? 'glass' : 'solid'}
          size="sm"
          block={false}
          style={{ marginTop: SIZES.margin.xl }}
        />
      )}

      {!!secondaryLabel && !!onSecondary && (
        <PremiumButton
          label={secondaryLabel}
          onPress={onSecondary}
          variant="quiet"
          size="sm"
          block={false}
          style={{ marginTop: 4 }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  mark: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(EmptyState);
