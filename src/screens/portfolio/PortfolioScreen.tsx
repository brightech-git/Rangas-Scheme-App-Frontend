// src/screens/portfolio/PortfolioScreen.tsx

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '../../theme';
import type { ThemeContextType } from '../../theme/types';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { PPData } from '../../types/Account/PhoneDetails';
import ScreenWrapper from '../../components/ui/appcomponents/ScreenWrapper';
import SubPageHeader from '../../components/ui/SubPageHeader';
import AppEmptyState from '../../components/ui/appcomponents/AppEmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const gram = (n: number) => `${n.toFixed(3)} g`;

const isCompleted = (pp: PPData) => (pp.schemeClosedSummary?.closeType ?? '').trim() !== '';

export default function PortfolioScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const { COLORS, SIZES } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { mySchemes, loading, error, refetch } = useMySchemes();

  const summary = useMemo(() => {
    let invested = 0, weight = 0, bonus = 0, value = 0, active = 0, completed = 0;
    for (const s of mySchemes) {
      invested += num(s.totalAmount);
      value    += num(s.totalAmountWithBonus) || num(s.totalAmount);
      bonus    += num(s.bonusAmount);
      weight   += num(s.schemeSummary?.totalWeight);
      if (isCompleted(s)) completed += 1; else active += 1;
    }
    return { invested, weight, bonus, value, active, completed, count: mySchemes.length };
  }, [mySchemes]);

  return (
    <ScreenWrapper
      scroll
      onRefresh={refetch}
      refreshing={loading && mySchemes.length > 0}
      paddingHorizontal={0}
      header={<SubPageHeader title="My Portfolio" subtitle="Your gold savings at a glance" />}
    >
      {loading && mySchemes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error && mySchemes.length === 0 ? (
        <View style={styles.center}>
          <AppEmptyState
            illustration="⚠️"
            title="Couldn't load portfolio"
            subtitle={error}
            cta={{ label: 'Retry', onPress: refetch }}
          />
        </View>
      ) : mySchemes.length === 0 ? (
        <View style={styles.center}>
          <AppEmptyState
            illustration="💎"
            title="No holdings yet"
            subtitle="Join a gold scheme to start building your portfolio."
            cta={{ label: 'Browse Schemes', onPress: () => (navigation as any).navigate('Main', { screen: 'Scheme' }) }}
          />
        </View>
      ) : (
        <View style={{ paddingHorizontal: SIZES.padding.lg, paddingTop: SIZES.md }}>

          {/* Value hero */}
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Total Portfolio Value</Text>
            <Text style={styles.heroValue}>{inr(summary.value)}</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroChip}>
                <Ionicons name="diamond-outline" size={13} color={COLORS.white} />
                <Text style={styles.heroChipTxt}>{gram(summary.weight)}</Text>
              </View>
              {summary.bonus > 0 && (
                <View style={styles.heroChip}>
                  <Ionicons name="gift-outline" size={13} color={COLORS.white} />
                  <Text style={styles.heroChipTxt}>{inr(summary.bonus)} bonus</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stat tiles */}
          <View style={styles.statsRow}>
            <StatTile theme={theme} icon="wallet-outline" label="Invested" value={inr(summary.invested)} />
            <StatTile theme={theme} icon="albums-outline" label="Schemes" value={String(summary.count)} />
          </View>
          <View style={styles.statsRow}>
            <StatTile theme={theme} icon="pulse-outline" label="Active" value={String(summary.active)} tint={COLORS.success} />
            <StatTile theme={theme} icon="checkmark-done-outline" label="Completed" value={String(summary.completed)} tint={COLORS.info} />
          </View>

          {/* Holdings list */}
          <Text style={styles.sectionTitle}>Holdings</Text>
          {mySchemes.map((s) => {
            const done = isCompleted(s);
            return (
              <TouchableOpacity
                key={String(s.regNo)}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => !done && (navigation as any).navigate('PayInstallment', { ppData: s })}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {s.schemeSummary?.schemeName || s.pName || `Scheme ${s.regNo}`}
                    </Text>
                    <Text style={styles.cardSub}>Reg #{s.regNo} · Joined {s.joinDate || '—'}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: (done ? COLORS.info : COLORS.success) + '18' }]}>
                    <Text style={[styles.badgeTxt, { color: done ? COLORS.info : COLORS.success }]}>
                      {done ? 'Completed' : 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardMetrics}>
                  <Metric theme={theme} label="Invested" value={inr(num(s.totalAmount))} />
                  <Metric theme={theme} label="Weight" value={gram(num(s.schemeSummary?.totalWeight))} />
                  <Metric theme={theme} label={done ? 'Value' : 'Next due'} value={done ? inr(num(s.totalAmountWithBonus) || num(s.totalAmount)) : (s.nextDueDate || '—')} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScreenWrapper>
  );
}

function StatTile({ theme, icon, label, value, tint }: {
  theme: ThemeContextType; icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tint?: string;
}) {
  const { COLORS } = theme;
  const styles = makeStyles(theme);
  const color = tint ?? COLORS.primary;
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function Metric({ theme, label, value }: { theme: ThemeContextType; label: string; value: string }) {
  const styles = makeStyles(theme);
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const makeStyles = ({ COLORS, FONTS, SIZES, SHADOWS }: ThemeContextType) =>
  StyleSheet.create({
    center: { padding: SIZES.padding.xxl, alignItems: 'center', justifyContent: 'center', minHeight: 320 },

    hero: {
      backgroundColor: COLORS.primary,
      borderRadius: SIZES.radius.xl,
      padding: SIZES.padding.xl,
      ...SHADOWS.orange,
    },
    heroLabel: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.sm, color: COLORS.whiteOpacity70 },
    heroValue: { fontFamily: FONTS.family.bold, fontSize: SIZES.heading.h1, color: COLORS.white, marginTop: 4, letterSpacing: -0.5 },
    heroRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md, flexWrap: 'wrap' },
    heroChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: COLORS.whiteOpacity20,
      paddingHorizontal: SIZES.padding.md, paddingVertical: 6, borderRadius: SIZES.radius.full,
    },
    heroChipTxt: { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.xs, color: COLORS.white },

    statsRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
    statTile: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
      backgroundColor: COLORS.card, borderRadius: SIZES.radius.lg,
      padding: SIZES.padding.md, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.xs,
    },
    statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xs, color: COLORS.textTertiary },
    statValue: { fontFamily: FONTS.family.bold, fontSize: SIZES.font.lg, color: COLORS.textPrimary },

    sectionTitle: { fontFamily: FONTS.family.bold, fontSize: SIZES.font.lg, color: COLORS.textPrimary, marginTop: SIZES.xl, marginBottom: SIZES.sm },

    card: {
      backgroundColor: COLORS.card, borderRadius: SIZES.radius.lg,
      padding: SIZES.padding.lg, marginBottom: SIZES.md,
      borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
    cardName: { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.md, color: COLORS.textPrimary },
    cardSub: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xs, color: COLORS.textTertiary, marginTop: 2 },
    badge: { paddingHorizontal: SIZES.padding.md, paddingVertical: 4, borderRadius: SIZES.radius.full },
    badgeTxt: { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.xs },
    cardMetrics: {
      flexDirection: 'row', marginTop: SIZES.md, paddingTop: SIZES.md,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, gap: SIZES.sm,
    },
    metricLabel: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xs, color: COLORS.textTertiary },
    metricValue: { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.sm, color: COLORS.textPrimary, marginTop: 2 },
  });
