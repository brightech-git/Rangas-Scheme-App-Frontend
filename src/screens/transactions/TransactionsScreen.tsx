// src/screens/transactions/TransactionsScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   A statement, not a feed. The hero carries the filtered total and
//   payment count. The body groups payments under month headings and
//   renders each month as a continuous timeline with a hairline spine,
//   so a year of instalments reads as a ledger rather than a stack of
//   identical cards.
//
// WHY THIS IS BETTER UX
//   • Month grouping gives the list structure — previously 60 payments
//     were one undifferentiated scroll with no temporal anchors.
//   • The filter rail is horizontally scrollable and shows the active
//     scheme's own total in the hero, so switching filters produces a
//     visibly different answer.
//   • Amount and weight are right-aligned in tabular numerals, so
//     columns line up down the page.
//
// REUSED (unchanged business logic)
//   useMySchemes (data, loading, error, refetch), PPData /
//   PaymentHistory shapes, navigation target Main>Scheme
//
// NEW UI COMPONENTS
//   ScreenCanvas, PageHeader, TimelineCard, SectionHeading,
//   EmptyState, StatusChip, SkeletonTimeline
// ─────────────────────────────────────────────────────────────────

import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { PPData, PaymentHistory } from '../../types/Account/PhoneDetails';

import {
  ScreenCanvas,
  PageHeader,
  TimelineCard,
  EmptyState,
  SkeletonTimeline,
  SkeletonBlock,
  asText,
  money,
  type TimelineEntry,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Txn = PaymentHistory & { schemeName: string; regNo: number; ts: number };

const num = (v: unknown): number => {
  const n =
    typeof v === 'number'
      ? v
      : parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

function parseTs(raw?: string): number {
  if (!raw) return 0;
  const d = new Date(raw.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function dayLabel(ts: number, fallback?: string): string {
  if (!ts) return fallback || '—';
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function monthKey(ts: number): string {
  if (!ts) return 'Undated';
  return new Date(ts).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export default function TransactionsScreen() {
  const navigation = useNavigation<Nav>();
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const { mySchemes, loading, error, refetch } = useMySchemes();
  const [filter, setFilter] = useState<number | 'all'>('all');

  // ── Flatten payment history (same derivation as before) ──
  const allTxns: Txn[] = useMemo(() => {
    const rows: Txn[] = [];
    for (const s of mySchemes as PPData[]) {
      const name =
        s.schemeSummary?.schemeName || s.pName || `Scheme ${s.regNo}`;
      for (const p of s.paymentHistoryList ?? []) {
        rows.push({
          ...p,
          schemeName: name,
          regNo: s.regNo,
          ts: parseTs(p.updateTime),
        });
      }
    }
    return rows.sort((a, b) => b.ts - a.ts);
  }, [mySchemes]);

  const txns = useMemo(
    () =>
      filter === 'all'
        ? allTxns
        : allTxns.filter((t) => t.regNo === filter),
    [allTxns, filter],
  );

  const totalPaid = useMemo(
    () => txns.reduce((sum, t) => sum + num(t.amount), 0),
    [txns],
  );

  const totalWeight = useMemo(
    () => txns.reduce((sum, t) => sum + num(t.weight), 0),
    [txns],
  );

  // ── Group by month ──
  const months = useMemo(() => {
    const map = new Map<string, Txn[]>();
    for (const t of txns) {
      const k = monthKey(t.ts);
      const arr = map.get(k);
      if (arr) arr.push(t);
      else map.set(k, [t]);
    }
    return Array.from(map.entries()).map(([label, items]) => ({
      label,
      items,
      subtotal: items.reduce((sum, t) => sum + num(t.amount), 0),
    }));
  }, [txns]);

  const filterChips = useMemo(
    () => [
      { key: 'all' as const, label: 'All schemes' },
      ...mySchemes.map((s) => ({
        key: s.regNo,
        label: s.schemeSummary?.schemeName || s.pName || `#${s.regNo}`,
      })),
    ],
    [mySchemes],
  );

  const toEntries = useCallback(
    (items: Txn[]): TimelineEntry[] =>
      items.map((t, i) => ({
        id: `${t.regNo}-${t.receiptNo || i}`,
        title: t.schemeName,
        meta: [
          t.receiptNo ? `Receipt ${t.receiptNo}` : null,
          t.installment ? `Instalment ${t.installment}` : null,
          t.chq_CardNo ? String(t.chq_CardNo) : null,
        ]
          .filter(Boolean)
          .join(' · '),
        value: money(num(t.amount)),
        subValue: num(t.weight) ? `${num(t.weight).toFixed(3)} g` : undefined,
        timestamp: dayLabel(t.ts, t.updateTime),
        tone: 'success' as const,
        icon: 'arrow-up',
      })),
    [],
  );

  const G = SIZES.layout.gutter;
  const isEmpty = !loading && allTxns.length === 0;

  return (
    <ScreenCanvas
      overlap={moderateScale(24)}
      refreshing={loading && allTxns.length > 0}
      onRefresh={refetch}
      header={
        <PageHeader
          eyebrow="Statement"
          title="Payments"
          bleedBottom={moderateScale(24)}
        >
          {loading && allTxns.length === 0 ? (
            <View style={{ marginTop: SIZES.margin.xxl, gap: 10 }}>
              <SkeletonBlock width="42%" height={12} surface="hero" />
              <SkeletonBlock width="66%" height={40} surface="hero" />
            </View>
          ) : (
            <View style={{ marginTop: SIZES.margin.xxl }}>
              <Text
                style={[
                  asText(FONTS.eyebrow),
                  { color: COLORS.heroTextTertiary },
                ]}
              >
                {filter === 'all' ? 'Total paid' : 'Scheme total'}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  asText(FONTS.displayXL),
                  { color: COLORS.heroTextPrimary, marginTop: 3 },
                ]}
              >
                {money(totalPaid)}
              </Text>
              <Text
                style={[
                  asText(FONTS.micro),
                  { color: COLORS.heroTextTertiary, marginTop: 2 },
                ]}
              >
                {txns.length} payment{txns.length === 1 ? '' : 's'}
                {totalWeight > 0
                  ? ` · ${totalWeight.toFixed(3)} g accrued`
                  : ''}
              </Text>
            </View>
          )}

          {/* Filter rail */}
          {filterChips.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: SIZES.margin.xxl, marginHorizontal: -G }}
              contentContainerStyle={{ paddingHorizontal: G, gap: 8 }}
            >
              {filterChips.map((c) => {
                const on = filter === c.key;
                return (
                  <Pressable
                    key={String(c.key)}
                    onPress={() => setFilter(c.key)}
                    style={({ pressed }) => [
                      s.chip,
                      {
                        borderRadius: SIZES.radius.pill,
                        paddingHorizontal: SIZES.padding.lg,
                        paddingVertical: SIZES.padding.sm,
                        backgroundColor: on
                          ? COLORS.heroAccentSoft
                          : 'transparent',
                        borderColor: on
                          ? COLORS.heroAccent
                          : COLORS.heroHairlineBold,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        asText(FONTS.microBold),
                        {
                          color: on
                            ? COLORS.heroAccent
                            : COLORS.heroTextTertiary,
                          maxWidth: 150,
                        },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </PageHeader>
      }
    >
      {error && allTxns.length === 0 ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load payments"
          body={error}
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : loading && allTxns.length === 0 ? (
        <View style={{ marginTop: SIZES.layout.sectionTight }}>
          <SkeletonTimeline rows={6} />
        </View>
      ) : isEmpty ? (
        <EmptyState
          icon="receipt-outline"
          title="No payments yet"
          body="Your instalment payments will appear here as a running statement."
          actionLabel="Browse schemes"
          onAction={() =>
            (navigation as any).navigate('Main', { screen: 'Scheme' })
          }
        />
      ) : txns.length === 0 ? (
        <EmptyState
          compact
          icon="funnel-outline"
          title="No payments for this scheme"
          body="Choose another scheme from the filter above."
        />
      ) : (
        months.map((m, mi) => (
          <View
            key={m.label}
            style={{
              marginTop:
                mi === 0 ? SIZES.layout.sectionTight : SIZES.layout.section,
            }}
          >
            {/* Month heading with subtotal */}
            <View
              style={[
                s.monthRow,
                {
                  paddingBottom: SIZES.padding.md,
                  borderBottomColor: COLORS.hairline,
                },
              ]}
            >
              <Text style={[asText(FONTS.eyebrow), { color: COLORS.primaryInk }]}>
                {m.label}
              </Text>
              <Text
                style={[asText(FONTS.microBold), { color: COLORS.inkTertiary }]}
              >
                {money(m.subtotal)}
              </Text>
            </View>

            <View style={{ marginTop: SIZES.margin.xl }}>
              <TimelineCard entries={toEntries(m.items)} />
            </View>
          </View>
        ))
      )}
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  chip: { borderWidth: 1, justifyContent: 'center' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
