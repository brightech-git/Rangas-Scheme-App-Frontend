// src/components/ui/premium/TimelineCard.tsx
//
// Vertical activity rail. Replaces flat transaction rows with a real
// timeline: a continuous hairline spine, a node per event, and the
// amount right-aligned in numerals. Reads as a statement, not a list.

import React, { memo } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

export type TimelineTone = 'default' | 'success' | 'pending' | 'failed' | 'gold';

export type TimelineEntry = {
  id: string;
  title: string;
  /** Left-hand meta line, e.g. "Receipt #4471 · UPI" */
  meta?: string;
  /** Right-hand primary value, e.g. "₹2,000" */
  value?: string;
  /** Right-hand secondary line, e.g. "0.284 g" */
  subValue?: string;
  /** Date/time shown as micro text */
  timestamp?: string;
  tone?: TimelineTone;
  icon?: string;
  onPress?: () => void;
  /** View the full receipt — renders an explicit "eye" action button */
  onView?: () => void;
  /** Download receipt directly from the timeline row */
  onDownload?: () => void;
  downloadLoading?: boolean;
  /** Briefly swaps the download icon for a checkmark to confirm success */
  downloadDone?: boolean;
};

type Props = {
  entries: TimelineEntry[];
  surface?: 'light' | 'hero';
  /** Hide the connecting spine (for very short lists) */
  hideSpine?: boolean;
  style?: ViewStyle;
};

function TimelineCard({
  entries,
  surface = 'light',
  hideSpine = false,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const onHero = surface === 'hero';

  const border = onHero ? COLORS.heroHairline : COLORS.hairline;
  const fg = onHero ? COLORS.heroTextPrimary : COLORS.inkPrimary;
  const dim = onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;

  const toneColor = (t: TimelineTone = 'default'): string => {
    switch (t) {
      case 'success':
        return onHero ? COLORS.heroSuccess : COLORS.success;
      case 'pending':
        return COLORS.metalGold;
      case 'failed':
        return onHero ? COLORS.heroDanger : COLORS.error;
      case 'gold':
        return COLORS.metalGold;
      default:
        return onHero ? COLORS.heroTextTertiary : COLORS.inkTertiary;
    }
  };

  const NODE = moderateScale(28);

  return (
    <View style={style}>
      {entries.map((e, i) => {
        const isLast = i === entries.length - 1;
        const accent = toneColor(e.tone);
        const RowWrapper: React.ElementType = e.onPress ? Pressable : View;

        return (
          <RowWrapper
            key={e.id}
            onPress={e.onPress}
            style={({ pressed }: { pressed?: boolean }) => [
              s.row,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            {/* Spine + node */}
            <View style={{ width: NODE, alignItems: 'center' }}>
              <View
                style={[
                  s.node,
                  {
                    width: NODE,
                    height: NODE,
                    borderRadius: NODE / 2,
                    borderColor: border,
                    backgroundColor: onHero
                      ? COLORS.heroElevated
                      : COLORS.canvasElevated,
                  },
                ]}
              >
                {e.icon ? (
                  <Ionicons
                    name={e.icon as any}
                    size={SIZES.icon.sm}
                    color={accent}
                  />
                ) : (
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: accent,
                    }}
                  />
                )}
              </View>

              {!isLast && !hideSpine && (
                <View style={[s.spine, { backgroundColor: border }]} />
              )}
            </View>

            {/* Content */}
            <View
              style={[
                s.content,
                { paddingBottom: isLast ? 0 : SIZES.padding.xl },
              ]}
            >
              <View style={s.contentRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text
                    numberOfLines={1}
                    style={[asText(FONTS.microBold), { color: fg }]}
                  >
                    {e.title}
                  </Text>
                  {!!e.meta && (
                    <Text
                      numberOfLines={1}
                      style={[
                        asText(FONTS.micro),
                        { color: dim, fontSize: 10, marginTop: 2 },
                      ]}
                    >
                      {e.meta}
                    </Text>
                  )}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  {!!e.value && (
                    <Text
                      numberOfLines={1}
                      style={[asText(FONTS.numeralSm), { color: fg }]}
                    >
                      {e.value}
                    </Text>
                  )}
                  {!!e.subValue && (
                    <Text
                      numberOfLines={1}
                      style={[
                        asText(FONTS.micro),
                        { color: accent, fontSize: 10, marginTop: 1 },
                      ]}
                    >
                      {e.subValue}
                    </Text>
                  )}
                </View>
              </View>

              <View style={s.footerRow}>
                {!!e.timestamp && (
                  <Text
                    style={[
                      asText(FONTS.micro),
                      { color: dim, fontSize: 10 },
                    ]}
                  >
                    {e.timestamp}
                  </Text>
                )}

                {(!!e.onView || !!e.onDownload) && (
                  <View style={s.actionsRow}>
                    {!!e.onView && (
                      <Pressable
                        onPress={e.onView}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="View receipt"
                        style={({ pressed }: { pressed?: boolean }) => [
                          s.actionPill,
                          {
                            borderColor: border,
                            backgroundColor: onHero ? COLORS.heroElevated : COLORS.canvasElevated,
                            opacity: pressed ? 0.6 : 1,
                          },
                        ]}
                      >
                        <Ionicons name="eye-outline" size={13} color={fg} />
                        <Text style={[asText(FONTS.microBold), s.actionLabel, { color: fg }]}>
                          View
                        </Text>
                      </Pressable>
                    )}
                    {!!e.onDownload && (
                      <Pressable
                        onPress={e.onDownload}
                        disabled={e.downloadLoading}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Download receipt"
                        style={({ pressed }: { pressed?: boolean }) => [
                          s.actionPill,
                          {
                            borderColor: accent,
                            backgroundColor: onHero ? COLORS.heroElevated : COLORS.canvasElevated,
                            opacity: e.downloadLoading ? 0.6 : pressed ? 0.6 : 1,
                          },
                        ]}
                      >
                        {e.downloadLoading ? (
                          <ActivityIndicator size="small" color={accent} />
                        ) : (
                          <Ionicons
                            name={e.downloadDone ? 'checkmark-circle' : 'download-outline'}
                            size={13}
                            color={accent}
                          />
                        )}
                        <Text style={[asText(FONTS.microBold), s.actionLabel, { color: accent }]}>
                          {e.downloadLoading ? 'Saving' : e.downloadDone ? 'Saved' : 'Download'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </View>
          </RowWrapper>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  spine: { flex: 1, width: StyleSheet.hairlineWidth, marginVertical: 4 },
  content: { flex: 1, paddingTop: 3 },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionsRow: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
  },
  actionLabel: { fontSize: 11, letterSpacing: 0.2 },
});

export default memo(TimelineCard);
