// src/screens/scheme/Scheme.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   Hero carries a two-word title plus a hairline segmented rail for
//   "Holdings / Catalogue", with a live count on each side. The body is
//   a single flat list of SchemeCardV2 records — no accordions.
//
//   Detail that previously hid behind a chevron (scheme code, ledger
//   type, enrolment state, maturity) is now surfaced directly in the
//   card's stat strip, because on a savings product these are the exact
//   facts a member compares between schemes.
//
// WHY THIS IS BETTER UX
//   • Removing the expand/collapse means comparing two schemes no
//     longer requires opening both and losing scroll position.
//   • Enrolment-closed schemes are visibly disabled at the card level
//     rather than only at the button, so the member knows before
//     reading to the bottom.
//   • Holdings show instalment progress on the card face, which was
//     previously buried inside the expanded panel.
//
// REUSED (unchanged business logic)
//   useSchemes, useMySchemes, ApiScheme / PPData shapes,
//   METAL_LABEL, PoweredByFooter, navigation targets SchemeTerms /
//   PayInstallment / Home
//
// NEW UI COMPONENTS
//   ScreenCanvas, PageHeader, SchemeCardV2, SectionHeading,
//   EmptyState, SkeletonSchemeCard
// ─────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import PoweredByFooter from '../../components/ui/PoweredByFooter';
import { useSchemes } from '../../api/hooks/Schemes/useSchemes';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { ApiScheme, METAL_LABEL } from '../../types/Scheme/Scheme';
import { PPData } from '../../types/Account/PhoneDetails';

import {
  ScreenCanvas,
  PageHeader,
  SchemeCardV2,
  EmptyState,
  SkeletonSchemeCard,
  asText,
  money,
  grams,
  prettyDate,
  shortDate,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'my' | 'all';

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

function ppStatus(pp: PPData): 'active' | 'pending' | 'completed' {
  const ct = pp.schemeClosedSummary?.closeType ?? '';
  if (ct.trim() !== '') return 'completed';
  return parseInt(
    pp.schemeSummary?.schemaSummaryTransBalance?.insPaid ?? '0',
    10,
  ) > 0
    ? 'active'
    : 'pending';
}

export default function SchemeScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<Nav>();

  const [activeTab, setActiveTab] = useState<Tab>('my');

  const {
    schemes,
    loading: loadingAll,
    error: errorAll,
    refetch: refetchAll,
  } = useSchemes();
  const {
    mySchemes,
    loading: loadingMy,
    error: errorMy,
    refetch: refetchMy,
  } = useMySchemes();

  const catalogue = useMemo(
    () => schemes.filter((s) => s.ACTIVE === 'Y'),
    [schemes],
  );

  const loading = activeTab === 'all' ? loadingAll : loadingMy;
  const error = activeTab === 'all' ? errorAll : errorMy;
  const refetch = activeTab === 'all' ? refetchAll : refetchMy;

  const handleJoin = useCallback(
    (scheme: ApiScheme) => navigation.navigate('SchemeTerms', { scheme }),
    [navigation],
  );

  const tabs: { key: Tab; label: string; count: number }[] = useMemo(
    () => [
      { key: 'my', label: 'Holdings', count: mySchemes.length },
      { key: 'all', label: 'Catalogue', count: catalogue.length },
    ],
    [mySchemes.length, catalogue.length],
  );

  return (
    <ScreenCanvas
      overlap={moderateScale(24)}
      refreshing={loading}
      onRefresh={refetch}
      header={
        <PageHeader
          eyebrow="Savings"
          title="Schemes"
          caption="Your enrolments and everything currently open"
          bleedBottom={moderateScale(24)}
          onBack={() => (navigation as any).navigate('Home')}
        >
          {/* Segmented rail */}
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
            {tabs.map((t, i) => {
              const on = t.key === activeTab;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setActiveTab(t.key)}
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
                  <Text
                    style={[
                      asText(FONTS.microBold),
                      {
                        color: on
                          ? COLORS.heroTextPrimary
                          : COLORS.heroTextMuted,
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                  <Text
                    style={[
                      asText(FONTS.micro),
                      {
                        color: on ? COLORS.heroAccent : COLORS.heroTextMuted,
                        fontSize: 10,
                      },
                    ]}
                  >
                    {t.count}
                  </Text>
                  {on && (
                    <View
                      style={[s.railMark, { backgroundColor: COLORS.heroAccent }]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </PageHeader>
      }
    >
      <View style={{ marginTop: SIZES.layout.sectionTight, gap: 12 }}>
        {/* ── Loading ── */}
        {loading && (
          <>
            <SkeletonSchemeCard />
            <SkeletonSchemeCard />
            <SkeletonSchemeCard />
          </>
        )}

        {/* ── Error ── */}
        {!loading && !!error && (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load schemes"
            body={error}
            actionLabel="Retry"
            onAction={refetch}
          />
        )}

        {/* ── Catalogue ── */}
        {!loading &&
          !error &&
          activeTab === 'all' &&
          (catalogue.length === 0 ? (
            <EmptyState
              icon="file-tray-outline"
              title="No schemes available"
              body="New savings schemes will appear here as soon as they open for enrolment."
            />
          ) : (
            catalogue.map((item) => {
              const canJoin = item.ADDNEWMEMBER === 'Y';
              return (
                <SchemeCardV2
                  key={String(item.SchemeId)}
                  variant="catalogue"
                  title={item.schemeName}
                  eyebrow={`CODE ${item.SchemeSName}`}
                  metal={item.MetalType}
                  metalLabel={METAL_LABEL[item.MetalType] ?? 'Gold'}
                  status={{
                    label: canJoin ? 'Open' : 'Closed',
                    tone: canJoin ? 'success' : 'neutral',
                  }}
                  stats={[
                    { label: 'Instalments', value: String(item.Instalment) },
                    {
                      label: 'Amount',
                      value: item.FixedIns === 'Y' ? 'Fixed' : 'Flexible',
                    },
                    {
                      label: 'Ledger',
                      value: item.WeightLedger === 'Y' ? 'Weight' : 'Amount',
                    },
                  ]}
                  actionLabel={canJoin ? 'View terms & join' : undefined}
                  onAction={canJoin ? () => handleJoin(item) : undefined}
                  onPress={canJoin ? () => handleJoin(item) : undefined}
                  style={canJoin ? undefined : { opacity: 0.55 }}
                />
              );
            })
          ))}

        {/* ── Holdings ── */}
        {!loading &&
          !error &&
          activeTab === 'my' &&
          (mySchemes.length === 0 ? (
            <EmptyState
              icon="folder-open-outline"
              title="No enrolments yet"
              body="Browse the catalogue to find a savings scheme that fits your goal."
              actionLabel="Browse catalogue"
              onAction={() => setActiveTab('all')}
            />
          ) : (
            mySchemes.map((item) => {
              const status = ppStatus(item);
              const paid = parseInt(
                item.schemeSummary?.schemaSummaryTransBalance?.insPaid ?? '0',
                10,
              );
              const total = parseInt(item.schemeSummary?.instalment ?? '0', 10);
              const done = status === 'completed';

              return (
                <SchemeCardV2
                  key={String(item.regNo)}
                  variant="holding"
                  title={item.schemeSummary?.schemeName ?? item.pName}
                  eyebrow={`REG ${item.regNo} · ${
                    item.schemeSummary?.fixedIns === 'Y' ? 'FIXED' : 'FLEXIBLE'
                  }`}
                  metal="G"
                  metalLabel="GOLD"
                  status={{
                    label:
                      status.charAt(0).toUpperCase() + status.slice(1),
                    tone:
                      status === 'active'
                        ? 'success'
                        : status === 'completed'
                        ? 'info'
                        : 'warning',
                  }}
                  stats={[
                    {
                      label: 'Invested',
                      value: money(num(item.totalAmount)),
                    },
                    {
                      label: 'With bonus',
                      value: money(num(item.totalAmountWithBonus)),
                    },
                    {
                      label: 'Weight',
                      value: grams(num(item.schemeSummary?.totalWeight), 3),
                    },
                  ]}
                  paid={paid}
                  total={done ? 0 : total}
                  progressNote={
                    item.nextDueDate
                      ? `Next ${shortDate(item.nextDueDate)}`
                      : item.maturityDate
                      ? `Matures ${prettyDate(item.maturityDate)}`
                      : undefined
                  }
                  actionLabel={done ? undefined : 'Pay instalment'}
                  onAction={
                    done
                      ? undefined
                      : () =>
                          navigation.navigate('PayInstallment', {
                            ppData: item,
                          })
                  }
                  onPress={
                    done
                      ? undefined
                      : () =>
                          navigation.navigate('PayInstallment', {
                            ppData: item,
                          })
                  }
                />
              );
            })
          ))}
      </View>

      <PoweredByFooter style={{ marginTop: SIZES.layout.section }} />
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  rail: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
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
});
