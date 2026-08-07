// src/components/ui/premium/HeroCard.tsx
//
// The floating summary slab. Designed to be pulled UP with a negative
// top margin so it straddles the hero/body seam — half dark zone, half
// paper. This overlap is the signature move of the whole redesign.
//
// Hierarchy inside the card is asymmetric on purpose: one very large
// numeral owns the left, and up to three hairline-separated stats sit
// in a row beneath it.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

export type HeroStat = {
  label: string;
  value: string;
  /** Optional tint for the value, e.g. success green */
  tone?: 'default' | 'gold' | 'positive' | 'negative';
};

type Props = {
  /** Micro-caps line, e.g. "TOTAL SAVED" */
  eyebrow: string;
  /** The one big number */
  value: string;
  /** Small unit or suffix rendered inline after the value */
  unit?: string;
  /** Delta / status line under the value */
  note?: string;
  noteTone?: 'default' | 'positive' | 'negative' | 'gold';
  stats?: HeroStat[];
  /** Trailing icon button in the top-right */
  actionIcon?: string;
  onActionPress?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
};

function HeroCard({
  eyebrow,
  value,
  unit,
  note,
  noteTone = 'default',
  stats = [],
  actionIcon,
  onActionPress,
  onPress,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS, moderateScale } = useTheme();

  const toneColor = (t?: string): string => {
    switch (t) {
      case 'gold':
        return COLORS.heroAccent;
      case 'positive':
        return COLORS.heroSuccess;
      case 'negative':
        return COLORS.heroDanger;
      default:
        return COLORS.heroTextSecondary;
    }
  };

  const Wrapper: React.ElementType = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        s.card,
        {
          borderRadius: SIZES.radius.hero,
          backgroundColor: COLORS.heroElevated,
          borderColor: COLORS.heroHairline,
        },
        SHADOWS.heroLift as ViewStyle,
        style,
      ]}
    >
      {/* Gold rake across the top-left corner */}
      <LinearGradient
        colors={COLORS.gradient.heroGoldWash as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: SIZES.radius.hero }]}
        pointerEvents="none"
      />

      <View style={{ padding: SIZES.padding.xxl }}>
        {/* ── Eyebrow + optional action ── */}
        <View style={s.topRow}>
          <Text style={[asText(FONTS.eyebrow), { color: COLORS.heroTextTertiary }]}>
            {eyebrow}
          </Text>

          {!!actionIcon && (
            <Pressable
              onPress={onActionPress}
              hitSlop={10}
              style={({ pressed }) => [
                s.actionBtn,
                {
                  width: moderateScale(30),
                  height: moderateScale(30),
                  borderRadius: moderateScale(15),
                  backgroundColor: COLORS.heroGlass,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons
                name={actionIcon as any}
                size={SIZES.icon.sm}
                color={COLORS.heroTextSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* ── The big numeral ── */}
        <View style={s.valueRow}>
          <Text
            numberOfLines={1}
            style={[
              asText(FONTS.displayXL),
              { color: COLORS.heroTextPrimary, flexShrink: 1 },
            ]}
          >
            {value}
          </Text>
          {!!unit && (
            <Text
              style={[
                asText(FONTS.micro),
                { color: COLORS.heroTextTertiary, marginBottom: moderateScale(9) },
              ]}
            >
              {unit}
            </Text>
          )}
        </View>

        {!!note && (
          <Text
            style={[
              asText(FONTS.micro),
              { color: toneColor(noteTone), marginTop: 2 },
            ]}
          >
            {note}
          </Text>
        )}

        {/* ── Hairline-separated stat row ── */}
        {stats.length > 0 && (
          <View
            style={[
              s.statsRow,
              {
                marginTop: SIZES.margin.xl,
                paddingTop: SIZES.padding.lg,
                borderTopColor: COLORS.heroHairline,
              },
            ]}
          >
            {stats.map((st, i) => (
              <React.Fragment key={`${st.label}-${i}`}>
                {i > 0 && (
                  <View
                    style={[s.vRule, { backgroundColor: COLORS.heroHairline }]}
                  />
                )}
                <View style={s.stat}>
                  <Text
                    numberOfLines={1}
                    style={[
                      asText(FONTS.micro),
                      { color: COLORS.heroTextMuted, fontSize: 10 },
                    ]}
                  >
                    {st.label}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      asText(FONTS.numeralSm),
                      { color: toneColor(st.tone), marginTop: 3 },
                    ]}
                  >
                    {st.value}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    </Wrapper>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBtn: { alignItems: 'center', justifyContent: 'center' },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 10,
  },
  statsRow: { flexDirection: 'row', borderTopWidth: 1 },
  stat: { flex: 1, paddingRight: 8 },
  vRule: { width: 1, alignSelf: 'stretch', marginRight: 12 },
});

export default memo(HeroCard);
