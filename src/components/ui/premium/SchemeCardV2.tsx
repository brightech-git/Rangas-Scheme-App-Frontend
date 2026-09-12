// src/components/ui/premium/SchemeCardV2.tsx
//
// The scheme surface, rebuilt. Purely presentational — screens map
// their ApiScheme / PPData objects onto these props, so no business
// logic lives here.
//
// Two modes:
//   'catalogue' — a scheme you could join. Emphasis on the offer.
//   'holding'   — a scheme you're enrolled in. Emphasis on progress.
//
// The old design stacked a gradient banner over a white body. This one
// is a single paper plane with a metal-coloured spine on the left, a
// ghosted metal wordmark bled off the right edge, and a hairline
// footer rail for actions.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';
import ProgressWidget from './ProgressWidget';
import StatusChip, { ChipTone } from './StatusChip';

export type SchemeCardStat = { label: string; value: string };

type Props = {
  variant?: 'catalogue' | 'holding';
  title: string;
  /** Short code / group code shown as micro-caps above the title */
  eyebrow?: string;
  /** 'G' | 'S' | 'P' | 'D' — drives the spine colour and wordmark */
  metal?: string;
  metalLabel?: string;
  /** Up to three facts rendered in a hairline strip */
  stats?: SchemeCardStat[];
  /** Status pill in the top-right */
  status?: { label: string; tone: ChipTone };
  /** Progress rail — only rendered when total > 0 */
  paid?: number;
  total?: number;
  progressNote?: string;
  /**
   * Shown in the progress rail's place when total is 0 (e.g. a
   * pay-anytime scheme with no fixed instalment count). Pairs with
   * progressNote, which becomes a right-aligned secondary line here.
   */
  flexibleNote?: string;
  /** Footer call to action */
  actionLabel?: string;
  onAction?: () => void;
  /** Optional second footer action */
  secondActionLabel?: string;
  onSecondAction?: () => void;
  onPress?: () => void;
  /** Fixed width, for horizontal carousels */
  width?: number;
  style?: ViewStyle;
};

function SchemeCardV2({
  variant = 'catalogue',
  title,
  eyebrow,
  metal = 'G',
  metalLabel,
  stats = [],
  status,
  paid = 0,
  total = 0,
  progressNote,
  flexibleNote,
  actionLabel,
  onAction,
  secondActionLabel,
  onSecondAction,
  onPress,
  width,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale, SHADOWS} = useTheme();

  const metalColors: Record<string, string> = {
    G: COLORS.metalGold,
    S: COLORS.metalSilver,
    P: COLORS.metalPlatinum,
    D: COLORS.metalDiamond,
  };
  const metalSoft: Record<string, string> = {
    G: COLORS.metalGoldSoft,
    S: COLORS.metalSilverSoft,
    P: COLORS.metalPlatinumSoft,
    D: COLORS.metalDiamondSoft,
  };

  const spine = metalColors[metal] ?? COLORS.metalGold;
  const soft = metalSoft[metal] ?? COLORS.metalGoldSoft;
  const wordmark = (metalLabel ?? 'GOLD').toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        s.card,
        {
          width,
          borderRadius: SIZES.radius.panel,
          backgroundColor: COLORS.canvasElevated,
          borderColor: COLORS.hairline,
          opacity: pressed && onPress ? 0.9 : 1,
        },
        SHADOWS.hairline as ViewStyle,
        style,
      ]}
    >
      {/* Metal spine */}
      <View style={[s.spine, { backgroundColor: spine }]} />

      {/* Ghosted metal wordmark, bled off the right edge */}
      <Text
        pointerEvents="none"
        numberOfLines={1}
        style={[
          s.ghost,
          {
            color: soft,
            fontFamily: FONTS.family.bold,
            fontSize: moderateScale(52),
          },
        ]}
      >
        {wordmark}
      </Text>

      <View style={{ padding: SIZES.padding.xl, paddingTop: SIZES.padding.md, paddingBottom: 0, paddingLeft: SIZES.padding.xl + 4 }}>
        {/* ── Head ── */}
        <View style={s.headRow}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: status ? 8 : 0 }}>
            {!!eyebrow && (
              <Text
                numberOfLines={1}
                style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary, fontSize: 12 }]}
              >
                {eyebrow}
              </Text>
            )}
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[
                asText(FONTS.displaySm),
                { color: COLORS.inkPrimary, marginTop: eyebrow ? 7 : 0 },
              ]}
            >
              {title}
            </Text>
          </View>
          {!!status && (
            <View style={{ position: 'absolute', top: 0, right: 0,}}>
              <StatusChip label={status.label} tone={status.tone} dot />
            </View>
          )}
        </View>

        {/* ── Hairline stat strip ── */}
        {stats.length > 0 && (
          <View
            style={[
              s.statStrip,
              {
                marginTop: SIZES.margin.lg,
                paddingTop: SIZES.padding.md,
                borderTopColor: COLORS.hairline,
              },
            ]}
          >
            {stats.slice(0, 3).map((st, i) => (
              <React.Fragment key={`${st.label}-${i}`}>
                {i > 0 && (
                  <View style={[s.vRule, { backgroundColor: COLORS.hairline }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      asText(FONTS.micro),
                      { color: COLORS.inkTertiary, fontSize: 10 },
                    ]}
                  >
                    {st.label}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      asText(FONTS.numeralSm),
                      { color: COLORS.inkPrimary, marginTop: 2 },
                    ]}
                  >
                    {st.value}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* ── Progress rail (holdings only) ── */}
        {variant === 'holding' && total > 0 && (
          <ProgressWidget
            paid={paid}
            total={total}
            note={progressNote}
            color={spine}
            style={{ marginTop: SIZES.margin.xl }}
          />
        )}

        {/* ── No fixed instalment count (e.g. DigiGold) — swap the rail for a note ── */}
        {variant === 'holding' && total === 0 && !!flexibleNote && (
          <View
            style={[
              s.flexRow,
              {
                marginTop: SIZES.margin.xl,
                paddingTop: SIZES.padding.md,
                borderTopColor: COLORS.hairline,
              },
            ]}
          >
            <Ionicons name="infinite-outline" size={SIZES.icon.sm} color={spine} />
            <Text
              numberOfLines={1}
              style={[asText(FONTS.microBold), { color: COLORS.inkSecondary, flex: 1 }]}
            >
              {flexibleNote}
            </Text>
            {!!progressNote && (
              <Text
                numberOfLines={1}
                style={[asText(FONTS.micro), { color: COLORS.inkTertiary, fontSize: 10 }]}
              >
                {progressNote}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* ── Footer action rail ── */}
      {!!actionLabel && !!onAction && (
        <View style={[s.footer, { borderTopColor: COLORS.hairline }]}>
          <Pressable
            onPress={onAction}
            style={({ pressed }) => [
              s.footerBtn,
              {
                paddingVertical: SIZES.padding.lg,
                paddingHorizontal: SIZES.padding.xl,
                backgroundColor: pressed ? COLORS.canvasSunken : 'transparent',
                borderRightWidth: secondActionLabel && onSecondAction ? StyleSheet.hairlineWidth : 0,
                borderRightColor: COLORS.hairline,
              },
            ]}
          >
            <Text style={[asText(FONTS.microBold), { color: COLORS.primaryInk }]}>
              {actionLabel}
            </Text>
            <Ionicons name="arrow-forward" size={SIZES.icon.sm} color={COLORS.primary} />
          </Pressable>

          {!!secondActionLabel && !!onSecondAction && (
            <Pressable
              onPress={onSecondAction}
              style={({ pressed }) => [
                s.footerBtn,
                {
                  paddingVertical: SIZES.padding.lg,
                  paddingHorizontal: SIZES.padding.xl,
                  backgroundColor: pressed ? COLORS.canvasSunken : 'transparent',
                },
              ]}
            >
              <Text style={[asText(FONTS.microBold), { color: COLORS.primaryInk }]}>
                {secondActionLabel}
              </Text>
              <Ionicons name="arrow-forward" size={SIZES.icon.sm} color={COLORS.primary} />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  ghost: {
    position: 'absolute',
    right: -14,
    top: -10,
    letterSpacing: -2,
    opacity: 0.85,
  },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative' },
  flexRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  statStrip: { flexDirection: 'row', borderTopWidth: 1 },
  vRule: { width: 1, alignSelf: 'stretch', marginHorizontal: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default memo(SchemeCardV2);
