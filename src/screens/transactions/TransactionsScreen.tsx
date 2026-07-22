// src/screens/transactions/TransactionsScreen.tsx

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '../../theme';
import type { ThemeContextType } from '../../theme/types';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { PPData, PaymentHistory } from '../../types/Account/PhoneDetails';
import SubPageHeader from '../../components/ui/SubPageHeader';
import AppEmptyState from '../../components/ui/appcomponents/AppEmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Txn = PaymentHistory & { schemeName: string; regNo: number; ts: number };

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function parseTs(raw?: string): number {
  if (!raw) return 0;
  const d = new Date(raw.replace(' ', 'T'));
  return isNaN(d.getTime()) ? 0 : d.getTime();
}
function fmtDate(raw?: string): string {
  const t = parseTs(raw);
  if (!t) return raw || '—';
  return new Date(t).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TransactionsScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const { COLORS, SIZES } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { mySchemes, loading, error, refetch } = useMySchemes();
  const [filter, setFilter] = useState<number | 'all'>('all');

  const allTxns: Txn[] = useMemo(() => {
    const rows: Txn[] = [];
    for (const s of mySchemes as PPData[]) {
      const name = s.schemeSummary?.schemeName || s.pName || `Scheme ${s.regNo}`;
      for (const p of s.paymentHistoryList ?? []) {
        rows.push({ ...p, schemeName: name, regNo: s.regNo, ts: parseTs(p.updateTime) });
      }
    }
    return rows.sort((a, b) => b.ts - a.ts);
  }, [mySchemes]);

  const txns = useMemo(
    () => (filter === 'all' ? allTxns : allTxns.filter((t) => t.regNo === filter)),
    [allTxns, filter]
  );

  const totalPaid = useMemo(() => txns.reduce((sum, t) => sum + num(t.amount), 0), [txns]);

  const filterChips = useMemo(
    () => [{ key: 'all' as const, label: 'All' }, ...mySchemes.map((s) => ({
      key: s.regNo, label: s.schemeSummary?.schemeName || s.pName || `#${s.regNo}`,
    }))],
    [mySchemes]
  );

  const renderItem = ({ item }: { item: Txn }) => (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="arrow-up-outline" size={18} color={COLORS.success} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>{item.schemeName}</Text>
        <Text style={styles.rowSub}>
          {fmtDate(item.updateTime)}{item.installment ? ` · Instalment ${item.installment}` : ''}
        </Text>
        {!!item.receiptNo && <Text style={styles.rowReceipt}>Receipt {item.receiptNo}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.rowAmount}>{inr(num(item.amount))}</Text>
        {!!num(item.weight) && <Text style={styles.rowWeight}>{num(item.weight).toFixed(3)} g</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.background }]} edges={['top']}>
      <SubPageHeader title="Transactions" subtitle="Your payment history" />

      {loading && allTxns.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : error && allTxns.length === 0 ? (
        <View style={styles.center}>
          <AppEmptyState illustration="⚠️" title="Couldn't load transactions" subtitle={error} cta={{ label: 'Retry', onPress: refetch }} />
        </View>
      ) : allTxns.length === 0 ? (
        <View style={styles.center}>
          <AppEmptyState
            illustration="🧾"
            title="No transactions yet"
            subtitle="Your installment payments will appear here."
            cta={{ label: 'Browse Schemes', onPress: () => (navigation as any).navigate('Main', { screen: 'Scheme' }) }}
          />
        </View>
      ) : (
        <FlatList
          data={txns}
          keyExtractor={(t, i) => `${t.regNo}-${t.receiptNo || i}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
          contentContainerStyle={{ paddingBottom: SIZES.xxl }}
          ListHeaderComponent={
            <View>
              {/* Summary strip */}
              <View style={styles.summary}>
                <View>
                  <Text style={styles.summaryLabel}>{filter === 'all' ? 'Total paid' : 'Scheme total'}</Text>
                  <Text style={styles.summaryValue}>{inr(totalPaid)}</Text>
                </View>
                <View style={styles.summaryCountWrap}>
                  <Text style={styles.summaryCount}>{txns.length}</Text>
                  <Text style={styles.summaryCountLabel}>payments</Text>
                </View>
              </View>

              {/* Filter chips */}
              {filterChips.length > 1 && (
                <FlatList
                  horizontal
                  data={filterChips}
                  keyExtractor={(c) => String(c.key)}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: SIZES.padding.lg, gap: SIZES.sm, paddingBottom: SIZES.sm }}
                  renderItem={({ item }) => {
                    const active = filter === item.key;
                    return (
                      <TouchableOpacity
                        onPress={() => setFilter(item.key)}
                        activeOpacity={0.8}
                        style={[styles.chip, active && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                      >
                        <Text style={[styles.chipTxt, active && { color: COLORS.white }]} numberOfLines={1}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = ({ COLORS, FONTS, SIZES, SHADOWS }: ThemeContextType) =>
  StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, padding: SIZES.padding.xxl, alignItems: 'center', justifyContent: 'center' },

    summary: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: COLORS.primary, borderRadius: SIZES.radius.xl,
      padding: SIZES.padding.xl, margin: SIZES.padding.lg, ...SHADOWS.orange,
    },
    summaryLabel: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.sm, color: COLORS.whiteOpacity70 },
    summaryValue: { fontFamily: FONTS.family.bold, fontSize: SIZES.heading.h2, color: COLORS.white, marginTop: 4 },
    summaryCountWrap: { alignItems: 'center', backgroundColor: COLORS.whiteOpacity20, borderRadius: SIZES.radius.lg, paddingHorizontal: SIZES.padding.lg, paddingVertical: SIZES.padding.sm },
    summaryCount: { fontFamily: FONTS.family.bold, fontSize: SIZES.font.xl, color: COLORS.white },
    summaryCountLabel: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xxs, color: COLORS.whiteOpacity70 },

    chip: {
      paddingHorizontal: SIZES.padding.lg, paddingVertical: SIZES.padding.sm,
      borderRadius: SIZES.radius.full, borderWidth: 1, borderColor: COLORS.border,
      backgroundColor: COLORS.card, maxWidth: 160,
    },
    chipTxt: { fontFamily: FONTS.family.medium, fontSize: SIZES.font.sm, color: COLORS.textSecondary },

    row: {
      flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
      backgroundColor: COLORS.card, marginHorizontal: SIZES.padding.lg, marginBottom: SIZES.sm,
      padding: SIZES.padding.lg, borderRadius: SIZES.radius.lg,
      borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.xs,
    },
    rowIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.successBg, alignItems: 'center', justifyContent: 'center' },
    rowName: { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.md, color: COLORS.textPrimary },
    rowSub: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xs, color: COLORS.textTertiary, marginTop: 2 },
    rowReceipt: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xxs, color: COLORS.textTertiary, marginTop: 1 },
    rowAmount: { fontFamily: FONTS.family.bold, fontSize: SIZES.font.md, color: COLORS.textPrimary },
    rowWeight: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xs, color: COLORS.textTertiary, marginTop: 2 },
  });
