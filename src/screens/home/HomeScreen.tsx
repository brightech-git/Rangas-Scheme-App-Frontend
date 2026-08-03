// src/screens/home/HomeScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   1. Dark hero: greeting as the headline, with the LIVE RATES strip
//      living inside the dark zone (market data = "outside world").
//   2. A portfolio slab pulled up over the hero seam — the single
//      biggest number on the screen, straddling dark and paper.
//   3. Paper body: an engraved 3x2 action lattice, an asymmetric
//      metrics pair, holdings as a vertical stack, and the catalogue
//      as a horizontal rail.
//
// WHY THIS IS BETTER UX
//   • Market rates and personal position are now visually separated
//     into two zones, so a member never confuses "gold price" with
//     "my savings" — the old screen stacked them identically.
//   • The number a member opens the app to check (total saved) is the
//     first and largest thing they see, above the fold, unscrolled.
//   • Holdings are a vertical list with visible instalment progress
//     instead of a paged carousel, so multiple schemes are comparable
//     at a glance with no swiping.
//   • Quick actions read as one engraved panel rather than five
//     floating circles, which lowers visual noise near the fold.
//
// REUSED (unchanged business logic)
//   useSchemes, useMySchemes, ratesService, useUnreadCount,
//   useAppSelector(auth), HomeBanner, InAppMessageModal, useToast
//
// NEW UI COMPONENTS
//   DashboardHeader, HeroCard, DashboardGrid, MetricCard,
//   GoldRateWidget, SchemeCardV2, SectionHeading, FeatureCard,
//   EmptyState, Skeleton*
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Dimensions, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/RootNavigator';
import { ApiScheme, METAL_LABEL } from '../../types/Scheme/Scheme';
import { PPData } from '../../types/Account/PhoneDetails';
import { useSchemes } from '../../api/hooks/Schemes/useSchemes';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { useUnreadCount } from '../../api/hooks/Notifications/useUnreadCount';
import { ratesService } from '../../api/services/ratesService';
import { RatesResponse } from '../../types/Rates/Rates';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '../../theme';
import { useToast } from '../../components/ui/Toast';
import HomeBanner from '../../components/HomeBanner';
import LOGO from '../../assets/company/logo.png';

import {
  ScreenCanvas,
  DashboardHeader,
  HeroCard,
  DashboardGrid,
  MetricCard,
  GoldRateWidget,
  SchemeCardV2,
  SectionHeading,
  FeatureCard,
  EmptyState,
  SkeletonHero,
  SkeletonSchemeCard,
  SkeletonMetric,
  money,
  moneyCompact,
  grams,
  shortDate,
  type GridAction,
  type HeroStat,
} from '../../components/ui/premium';

const { width: SCREEN_W } = Dimensions.get('window');
type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Pure derivations from PPData (no business logic changed) ──────
function schemeState(pp: PPData): 'active' | 'pending' | 'completed' {
  const closeType = pp.schemeClosedSummary?.closeType ?? '';
  if (closeType.trim() !== '') return 'completed';
  const paid = parseInt(
    pp.schemeSummary?.schemaSummaryTransBalance?.insPaid ?? '0',
    10,
  );
  return paid > 0 ? 'active' : 'pending';
}

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

export default function HomeScreen() {
  const { COLORS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<Nav>();
  const toast = useToast();

  // ── Data (identical calls to before) ──
  const { schemes, loading: schemesLoading, refetch: refetchSchemes } =
    useSchemes();
  const {
    mySchemes,
    loading: mySchemesLoading,
    refetch: refetchMySchemes,
  } = useMySchemes();
  const { unreadCount } = useUnreadCount();
  const user = useAppSelector((s) => s.auth.user);

  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadRates = useCallback(() => {
    ratesService.getRates().then(setRates).catch(() => { });
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      loadRates();
      refetchSchemes();
      await refetchMySchemes();
    } finally {
      setRefreshing(false);
    }
  }, [loadRates, refetchSchemes, refetchMySchemes]);

  // ── Derived portfolio figures ──
  const portfolio = useMemo(() => {
    const active = mySchemes.filter((m) => schemeState(m) !== 'completed');

    const saved = mySchemes.reduce((sum, m) => sum + num(m.totalAmount), 0);
    const withBonus = mySchemes.reduce(
      (sum, m) => sum + num(m.totalAmountWithBonus),
      0,
    );
    const bonus = mySchemes.reduce((sum, m) => sum + num(m.bonusAmount), 0);
    const weight = mySchemes.reduce(
      (sum, m) => sum + num(m.schemeSummary?.totalWeight),
      0,
    );

    const dues = active
      .map((m) => m.nextDueDate)
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      activeCount: active.length,
      saved,
      withBonus,
      bonus,
      weight,
      nextDue: dues[0] ? dues[0].toISOString() : null,
    };
  }, [mySchemes]);

  const heroStats: HeroStat[] = useMemo(
    () => [
      {
        label: 'Active schemes',
        value: String(portfolio.activeCount),
      },
      {
        label: 'Metal accrued',
        value: portfolio.weight > 0 ? grams(portfolio.weight, 3) : '—',
        tone: 'gold',
      },
      {
        label: 'Next due',
        value: portfolio.nextDue ? shortDate(portfolio.nextDue) : '—',
      },
    ],
    [portfolio],
  );

  // ── Quick actions ──
  const actions: GridAction[] = useMemo(
    () => [
      {
        key: 'schemes',
        label: 'Browse\nschemes',
        icon: 'albums-outline',
        onPress: () => (navigation as any).navigate('Scheme'),
      },

      {
        key: 'history',
        label: 'Payment\nhistory',
        icon: 'receipt-outline',
        onPress: () => navigation.navigate('Transactions'),
      },

      {
        key: 'rates',
        label: 'Rate\nhistory',
        icon: 'analytics-outline',
        onPress: () => navigation.navigate('Rates', { metal: 'Gold' }),
      },
    ],
    [navigation],
  );

  const catalogue = useMemo(
    () => schemes.filter((s) => s.ACTIVE === 'Y'),
    [schemes],
  );

  const holdings = useMemo(
    () => mySchemes.filter((m) => schemeState(m) !== 'completed').slice(0, 3),
    [mySchemes],
  );

  const G = SIZES.layout.gutter;
  const RAIL_CARD_W = Math.min(SCREEN_W - G * 2 - moderateScale(36), 320);

  const gold = rates?.gold;
  const silver = rates?.silver;

  // ── Renderers ──
  const renderCatalogueCard = useCallback(
    ({ item }: { item: ApiScheme }) => (
      <SchemeCardV2
        variant="catalogue"
        width={RAIL_CARD_W}
        title={item.schemeName}
        eyebrow={item.SchemeSName}
        metal={item.MetalType}
        metalLabel={METAL_LABEL[item.MetalType] ?? 'Gold'}
        stats={[
          { label: 'Instalments', value: String(item.Instalment) },
          {
            label: 'Type',
            value: item.FixedIns === 'Y' ? 'Fixed' : 'Flexible',
          },
          {
            label: 'Ledger',
            value: item.WeightLedger === 'Y' ? 'Weight' : 'Amount',
          },
        ]}
        actionLabel="View terms & join"
        onAction={() => navigation.navigate('SchemeTerms', { scheme: item })}
        onPress={() => navigation.navigate('SchemeTerms', { scheme: item })}
      />
    ),
    [RAIL_CARD_W, navigation],
  );

  return (
    <ScreenCanvas
      overlap={moderateScale(56)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={
        <DashboardHeader
          name={user?.username ?? 'User'}
          avatarUri={
            (user as any)?.profilePic ?? (user as any)?.picture ?? null
          }
          logo={LOGO}
          brand="RANGAS DIGIGOLD"
          unreadCount={unreadCount}
          bleedBottom={moderateScale(56)}
          onAvatarPress={() => (navigation as any).navigate('Profile')}
          onBellPress={() => navigation.navigate('Notifications')}
        >
          {/* Live market strip — lives in the DARK zone, deliberately
              separated from the member's own position below. */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginTop: SIZES.margin.xxl,
            }}
          >
            <GoldRateWidget
              surface="hero"
              style={{ flex: 1 }}
              metal="Gold"
              rate={gold ? money(gold.currentRate) : '—'}
              purity={gold?.purity}
              unit={gold?.unit}
              changePct={gold?.changePct ?? 0}
              updatedAt={gold?.updatedAt}
              history={gold?.history?.map((h) => h.rate) ?? []}
              sparkWidth={moderateScale(52)}
              onPress={() => navigation.navigate('Rates', { metal: 'Gold' })}
            />
            <GoldRateWidget
              surface="hero"
              style={{ flex: 1 }}
              metal="Silver"
              rate={silver ? money(silver.currentRate) : '—'}
              purity={silver?.purity}
              unit={silver?.unit}
              changePct={silver?.changePct ?? 0}
              updatedAt={silver?.updatedAt}
              history={silver?.history?.map((h) => h.rate) ?? []}
              sparkWidth={moderateScale(52)}
              onPress={() => navigation.navigate('Rates', { metal: 'Silver' })}
            />
          </View>
        </DashboardHeader>
      }
    >

      {/* ── 6. Campaign banner ── */}
      <View style={{ marginHorizontal: -G }}>
        <HomeBanner />
      </View>

      {/* ── 5. Catalogue rail ── */}
      <View style={{ marginTop: SIZES.layout.section }}>
        <SectionHeading
          eyebrow="Open for enrolment"
          title="Schemes"
          count={catalogue.length}
          actionLabel="All"
          onAction={() => (navigation as any).navigate('Scheme')}
        />
      </View>

      {schemesLoading ? (
        <View style={{ marginTop: SIZES.margin.lg }}>
          <SkeletonSchemeCard width={RAIL_CARD_W} />
        </View>
      ) : catalogue.length === 0 ? (
        <EmptyState
          compact
          icon="file-tray-outline"
          title="No schemes available"
          body="New savings schemes will appear here as soon as they open."
        />
      ) : (
        <FlatList
          horizontal
          data={catalogue}
          keyExtractor={(item) => String(item.SchemeId)}
          renderItem={renderCatalogueCard}
          showsHorizontalScrollIndicator={false}
          snapToInterval={RAIL_CARD_W + 12}
          decelerationRate="fast"
          disableIntervalMomentum
          initialNumToRender={3}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          // Break the gutter so cards bleed to the screen edge
          style={{ marginHorizontal: -G, marginTop: SIZES.margin.lg }}
          contentContainerStyle={{ paddingHorizontal: G }}
        />
      )}
      {/* ── 2. Action lattice ── */}
      <View style={{ marginTop: SIZES.layout.section }}>
        <DashboardGrid actions={actions} columns={3} />
      </View>

      {/* ── 4. Holdings ── */}
      <View style={{ marginTop: SIZES.layout.section }}>
        <SectionHeading
          // eyebrow="Our Schemes"
          title="Our Schemes"
          caption={
            mySchemesLoading
              ? 'Loading…'
              : portfolio.activeCount > 0
                ? `${portfolio.activeCount} scheme${portfolio.activeCount === 1 ? '' : 's'
                } in progress`
                : 'Nothing enrolled yet'
          }
          actionLabel={holdings.length > 0 ? 'All' : undefined}
          onAction={
            holdings.length > 0
              ? () => (navigation as any).navigate('Scheme')
              : undefined
          }
        />

        <View style={{ marginTop: SIZES.margin.lg }}>
          {mySchemesLoading ? (
            <FlatList
              horizontal
              data={[1, 2]}
              keyExtractor={(i) => String(i)}
              renderItem={() => <SkeletonSchemeCard width={RAIL_CARD_W} />}
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              style={{ marginHorizontal: -G }}
              contentContainerStyle={{ paddingHorizontal: G }}
            />
          ) : holdings.length === 0 ? (
            <EmptyState
              compact
              icon="albums-outline"
              title="No schemes yet"
              body="Join a savings scheme to start building your gold position."
              actionLabel="Browse schemes"
              onAction={() => (navigation as any).navigate('Scheme')}
            />
          ) : (
            <FlatList
              horizontal
              data={holdings}
              keyExtractor={(m) => String(m.regNo)}
              showsHorizontalScrollIndicator={false}
              snapToInterval={RAIL_CARD_W + 12}
              decelerationRate="fast"
              disableIntervalMomentum
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              style={{ marginHorizontal: -G }}
              contentContainerStyle={{ paddingHorizontal: G }}
              renderItem={({ item: m }) => {
                const state = schemeState(m);
                const paidCount = parseInt(
                  m.schemeSummary?.schemaSummaryTransBalance?.insPaid ?? '0',
                  10,
                );
                const totalCount = parseInt(
                  m.schemeSummary?.instalment ?? '0',
                  10,
                );
                return (
                  <SchemeCardV2
                    width={RAIL_CARD_W}
                    variant="holding"
                    title={m.schemeSummary?.schemeName ?? 'Scheme'}
                    eyebrow={`REG ${m.regNo} · ${m.groupCode ?? ''}`.trim()}
                    metal="G"
                    metalLabel="GOLD"
                    status={{
                      label: state === 'active' ? 'Active' : 'Pending',
                      tone: state === 'active' ? 'success' : 'warning',
                    }}
                    stats={[
                      { label: 'Saved', value: money(num(m.totalAmount)) },
                      {
                        label: 'Weight',
                        value: grams(num(m.schemeSummary?.totalWeight), 3),
                      },
                      { label: 'Instalment', value: money(num(m.amount)) },
                    ]}
                    paid={paidCount}
                    total={totalCount}
                    progressNote={
                      m.nextDueDate ? `Due ${shortDate(m.nextDueDate)}` : undefined
                    }
                    actionLabel="Pay instalment"
                    onAction={() =>
                      navigation.navigate('PayInstallment', { ppData: m })
                    }
                  />
                );
              }}
            />
          )}
        </View>
      </View>





      {/* ── 7. Referral ── */}
      <FeatureCard
        weight="wide"
        eyebrow="Refer & earn"
        title="Give 1g gold, get 1g gold"
        body="Share your code and you both receive a gold credit on their first instalment."
        icon="gift-outline"
        actionLabel="Share"
        style={{ marginTop: SIZES.layout.section }}
        onPress={() =>
          toast.success('Refer & Earn', {
            message: 'Share code GOLD2026 and get 1g free!',
          })
        }
      />
    </ScreenCanvas>
  );
}
