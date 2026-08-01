// src/components/ui/premium/PaymentTile.tsx
//
// Selectable option row for payment methods, amount presets and
// instalment choices. Selection is expressed by a filled spine and a
// ring marker rather than a coloured background wash, so a long list
// of options stays calm.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  title: string;
  /** Secondary line under the title */
  subtitle?: string;
  /** Right-aligned value, e.g. an amount */
  value?: string;
  icon?: string;
  selected?: boolean;
  disabled?: boolean;
  /** Small pill on the right, e.g. "RECOMMENDED" */
  tag?: string;
  onPress?: () => void;
  /** 'radio' shows a ring, 'check' shows a tick, 'none' shows nothing */
  marker?: 'radio' | 'check' | 'none';
  surface?: 'light' | 'hero';
  style?: ViewStyle;
};

function PaymentTile({
  title,
  subtitle,
  value,
  icon,
  selected = false,
  disabled = false,
  tag,
  onPress,
  marker = 'radio',
  surface = 'light',
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const onHero = surface === 'hero';

  const bg = onHero ? COLORS.heroElevated : COLORS.canvasElevated;
  const border = onHero ? COLORS.heroHairline : COLORS.hairline;
  const fg = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const dim = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;
  const accent = onHero ? COLORS.heroAccent : COLORS.primary;

  const ring = moderateScale(20);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        s.tile,
        {
          borderRadius: SIZES.radius.tile,
          backgroundColor: bg,
          borderColor: selected ? accent : border,
          borderWidth: selected ? 1.5 : 1,
          padding: SIZES.padding.lg,
          paddingLeft: SIZES.padding.lg + 4,
          opacity: disabled ? 0.42 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {/* Selected spine */}
      {selected && <View style={[s.spine, { backgroundColor: accent }]} />}

      {!!icon && (
        <View
          style={[
            s.iconChip,
            {
              width: moderateScale(38),
              height: moderateScale(38),
              borderRadius: moderateScale(12),
              backgroundColor: onHero ? COLORS.heroGlass : COLORS.canvasSunken,
            },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={SIZES.icon.md}
            color={selected ? accent : dim}
          />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={s.titleRow}>
          <Text
            numberOfLines={1}
            style={[asText(FONTS.microBold), { color: fg, flexShrink: 1 }]}
          >
            {title}
          </Text>
          {!!tag && (
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
                  fontSize: 8,
                  letterSpacing: 0.7,
                  fontFamily: FONTS.family.semiBold,
                  color: COLORS.metalGold,
                }}
              >
                {tag}
              </Text>
            </View>
          )}
        </View>

        {!!subtitle && (
          <Text
            numberOfLines={2}
            style={[
              asText(FONTS.micro),
              { color: dim, fontSize: 10, marginTop: 2 },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {!!value && (
        <Text
          numberOfLines={1}
          style={[asText(FONTS.numeralSm), { color: fg }]}
        >
          {value}
        </Text>
      )}

      {marker !== 'none' && (
        <View
          style={[
            s.marker,
            {
              width: ring,
              height: ring,
              borderRadius: marker === 'check' ? SIZES.radius.xs : ring / 2,
              borderColor: selected ? accent : border,
              backgroundColor: selected ? accent : 'transparent',
            },
          ]}
        >
          {selected && (
            <Ionicons
              name="checkmark"
              size={13}
              color={onHero ? COLORS.heroCanvas : COLORS.white}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  iconChip: { alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tag: { paddingHorizontal: 5, paddingVertical: 2 },
  marker: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(PaymentTile);
