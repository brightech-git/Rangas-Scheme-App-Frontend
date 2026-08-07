// src/screens/rates/RatesScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   The rate itself is promoted INTO the warm hero: the headline
//   figure, the day's delta and the metal switch all live in the sand
//   zone, so the screen opens on the number the member came for. The
//   paper body below carries the analysis — trend chart, a hairline
//   ledger of daily closes, and the disclaimer.
//
//   The metal switch is a two-item segmented rail rendered as hairline
//   text with an underline marker, not a sliding tinted pill.
//
// WHY THIS IS BETTER UX
//   • The current rate is legible before any scrolling and before the
//     chart has laid out — previously it sat below a tab control and a
//     card, and shifted as data arrived.
//   • The daily ledger is a true table with aligned numerals rather
//     than three flex columns of mixed font sizes, so scanning down a
//     column of prices actually works.
//   • Switching metal no longer animates a pill across the screen; the
//     figure re-renders in place, which reads as data changing rather
//     than navigation.
//
// REUSED (unchanged business logic)
//   ratesService.getRates, RootStackParamList route params,
//   PoweredByFooter
//
// NEW UI COMPONENTS
//   PageHeader, ScreenCanvas, AnalyticsCard, SummaryCard,
//   SectionHeading, StatusChip, FloatingWidget, Skeleton
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';

import { useTheme } from '../../theme';
import { ratesService } from '../../api/services/ratesService';
import { RatesResponse, MetalRates } from '../../types/Rates/Rates';
import PoweredByFooter from '../../components/ui/PoweredByFooter';
import { RootStackParamList } from '../../navigation/RootNavigator';

import {
  ScreenCanvas,
  PageHeader,
  AnalyticsCard,
  SectionHeading,
  StatusChip,
  SkeletonBlock,
  asText,
  money,
} from '../../components/ui/premium';

const { width: SW } = Dimensions.get('window');
type Metal = 'Gold' | 'Silver';
type RouteProps = RouteProp<RootStackParamList, 'Rates'>;

export default function RatesScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const route = useRoute<RouteProps>();

  const initialMetal: Metal = (route.params as any)?.metal ?? 'Gold';

  const [activeMetal, setActiveMetal] = useState<Metal>(initialMetal);
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Data (identical call to before) ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ratesService.getRates(10);
      setRates(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metal: MetalRates | null = rates
    ? rates[activeMetal === 'Gold' ? 'gold' : 'silver']
    : null;

  const accent =
    activeMetal === 'Gold' ? COLORS.metalGold : COLORS.metalSilver;
  const isUp = (metal?.changePct ?? 0) >= 0;

  const G = SIZES.layout.gutter;
  const chartWidth = SW - G * 2 - 2;

  const ledger = useMemo(
    () => (metal ? [...metal.history].reverse() : []),
    [metal],
  );

  const axisLabels = useMemo(() => {
    if (!metal?.history?.length) return [];
    const h = metal.history;
    const pick = [h[0], h[Math.floor(h.length / 2)], h[h.length - 1]].filter(
      Boolean,
    );
    return pick.map((e) => e.date.slice(0, 6));
  }, [metal]);

  // ── Metal switch: hairline segmented rail ──
  const MetalRail = (
    <View
      style={[
        s.rail,
        {
          marginTop: SIZES.margin.xxl,
          borderColor: COLORS.heroHairline,
          borderRadius: SIZES.radius.tile,
        },
      ]}
    >
      {(['Gold', 'Silver'] as Metal[]).map((m, i) => {
        const on = m === activeMetal;
        const tint = m === 'Gold' ? COLORS.metalGold : COLORS.metalSilver;
        return (
          <Pressable
            key={m}
            onPress={() => setActiveMetal(m)}
            style={({ pressed }) => [
              s.railItem,
              {
                paddingVertical: SIZES.padding.md,
                borderLeftWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                borderLeftColor: COLORS.heroHairline,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons
              name={m === 'Gold' ? 'diamond' : 'ellipse'}
              size={13}
              color={on ? tint : COLORS.heroTextMuted}
            />
            <Text
              style={[
                asText(FONTS.microBold),
                { color: on ? COLORS.heroTextPrimary : COLORS.heroTextMuted },
              ]}
            >
              {m} {m === 'Gold' ? '916' : '999'}
            </Text>
            {on && <View style={[s.railMark, { backgroundColor: tint }]} />}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <ScreenCanvas
      overlap={moderateScale(24)}
      header={
        <PageHeader
          eyebrow="Live market"
          title="Metal rates"
          bleedBottom={moderateScale(24)}
          actions={[{ icon: 'refresh-outline', onPress: load }]}
        >
          {/* ── The figure, in the dark zone ── */}
          <View style={{ marginTop: SIZES.margin.xxl }}>
            {loading || !metal ? (
              <View style={{ gap: 10 }}>
                <SkeletonBlock width="40%" height={12} surface="hero" />
                <SkeletonBlock width="62%" height={44} surface="hero" />
              </View>
            ) : (
              <>
                <Text
                  style={[
                    asText(FONTS.eyebrow),
                    { color: COLORS.heroTextTertiary },
                  ]}
                >
                  {activeMetal} · {metal.purity} · {metal.unit}
                </Text>

                <View style={s.figureRow}>
                  <Text
                    numberOfLines={1}
                    style={[
                      asText(FONTS.displayXL),
                      { color: COLORS.heroTextPrimary, flexShrink: 1 },
                    ]}
                  >
                    {money(metal.currentRate)}
                  </Text>
                  <StatusChip
                    surface="hero"
                    tone={isUp ? 'success' : 'danger'}
                    icon={isUp ? 'trending-up' : 'trending-down'}
                    label={`${isUp ? '+' : ''}${metal.changePct.toFixed(2)}%`}
                    style={{ marginBottom: moderateScale(10) }}
                  />
                </View>

                <Text
                  style={[
                    asText(FONTS.micro),
                    { color: COLORS.heroTextTertiary, marginTop: 2 },
                  ]}
                >
                  {isUp ? '+' : '−'}
                  {money(Math.abs(metal.change))} today · updated{' '}
                  {metal.updatedAt}
                </Text>
              </>
            )}
          </View>

          {MetalRail}
        </PageHeader>
      }
    >
      {/* ── Trend ── */}
      <View style={{ marginTop: SIZES.layout.sectionTight }}>
        <SectionHeading
          eyebrow="Recent history"
          title="Trend"
          caption={`Last ${metal?.history?.length ?? 0} sessions`}
        />
      </View>

      {loading || !metal ? (
        <SkeletonBlock
          height={moderateScale(160)}
          radius={SIZES.radius.panel}
          style={{ marginTop: SIZES.margin.lg }}
        />
      ) : (
        <AnalyticsCard
          eyebrow={`${activeMetal} · per gram`}
          value={money(metal.currentRate)}
          caption={`${metal.history.length}-session close`}
          changePct={metal.changePct}
          data={metal.history.map((h) => h.rate)}
          chartWidth={chartWidth}
          chartHeight={moderateScale(120)}
          color={accent}
          axisLabels={axisLabels}
          style={{ marginTop: SIZES.margin.lg }}
        />
      )}

      {/* ── Daily ledger ── */}
      <View style={{ marginTop: SIZES.layout.section }}>
        <SectionHeading
          eyebrow="Daily closes"
          title="Ledger"
          count={ledger.length}
        />
      </View>

      <View
        style={[
          s.table,
          {
            marginTop: SIZES.margin.lg,
            borderColor: COLORS.hairline,
            borderRadius: SIZES.radius.panel,
            backgroundColor: COLORS.canvasElevated,
          },
        ]}
      >
        {/* Table head */}
        <View
          style={[
            s.tr,
            {
              paddingHorizontal: SIZES.padding.xl,
              paddingVertical: SIZES.padding.md,
              borderBottomColor: COLORS.hairline,
              borderBottomWidth: 1,
            },
          ]}
        >
          <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkMuted, flex: 1.3 }]}>
            Date
          </Text>
          <Text
            style={[
              asText(FONTS.eyebrow),
              { color: COLORS.inkMuted, flex: 1.4, textAlign: 'right' },
            ]}
          >
            Rate / g
          </Text>
          <Text
            style={[
              asText(FONTS.eyebrow),
              { color: COLORS.inkMuted, flex: 1.5, textAlign: 'right' },
            ]}
          >
            Change
          </Text>
        </View>

        {loading ? (
          <View style={{ padding: SIZES.padding.xl, gap: 14 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} height={14} />
            ))}
          </View>
        ) : (
          ledger.map((entry, i) => {
            const up = entry.changePct >= 0;
            return (
              <View
                key={entry.dateRaw}
                style={[
                  s.tr,
                  {
                    paddingHorizontal: SIZES.padding.xl,
                    paddingVertical: SIZES.padding.md,
                    borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                    borderTopColor: COLORS.hairline,
                  },
                ]}
              >
                <Text
                  style={[
                    asText(FONTS.micro),
                    { color: COLORS.inkSecondary, flex: 1.3 },
                  ]}
                >
                  {entry.date.slice(0, 6)}
                </Text>

                <Text
                  style={[
                    asText(FONTS.numeralSm),
                    { color: COLORS.inkPrimary, flex: 1.4, textAlign: 'right' },
                  ]}
                >
                  {money(entry.rate)}
                </Text>

                <View style={s.changeCell}>
                  <Ionicons
                    name={up ? 'caret-up' : 'caret-down'}
                    size={10}
                    color={up ? COLORS.success : COLORS.error}
                  />
                  <Text
                    style={[
                      asText(FONTS.micro),
                      { color: up ? COLORS.success : COLORS.error },
                    ]}
                  >
                    {up ? '+' : ''}
                    {entry.changePct.toFixed(2)}%
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── Disclaimer ── */}
      <View style={[s.note, { marginTop: SIZES.layout.block }]}>
        <Ionicons
          name="information-circle-outline"
          size={SIZES.icon.sm}
          color={COLORS.inkMuted}
        />
        <Text
          style={[
            asText(FONTS.micro),
            { color: COLORS.inkMuted, flex: 1, fontSize: 10 },
          ]}
        >
          Rates are indicative and may vary slightly from actual transaction
          prices at the time of billing.
        </Text>
      </View>

      <PoweredByFooter />
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  figureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  rail: {
    flexDirection: 'row',
    borderWidth: 1,
    overflow: 'hidden',
  },
  railItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  railMark: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    borderRadius: 1,
  },
  table: { borderWidth: 1, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'center' },
  changeCell: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
