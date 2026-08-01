// src/components/ui/premium/BottomActionBar.tsx
//
// Pinned commit bar for transactional screens (join scheme, pay
// instalment, buy gold). Shows the figure the user is committing to on
// the left and the single action on the right — so the amount is never
// off-screen at the moment of confirmation.

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';
import { asText } from './tokens';
import PremiumButton, { PremiumButtonVariant } from './PremiumButton';

type Props = {
  /** Micro-caps label above the figure, e.g. "TOTAL PAYABLE" */
  label?: string;
  /** The figure itself */
  value?: string;
  /** Small note under the figure */
  note?: string;
  actionLabel: string;
  onAction?: () => void;
  actionVariant?: PremiumButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  /** Optional secondary text action rendered above the bar */
  helper?: React.ReactNode;
  surface?: 'light' | 'hero';
  style?: ViewStyle;
};

function BottomActionBar({
  label,
  value,
  note,
  actionLabel,
  onAction,
  actionVariant = 'solid',
  loading = false,
  disabled = false,
  helper,
  surface = 'light',
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS } = useTheme();
  const onHero = surface === 'hero';

  const bg = onHero ? COLORS.heroElevated : COLORS.canvasElevated;
  const border = onHero ? COLORS.heroHairline : COLORS.hairline;
  const fg = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const dim = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;

  const hasFigure = !!value;

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderTopWidth: 1,
          borderTopColor: border,
        },
        SHADOWS.bar as ViewStyle,
        style,
      ]}
    >
      <SafeAreaView edges={['bottom']}>
        <View
          style={{
            paddingHorizontal: SIZES.layout.gutter,
            paddingTop: SIZES.padding.lg,
            paddingBottom: SIZES.padding.md,
            gap: helper ? 10 : 0,
          }}
        >
          {helper}

          <View style={s.row}>
            {hasFigure && (
              <View style={{ flex: 1, paddingRight: 14 }}>
                {!!label && (
                  <Text style={[asText(FONTS.eyebrow), { color: dim }]}>
                    {label}
                  </Text>
                )}
                <Text
                  numberOfLines={1}
                  style={[asText(FONTS.displaySm), { color: fg, marginTop: 2 }]}
                >
                  {value}
                </Text>
                {!!note && (
                  <Text
                    numberOfLines={1}
                    style={[
                      asText(FONTS.micro),
                      { color: dim, fontSize: 10, marginTop: 1 },
                    ]}
                  >
                    {note}
                  </Text>
                )}
              </View>
            )}

            <PremiumButton
              label={actionLabel}
              onPress={onAction}
              variant={actionVariant}
              size="md"
              loading={loading}
              disabled={disabled}
              block={!hasFigure}
              iconRight={hasFigure ? undefined : 'arrow-forward'}
              style={hasFigure ? { minWidth: 150 } : undefined}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});

export default memo(BottomActionBar);
