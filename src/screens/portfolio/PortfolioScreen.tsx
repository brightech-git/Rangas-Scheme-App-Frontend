// src/screens/portfolio/PortfolioScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   Hero carries the portfolio value and the allocation bar — a single
//   horizontal rule split proportionally between paid and still-owed,
//   so composition is understood without a pie chart. Paper body
//   carries a composition ledger, an active/completed filter rail, and
//   the holdings themselves as full SchemeCardV2 records.
//
// WHY THIS IS BETTER UX
//   • Portfolio value and its composition are adjacent, so "how much of
//     is left to pay?" is answered without arithmetic.
//   • Holdings are filterable by state; previously active and closed
//     schemes were interleaved in one undifferentiated list.
//   • Each holding shows instalment progress inline, so the member can
//     see which scheme needs attention without opening it.
//
// REUSED (unchanged business logic)
//   useMySchemes (data, loading, error, refetch), PPData shape,
//   navigation targets PayInstallment / Main>Scheme
//
// NEW UI COMPONENTS
//   ScreenCanvas, PageHeader, SectionHeading, SummaryCard,
//   SchemeCardV2, MetricCard, EmptyState, StatusChip, Skeleton*
// ─────────────────────────────────────────────────────────────────

import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { PPData } from '../../types/Account/PhoneDetails';
import { portfolioMetrics, schemeMetrics } from '../../utils/schemeMetrics';

import {
  ScreenCanvas,
  PageHeader,
  SectionHeading,
  SummaryCard,
  SchemeCardV2,
  MetricCard,
  EmptyState,
  SkeletonSchemeCard,
  SkeletonBlock,
  asText,
  money,
  moneyCompact,
  grams,
  prettyDate,
  shortDate,
  type SummaryRow,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | 'active' | 'closed';

const num = (v: unknown): number => {
  const n =
    typeof v === 'number'
      ? v
      : parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

const isCompleted = (pp: PPData) =>
  (pp.schemeClosedSummary?.closeType ?? '').trim() !== '';

export default function PortfolioScreen() {
  const navigation = useNavigation<Nav>();
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const { mySchemes, loading, error, refetch } = useMySchemes();
  const [filter, setFilter] = useState<Filter>('all');

  // ── Aggregates ──
  // Bonus is optional in this deployment and deliberately excluded. The
  // portfolio is therefore expressed as PROGRESS AGAINST COMMITMENT
  // (paid vs still owed) rather than principal-plus-bonus.
  const summary = useMemo(() => portfolioMetrics(mySchemes), [mySchemes]);

  const visible = useMemo(() => {
    if (filter === 'active') return mySchemes.filter((s) => !isCompleted(s));
    if (filter === 'closed') return mySchemes.filter(isCompleted);
    return mySchemes;
  }, [mySchemes, filter]);

  const compositionRows: SummaryRow[] = useMemo(
    () => [
      { label: 'Paid to date', value: money(summary.invested) },
      {
        label: 'Still to pay',
        value: summary.remaining > 0 ? money(summary.remaining) : '—',
        highlight: summary.remaining > 0,
      },
      {
        label: 'Instalments',
        value:
          summary.totalInstalments > 0
            ? `${summary.paid} of ${summary.totalInstalments}`
            : String(summary.paid),
      },
      { label: 'Metal accrued', value: grams(summary.weight, 3) },
      {
        label: 'Schemes held',
        value: `${summary.count} (${summary.activeCount} active)`,
      },
      {
        label: 'Total commitment',
        value: summary.committed > 0 ? money(summary.committed) : money(summary.invested),
        total: true,
      },
    ],
    [summary],
  );

  const filters: { key: Filter; label: string; count: number }[] = useMemo(
    () => [
      { key: 'all', label: 'All', count: summary.count },
      { key: 'active', label: 'Active', count: summary.activeCount },
      { key: 'closed', label: 'Closed', count: summary.closedCount },
    ],
    [summary],
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const G = SIZES.layout.gutter;
  const isEmpty = !loading && mySchemes.length === 0;

  // ── Progress rule: PAID vs STILL OWED against the total commitment.
  // (Was principal-vs-bonus; bonus is not part of this product.)
  const paidShare =
    summary.committed > 0
      ? Math.min(1, summary.invested / summary.committed)
      : summary.invested > 0
      ? 1
      : 0;
  const AllocationBar = (
    <View style={{ marginTop: SIZES.margin.xxl }}>
      <View style={s.allocRow}>
        <View
          style={{
            flex: Math.max(0.02, paidShare),
            height: 6,
            borderRadius: 3,
            backgroundColor: COLORS.heroAccent,
          }}
        />
        <View
          style={{
            flex: Math.max(0.02, 1 - paidShare),
            height: 6,
            borderRadius: 3,
            backgroundColor: COLORS.heroGlassBold,
          }}
        />
      </View>

      <View style={[s.legendRow, { marginTop: SIZES.margin.md }]}>
        <View style={s.legendItem}>
          <View style={[s.dot, { backgroundColor: COLORS.heroAccent }]} />
          <Text
            style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary }]}
          >
            Paid {money(summary.invested)}
          </Text>
        </View>
        <View style={s.legendItem}>
          <View
            style={[s.dot, { backgroundColor: COLORS.heroTextMuted }]}
          />
          <Text
            style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary }]}
          >
            Remaining {money(summary.remaining)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenCanvas
      overlap={moderateScale(24)}
      refreshing={loading && mySchemes.length > 0}
      onRefresh={onRefresh}
      header={
        <PageHeader
          eyebrow="Your position"
          title="Portfolio"
          bleedBottom={moderateScale(24)}
        >
          {loading && mySchemes.length === 0 ? (
            <View style={{ marginTop: SIZES.margin.xxl, gap: 10 }}>
              <SkeletonBlock width="45%" height={12} surface="hero" />
              <SkeletonBlock width="70%" height={44} surface="hero" />
            </View>
          ) : (
            <>
              <View style={{ marginTop: SIZES.margin.xxl }}>
                <Text
                  style={[
                    asText(FONTS.eyebrow),
                    { color: COLORS.heroTextTertiary },
                  ]}
                >
                  Paid to date
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    asText(FONTS.displayXL),
                    { color: COLORS.heroTextPrimary, marginTop: 3 },
                  ]}
                >
                  {money(summary.invested)}
                </Text>
                <Text
                  style={[
                    asText(FONTS.micro),
                    { color: COLORS.heroTextTertiary, marginTop: 2 },
                  ]}
                >
                  {summary.totalInstalments > 0
                    ? `${summary.paid} of ${summary.totalInstalments} instalments · `
                    : ''}
                  {grams(summary.weight, 3)} accrued
                </Text>
              </View>

              {summary.invested > 0 && AllocationBar}
            </>
          )}
        </PageHeader>
      }
    >
      {/* ── Error / empty ── */}
      {error && mySchemes.length === 0 ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load portfolio"
          body={error}
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : isEmpty ? (
        <EmptyState
          icon="diamond-outline"
          title="No holdings yet"
          body="Join a savings scheme to start building your gold position."
          actionLabel="Browse schemes"
          onAction={() =>
            (navigation as any).navigate('Main', { screen: 'Scheme' })
          }
        />
      ) : (
        <>
          {/* ── Headline metric pair ── */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginTop: SIZES.layout.sectionTight,
            }}
          >
            <MetricCard
              flex={1}
              label="Paid"
              value={moneyCompact(summary.invested)}
              icon="wallet-outline"
              tone="default"
            />
            <MetricCard
              flex={1}
              label={summary.remaining > 0 ? 'Still to pay' : 'Instalments'}
              value={
                summary.remaining > 0
                  ? moneyCompact(summary.remaining)
                  : `${summary.paid}/${summary.totalInstalments || summary.paid}`
              }
              icon="hourglass-outline"
              tone="gold"
            />
          </View>

          {/* ── Composition ledger ── */}
          <View style={{ marginTop: SIZES.layout.section }}>
            <SectionHeading eyebrow="Breakdown" title="Composition" />
            <SummaryCard
              rows={compositionRows}
              style={{ marginTop: SIZES.margin.lg }}
            />
          </View>

          {/* ── Holdings ── */}
          <View style={{ marginTop: SIZES.layout.section }}>
            <SectionHeading
              eyebrow="Records"
              title="Holdings"
              count={visible.length}
            />

            {/* Filter rail */}
            <View
              style={[
                s.filterRail,
                {
                  marginTop: SIZES.margin.lg,
                  borderColor: COLORS.hairline,
                  borderRadius: SIZES.radius.tile,
                  backgroundColor: COLORS.canvasElevated,
                },
              ]}
            >
              {filters.map((f, i) => {
                const on = f.key === filter;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={({ pressed }) => [
                      s.filterBtn,
                      {
                        paddingVertical: SIZES.padding.md,
                        borderLeftWidth:
                          i === 0 ? 0 : StyleSheet.hairlineWidth,
                        borderLeftColor: COLORS.hairline,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        asText(FONTS.microBold),
                        { color: on ? COLORS.primary : COLORS.inkTertiary },
                      ]}
                    >
                      {f.label} · {f.count}
                    </Text>
                    {on && (
                      <View
                        style={[s.filterMark, { backgroundColor: COLORS.primary }]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={{ marginTop: SIZES.margin.lg, gap: 12 }}>
              {loading && mySchemes.length === 0 ? (
                <>
                  <SkeletonSchemeCard />
                  <SkeletonSchemeCard />
                </>
              ) : visible.length === 0 ? (
                <EmptyState
                  compact
                  icon="funnel-outline"
                  title="Nothing here"
                  body={`You have no ${filter} schemes.`}
                />
              ) : (
                visible.map((item) => {
                  const done = isCompleted(item);
                  const paidCount = parseInt(
                    item.schemeSummary?.schemaSummaryTransBalance?.insPaid ??
                      '0',
                    10,
                  );
                  const totalCount = parseInt(
                    item.schemeSummary?.instalment ?? '0',
                    10,
                  );
                  const isFullyPaid = done || (totalCount > 0 && paidCount >= totalCount);
                  const mx = schemeMetrics(item);

                  return (
                    <SchemeCardV2
                      key={String(item.regNo)}
                      variant="holding"
                      title={
                        item.schemeSummary?.schemeName ||
                        item.pName ||
                        `Scheme ${item.regNo}`
                      }
                      eyebrow={`REG ${item.regNo} · joined ${
                        item.joinDate ? prettyDate(item.joinDate) : '—'
                      }`}
                      metal="G"
                      metalLabel="GOLD"
                      status={{
                        label: isFullyPaid ? 'Closed' : 'Active',
                        tone: isFullyPaid ? 'info' : 'success',
                      }}
                      stats={[
                        {
                          label: 'Paid',
                          value: money(mx.invested),
                        },
                        {
                          label: 'Weight',
                          value: mx.weight > 0 ? grams(mx.weight, 3) : '—',
                        },
                        {
                          // No bonus in this product — a completed scheme
                          // shows its instalment count, an open one its
                          // next due date.
                          label: isFullyPaid ? 'Instalments' : 'Next due',
                          value: isFullyPaid
                            ? `${mx.paid}${mx.total ? ` of ${mx.total}` : ''}`
                            : item.nextDueDate
                            ? shortDate(item.nextDueDate)
                            : '—',
                        },
                      ]}
                      paid={paidCount}
                      total={isFullyPaid ? 0 : totalCount}
                      actionLabel="View instalments"
                      onAction={() =>
                        (navigation as any).navigate('ViewInstallment', { ppData: item })
                      }
                      secondActionLabel={isFullyPaid ? undefined : 'Pay instalment'}
                      onSecondAction={
                        isFullyPaid
                          ? undefined
                          : () =>
                              (navigation as any).navigate('PayInstallment', { ppData: item })
                      }
                    />
                  );
                })
              )}
            </View>
          </View>
        </>
      )}
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  allocRow: { flexDirection: 'row', gap: 3 },
  legendRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  filterRail: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  filterBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterMark: {
    position: 'absolute',
    bottom: 0,
    left: '22%',
    right: '22%',
    height: 2,
    borderRadius: 1,
  },
});
