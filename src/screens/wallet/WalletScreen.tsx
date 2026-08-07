// src/screens/wallet/WalletScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// NEW SCREEN
//
// LAYOUT
//   An Apple-Wallet-style pass stack. The hero states total metal held
//   and its indicative value at today's rate. Below, each enrolment is
//   a physical-feeling WalletCard — dark slab, metal foil edge, masked
//   registration number — laid out as a vertical stack rather than a
//   list of rows. A valuation ledger closes the screen.
//
// WHY THIS UX
//   • Members think about gold savings in grams, not rupees. The wallet
//     leads with weight and treats currency as the derived figure —
//     the inverse of Portfolio, which leads with value.
//   • Each holding is a discrete object you could imagine holding,
//     which suits a metal-backed product better than a table row.
//   • Indicative valuation is stated with its rate and timestamp, so
//     the number is never mistaken for a guaranteed redemption price.
//
// REUSED (unchanged business logic)
//   useMySchemes (data, loading, refetch), ratesService.getRates,
//   PPData shape, navigation target PayInstallment.
//   No new API surface — valuation is computed client-side from the
//   same two sources Home already uses.
//
// NEW UI COMPONENTS
//   WalletCard, ScreenCanvas, PageHeader, SectionHeading, SummaryCard,
//   EmptyState, SkeletonBlock
// ─────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { ratesService } from '../../api/services/ratesService';
import { RatesResponse } from '../../types/Rates/Rates';
import { PPData } from '../../types/Account/PhoneDetails';

import {
  ScreenCanvas,
  PageHeader,
  WalletCard,
  SectionHeading,
  SummaryCard,
  EmptyState,
  SkeletonBlock,
  asText,
  money,
  grams,
  prettyDate,
  type SummaryRow,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

const isClosed = (pp: PPData) =>
  (pp.schemeClosedSummary?.closeType ?? '').trim() !== '';

/** Mask a registration number the way a card masks a PAN. */
const maskReg = (reg: number | string): string => {
  const s = String(reg ?? '');
  return s.length <= 4 ? s : `•••• ${s.slice(-4)}`;
};

export default function WalletScreen() {
  const navigation = useNavigation<Nav>();
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const { mySchemes, loading, refetch } = useMySchemes();
  const [rates, setRates] = useState<RatesResponse | null>(null);

  useEffect(() => {
    ratesService.getRates().then(setRates).catch(() => {});
  }, []);

  const goldRate = rates?.gold?.currentRate ?? 0;

  const totals = useMemo(() => {
    const open = mySchemes.filter((m) => !isClosed(m));
    const weight = mySchemes.reduce(
      (sum, m) => sum + num(m.schemeSummary?.totalWeight),
      0,
    );
    const invested = mySchemes.reduce((sum, m) => sum + num(m.totalAmount), 0);
    return {
      weight,
      invested,
      indicative: weight * goldRate,
      openCount: open.length,
      count: mySchemes.length,
    };
  }, [mySchemes, goldRate]);

  const valuation: SummaryRow[] = useMemo(
    () => [
      { label: 'Metal held', value: grams(totals.weight, 3) },
      {
        label: 'Rate applied · 916',
        value: goldRate > 0 ? `${money(goldRate)} / g` : '—',
      },
      { label: 'Amount contributed', value: money(totals.invested) },
      {
        label: 'Indicative value',
        value: money(totals.indicative),
        total: true,
      },
    ],
    [totals, goldRate],
  );

  const onRefresh = useCallback(() => {
    refetch();
    ratesService.getRates().then(setRates).catch(() => {});
  }, [refetch]);

  const isEmpty = !loading && mySchemes.length === 0;

  return (
    <ScreenCanvas
      overlap={moderateScale(24)}
      refreshing={loading && mySchemes.length > 0}
      onRefresh={onRefresh}
      header={
        <PageHeader
          eyebrow="Your metal"
          title="Wallet"
          bleedBottom={moderateScale(24)}
        >
          {loading && mySchemes.length === 0 ? (
            <View style={{ marginTop: SIZES.margin.xxl, gap: 10 }}>
              <SkeletonBlock width="40%" height={12} surface="hero" />
              <SkeletonBlock width="66%" height={44} surface="hero" />
            </View>
          ) : (
            <View style={{ marginTop: SIZES.margin.xxl }}>
              <Text
                style={[
                  asText(FONTS.eyebrow),
                  { color: COLORS.heroTextTertiary },
                ]}
              >
                Total holding
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  asText(FONTS.displayXL),
                  { color: COLORS.heroTextPrimary, marginTop: 3 },
                ]}
              >
                {grams(totals.weight, 3)}
              </Text>
              <Text
                style={[
                  asText(FONTS.micro),
                  { color: COLORS.heroAccent, marginTop: 2 },
                ]}
              >
                ≈ {money(totals.indicative)} at today's rate
              </Text>
              <Text
                style={[
                  asText(FONTS.micro),
                  { color: COLORS.heroTextMuted, marginTop: 2, fontSize: 10 },
                ]}
              >
                Across {totals.count} pass{totals.count === 1 ? '' : 'es'} ·{' '}
                {totals.openCount} active
              </Text>
            </View>
          )}
        </PageHeader>
      }
    >
      {isEmpty ? (
        <EmptyState
          icon="wallet-outline"
          title="Your wallet is empty"
          body="Join a savings scheme and your gold passes will appear here."
          actionLabel="Browse schemes"
          onAction={() =>
            (navigation as any).navigate('Main', { screen: 'Scheme' })
          }
        />
      ) : (
        <>
          {/* ── Pass stack ── */}
          <View style={{ marginTop: SIZES.layout.sectionTight }}>
            <SectionHeading
              eyebrow="Passes"
              title="Your holdings"
              count={mySchemes.length}
            />

            <View style={{ marginTop: SIZES.margin.lg, gap: 14 }}>
              {loading && mySchemes.length === 0 ? (
                <>
                  <SkeletonBlock
                    height={moderateScale(180)}
                    radius={SIZES.radius.hero}
                  />
                  <SkeletonBlock
                    height={moderateScale(180)}
                    radius={SIZES.radius.hero}
                  />
                </>
              ) : (
                mySchemes.map((m, i) => {
                  const w = num(m.schemeSummary?.totalWeight);
                  const closed = isClosed(m);
                  return (
                    <WalletCard
                      key={String(m.regNo)}
                      eyebrow={`${
                        m.schemeSummary?.schemeName ?? 'Gold scheme'
                      }${closed ? ' · closed' : ''}`}
                      value={grams(w, 3)}
                      secondary={
                        goldRate > 0
                          ? `≈ ${money(w * goldRate)} · contributed ${money(
                              num(m.totalAmount),
                            )}`
                          : `Contributed ${money(num(m.totalAmount))}`
                      }
                      footLabel="Reg no"
                      footValue={maskReg(m.regNo)}
                      footLabel2={closed ? 'Closed' : 'Next due'}
                      footValue2={
                        closed
                          ? prettyDate(m.schemeClosedSummary?.closeDate)
                          : m.nextDueDate
                          ? prettyDate(m.nextDueDate)
                          : '—'
                      }
                      metal="G"
                      icon="diamond"
                      stacked={i < mySchemes.length - 1}
                      onPress={
                        closed
                          ? undefined
                          : () =>
                              (navigation as any).navigate('PayInstallment', {
                                ppData: m,
                              })
                      }
                    />
                  );
                })
              )}
            </View>
          </View>

          {/* ── Valuation ── */}
          <View style={{ marginTop: SIZES.layout.section }}>
            <SectionHeading
              eyebrow="Indicative"
              title="Valuation"
              caption="Not a guaranteed redemption price"
            />
            <SummaryCard
              rows={valuation}
              style={{ marginTop: SIZES.margin.lg }}
            />
          </View>
        </>
      )}
    </ScreenCanvas>
  );
}
