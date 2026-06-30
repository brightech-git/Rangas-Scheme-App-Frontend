// src/screens/home/HomeScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ViewToken,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { RootStackParamList } from '../../navigation/RootNavigator';
import { ApiScheme, METAL_COLOR, METAL_LABEL } from '../../types/Scheme/Scheme';
import { PPData } from '../../types/Account/PhoneDetails';
import { useSchemes } from '../../api/hooks/Schemes/useSchemes';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { ratesService } from '../../api/services/ratesService';
import { RatesResponse } from '../../types/Rates/Rates';
import { useTheme } from '../../theme';
import MainHeader from '../../components/ui/MainHeader';
import PoweredByFooter from '../../components/ui/PoweredByFooter';
import AppText from '../../components/ui/appcomponents/AppText';
import AppIcon from '../../components/ui/appcomponents/AppIcons';
import { useToast } from '../../components/ui/Toast';
import Sidebar from '../../components/Sidebar';
import HomeBanner from '../../components/HomeBanner';
import InAppMessageModal from '../../components/InAppMessageModal';
import GlassSchemeCard from '../../components/ui/GlassSchemeCard';
import SchemeListCard from '../../components/ui/SchemeListCard';

const { width: SCREEN_W } = Dimensions.get('window');
type NavProps = NativeStackNavigationProp<RootStackParamList>;

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(raw: string): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function schemeStatus(pp: PPData): 'active' | 'pending' | 'completed' {
  const ct = pp.schemeClosedSummary?.closeType ?? '';
  if (ct && ct.trim() !== '') return 'completed';
  const paid = parseInt(pp.schemeSummary?.schemaSummaryTransBalance?.insPaid ?? '0');
  return paid > 0 ? 'active' : 'pending';
}

const CYCLE_GRADIENTS: [string, string][] = [
  ['#E8A020', '#C87010'],
  ['#909090', '#606060'],
  ['#607D8B', '#455A64'],
  ['#00ACC1', '#00838F'],
  ['#7B5EA7', '#5C3D8F'],
  ['#E57373', '#C62828'],
];
const STATUS_CLR: Record<string, string> = {
  active: '#4CAF50',
  pending: '#FF9800',
  completed: '#C9A84C',
};

// ── My-Scheme Slider Card ─────────────────────────────────────────
function MySchemeCard({ item, index }: { item: PPData; index: number }) {
  const { FONTS } = useTheme();
  const [g1, g2] = CYCLE_GRADIENTS[index % CYCLE_GRADIENTS.length];
  const paid  = parseInt(item.schemeSummary?.schemaSummaryTransBalance?.insPaid ?? '0');
  const total = parseInt(item.schemeSummary?.instalment ?? '1');
  const pct   = total > 0 ? paid / total : 0;
  const status = schemeStatus(item);

  return (
    <View style={[myS.card, { backgroundColor: g1 }]}>
      <View style={[myS.overlay, { backgroundColor: g2 + '80' }]} />
      <View style={myS.topRow}>
        <View style={myS.iconWrap}>
          <Ionicons name="diamond-outline" size={18} color="#fff" />
        </View>
        <View style={[myS.badge, { backgroundColor: STATUS_CLR[status] }]}>
          <Text style={[myS.badgeTxt, { fontFamily: FONTS.family.bold }]}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[myS.title, { fontFamily: FONTS.family.bold }]} numberOfLines={1}>
        {item.schemeSummary?.schemeName ?? item.pName}
      </Text>
      <View style={myS.statsRow}>
        <View>
          <Text style={[myS.val, { fontFamily: FONTS.family.bold }]}>
            ₹{item.totalAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={[myS.lbl, { fontFamily: FONTS.family.regular }]}>Invested</Text>
        </View>
        <View style={myS.div} />
        <View>
          <Text style={[myS.val, { fontFamily: FONTS.family.bold }]}>
            ₹{item.totalAmountWithBonus.toLocaleString('en-IN')}
          </Text>
          <Text style={[myS.lbl, { fontFamily: FONTS.family.regular }]}>With Bonus</Text>
        </View>
        <View style={myS.div} />
        <View>
          <Text style={[myS.val, { fontFamily: FONTS.family.bold }]}>{paid}/{total}</Text>
          <Text style={[myS.lbl, { fontFamily: FONTS.family.regular }]}>EMIs</Text>
        </View>
      </View>
      <View style={myS.track}>
        <View style={[myS.fill, { width: `${Math.min(pct * 100, 100)}%` as any }]} />
      </View>
      <View style={myS.bottomRow}>
        <Text style={[myS.next, { fontFamily: FONTS.family.regular }]}>
          Next: {formatDate(item.nextDueDate ?? '')}
        </Text>
        <Text style={[myS.pct, { fontFamily: FONTS.family.semiBold }]}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
    </View>
  );
}

const myS = StyleSheet.create({
  card:     { width: SCREEN_W * 0.72, borderRadius: 20, padding: 18, marginRight: 14, overflow: 'hidden', minHeight: 180 },
  overlay:  { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#ffffff25', alignItems: 'center', justifyContent: 'center' },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeTxt: { color: '#fff', fontSize: 10 },
  title:    { color: '#fff', fontSize: 15, marginBottom: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  val:      { color: '#fff', fontSize: 14 },
  lbl:      { color: '#ffffff99', fontSize: 10, marginTop: 2 },
  div:      { width: 1, height: 28, backgroundColor: '#ffffff30' },
  track:    { height: 4, backgroundColor: '#ffffff30', borderRadius: 2, marginBottom: 6 },
  fill:     { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  bottomRow:{ flexDirection: 'row', justifyContent: 'space-between' },
  next:     { color: '#ffffffbb', fontSize: 11 },
  pct:      { color: '#fff', fontSize: 11 },
});

// ── All-Scheme Card ───────────────────────────────────────────────
function AllSchemeCard({ item, onJoin }: { item: ApiScheme; onJoin: (s: ApiScheme) => void }) {
  const { COLORS, FONTS, SHADOWS } = useTheme();
  const mColor = METAL_COLOR[item.MetalType] ?? COLORS.primary;
  const mLabel = METAL_LABEL[item.MetalType] ?? item.MetalType;
  const canJoin = item.ADDNEWMEMBER === 'Y';

  return (
    <View style={[allS.card, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight, ...SHADOWS.sm }]}>
      <View style={[allS.iconBox, { backgroundColor: mColor + '18' }]}>
        <Ionicons name="diamond-outline" size={20} color={mColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[allS.name, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]} numberOfLines={1}>
          {item.schemeName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <View style={[allS.badge, { backgroundColor: mColor + '18' }]}>
            <Text style={[allS.badgeTxt, { color: mColor, fontFamily: FONTS.family.medium }]}>{mLabel}</Text>
          </View>
          <Text style={[allS.instalment, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
            {item.Instalment} instalments · {item.FixedIns === 'Y' ? 'Fixed' : 'Flexible'}
          </Text>
        </View>
      </View>
      {canJoin && (
        <TouchableOpacity
          style={[allS.joinBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => onJoin(item)}
          activeOpacity={0.85}
        >
          <Text style={[allS.joinTxt, { color: '#fff', fontFamily: FONTS.family.semiBold }]}>Join</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const allS = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  iconBox:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name:      { fontSize: 14 },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt:  { fontSize: 11 },
  instalment:{ fontSize: 11 },
  joinBtn:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  joinTxt:   { fontSize: 13 },
});

// ── Section Header ────────────────────────────────────────────────
function SectionHeader({ title, subtitle, onViewAll }: { title: string; subtitle?: string; onViewAll?: () => void }) {
  const { COLORS, FONTS } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <View>
        <Text style={{ color: COLORS.textPrimary, fontFamily: FONTS.family.bold, fontSize: 17 }}>{title}</Text>
        {subtitle ? <Text style={{ color: COLORS.textTertiary, fontFamily: FONTS.family.regular, fontSize: 12, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <Text style={{ color: COLORS.primary, fontFamily: FONTS.family.semiBold, fontSize: 13 }}>View All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Dot Indicator Component ──────────────────────────────────────
function DotIndicator({ 
  total, 
  activeIndex, 
  color = '#C9A84C',
  dotSize = 8,
  activeDotSize = 20,
  dotGap = 6,
}: { 
  total: number; 
  activeIndex: number; 
  color?: string;
  dotSize?: number;
  activeDotSize?: number;
  dotGap?: number;
}) {
  const { COLORS } = useTheme();
  
  if (total === 0) return null;
  
  const maxDots = 10;
  const displayTotal = Math.min(total, maxDots);
  const remaining = total - maxDots;

  return (
    <View style={[dotsStyles.container, { gap: dotGap }]}>
      {Array.from({ length: displayTotal }).map((_, i) => (
        <View
          key={i}
          style={[
            dotsStyles.dot,
            {
              backgroundColor: i === activeIndex ? color : COLORS.borderLight,
              width: i === activeIndex ? activeDotSize : dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
            },
          ]}
        />
      ))}
      {remaining > 0 && (
        <Text style={[dotsStyles.count, { color: COLORS.textTertiary }]}>
          +{remaining}
        </Text>
      )}
    </View>
  );
}

const dotsStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dot: {
    backgroundColor: '#ccc',
  },
  count: {
    fontSize: 12,
    fontFamily: 'System',
    marginLeft: 4,
  },
});

// ── Main Screen ───────────────────────────────────────────────────
export default function HomeScreen() {
  const { COLORS, FONTS, SIZES, SHADOWS } = useTheme();
  const toast      = useToast();
  const navigation = useNavigation<NavProps>();

  const { schemes, loading: schemesLoading }         = useSchemes();
  const { mySchemes, loading: mySchemesLoading }     = useMySchemes();

  const activeSchemes = schemes.filter(s => s.ACTIVE === 'Y');

  // Live gold/silver rates (91.6%) from the API
  const [rates, setRates] = useState<RatesResponse | null>(null);
  useEffect(() => { ratesService.getRates().then(setRates).catch(() => {}); }, []);
  const gold   = rates?.gold;
  const silver = rates?.silver;
  const goldUp   = (gold?.changePct ?? 0) >= 0;
  const silverUp = (silver?.changePct ?? 0) >= 0;
  const fmtRate  = (n?: number) => (n != null ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—');
  const fmtPct   = (n?: number) => (n != null ? `${n >= 0 ? '+' : ''}${n.toFixed(2)}%` : '—');

  // State for dot indicators
  const [mySchemesIndex, setMySchemesIndex] = useState(0);
  const [allSchemesIndex, setAllSchemesIndex] = useState(0);
  
  // Refs for FlatList
  const mySchemesFlatListRef = useRef<FlatList>(null);
  const allSchemesFlatListRef = useRef<FlatList>(null);

  // Handle scroll for My Schemes
  const handleMySchemesScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_W);
    setMySchemesIndex(index);
  };

  // Handle scroll for All Schemes
  const handleAllSchemesScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_W);
    setAllSchemesIndex(index);
  };

  // Viewable items changed handler for My Schemes
  const onMySchemesViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index || 0;
      setMySchemesIndex(index);
    }
  }).current;

  // Viewable items changed handler for All Schemes
  const onAllSchemesViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index || 0;
      setAllSchemesIndex(index);
    }
  }).current;

  // Full-width slider geometry: each "page" advances by the full screen width.
  const PAD     = SIZES.padding.container;
  const SLIDE_W = SCREEN_W - PAD * 2;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <MainHeader onProfilePress={() => navigation.navigate('Profile' as any)} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 24, paddingBottom: 32 }}>

        {/* Banner */}
        <View style={{ paddingHorizontal: SIZES.padding.container }}>
          <HomeBanner />
        </View>

        {/* ── Metal Rate Tiles ── */}
        <View style={{ paddingHorizontal: SIZES.padding.container }}>
          <SectionHeader title="Today's Rates" subtitle="Live market prices" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Gold 916 Tile */}
            <TouchableOpacity
              style={[rateTile.card, { backgroundColor: COLORS.card, borderColor: '#C9A84C40', flex: 1, ...SHADOWS.sm }]}
              onPress={() => navigation.navigate('Rates', { metal: 'Gold' })}
              activeOpacity={0.82}
            >
              <View style={[rateTile.iconWrap, { backgroundColor: '#C9A84C18' }]}>
                <Ionicons name="diamond-outline" size={18} color="#C9A84C" />
              </View>
              <Text style={[rateTile.metalLbl, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                Gold Rate (91.6%)
              </Text>
              <Text style={[rateTile.rateVal, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
                {fmtRate(gold?.currentRate)}<Text style={[rateTile.unit, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>/g</Text>
              </Text>
              <View style={rateTile.changeRow}>
                <Ionicons name={goldUp ? 'caret-up' : 'caret-down'} size={10} color={goldUp ? '#22C55E' : '#EF4444'} />
                <Text style={[rateTile.changeTxt, { color: goldUp ? '#22C55E' : '#EF4444', fontFamily: FONTS.family.medium }]}>{fmtPct(gold?.changePct)}</Text>
              </View>
              <View style={rateTile.footer}>
                <Text style={[rateTile.viewTxt, { color: '#C9A84C', fontFamily: FONTS.family.semiBold }]}>View chart</Text>
                <Ionicons name="chevron-forward" size={12} color="#C9A84C" />
              </View>
            </TouchableOpacity>

            {/* Silver Tile */}
            <TouchableOpacity
              style={[rateTile.card, { backgroundColor: COLORS.card, borderColor: '#7A8FA640', flex: 1, ...SHADOWS.sm }]}
              onPress={() => navigation.navigate('Rates', { metal: 'Silver' })}
              activeOpacity={0.82}
            >
              <View style={[rateTile.iconWrap, { backgroundColor: '#7A8FA618' }]}>
                <Ionicons name="ellipse-outline" size={18} color="#7A8FA6" />
              </View>
              <Text style={[rateTile.metalLbl, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                Silver Rate (91.6%)
              </Text>
              <Text style={[rateTile.rateVal, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
                {fmtRate(silver?.currentRate)}<Text style={[rateTile.unit, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>/g</Text>
              </Text>
              <View style={rateTile.changeRow}>
                <Ionicons name={silverUp ? 'caret-up' : 'caret-down'} size={10} color={silverUp ? '#22C55E' : '#EF4444'} />
                <Text style={[rateTile.changeTxt, { color: silverUp ? '#22C55E' : '#EF4444', fontFamily: FONTS.family.medium }]}>{fmtPct(silver?.changePct)}</Text>
              </View>
              <View style={rateTile.footer}>
                <Text style={[rateTile.viewTxt, { color: '#7A8FA6', fontFamily: FONTS.family.semiBold }]}>View chart</Text>
                <Ionicons name="chevron-forward" size={12} color="#7A8FA6" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── My Joined Schemes ── */}
        <View>
          <View style={{ paddingHorizontal: SIZES.padding.container }}>
            <SectionHeader
              title="My Schemes"
              subtitle={
                mySchemesLoading
                  ? 'Loading…'
                  : mySchemes.length > 0
                  ? `${mySchemes.length} active enrolment${mySchemes.length !== 1 ? 's' : ''}`
                  : 'No schemes joined yet'
              }
              onViewAll={() => (navigation as any).navigate('Scheme')}
            />
          </View>

          {mySchemesLoading ? (
            <View style={{ paddingVertical: 28, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (
            <>
              <FlatList
                ref={mySchemesFlatListRef}
                horizontal
                data={mySchemes}
                keyExtractor={(item) => String(item.regNo)}
                renderItem={({ item }) => (
                  <View
                    style={{
                      width: SCREEN_W,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GlassSchemeCard
                      item={item}
                      width={SCREEN_W - 32}
                    />
                  </View>
                )}
                pagingEnabled
                snapToAlignment="center"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onScroll={handleMySchemesScroll}
                onViewableItemsChanged={onMySchemesViewableItemsChanged}
                viewabilityConfig={{
                  itemVisiblePercentThreshold: 50,
                }}
                contentContainerStyle={{
                  alignItems: 'center',
                }}
                ListEmptyComponent={
                  <View
                    style={[
                      pageS.emptyBox,
                      {
                        width: SCREEN_W,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderColor: COLORS.borderLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name="diamond-outline"
                      size={28}
                      color={COLORS.textTertiary}
                    />
                    <Text
                      style={[
                        pageS.emptyTxt,
                        {
                          color: COLORS.textTertiary,
                          fontFamily: FONTS.family.regular,
                        },
                      ]}
                    >
                      No schemes joined yet
                    </Text>
                  </View>
                }
              />
              
              {/* Dots for My Schemes */}
              {mySchemes.length > 0 && (
                <DotIndicator 
                  total={mySchemes.length} 
                  activeIndex={mySchemesIndex} 
                  color="#C9A84C"
                />
              )}
            </>
          )}
        </View>

        {/* ── All Schemes (full-width slider) ── */}
        <View>
          <View style={{ paddingHorizontal: SIZES.padding.container }}>
            <SectionHeader
              title="All Schemes"
              subtitle="Explore & start saving"
              onViewAll={() => (navigation as any).navigate('Scheme')}
            />
          </View>
          {schemesLoading ? (
            <View style={{ paddingVertical: 28, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (
            <>
              <FlatList
                ref={allSchemesFlatListRef}
                horizontal
                data={activeSchemes}
                keyExtractor={(item) => String(item.SchemeId)}
                renderItem={({ item }) => (
                  <SchemeListCard
                    item={item}
                    width={SLIDE_W}
                    onJoin={(s) => (navigation as any).navigate('SchemeTerms', { scheme: s })}
                  />
                )}
                contentContainerStyle={{ paddingHorizontal: PAD }}
                ItemSeparatorComponent={() => <View style={{ width: PAD * 2 }} />}
                snapToInterval={SCREEN_W}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum
                showsHorizontalScrollIndicator={false}
                onScroll={handleAllSchemesScroll}
                onViewableItemsChanged={onAllSchemesViewableItemsChanged}
                viewabilityConfig={{
                  itemVisiblePercentThreshold: 50,
                }}
                ListEmptyComponent={
                  <View style={{ paddingHorizontal: SIZES.padding.container }}>
                    <Text style={{ color: COLORS.textTertiary, fontFamily: FONTS.family.regular }}>
                      No schemes available
                    </Text>
                  </View>
                }
              />
              
              {/* Dots for All Schemes */}
              {activeSchemes.length > 0 && (
                <DotIndicator 
                  total={activeSchemes.length} 
                  activeIndex={allSchemesIndex} 
                  color={COLORS.primary}
                />
              )}
            </>
          )}
        </View>

        {/* ── Referral Banner ── */}
        <View style={{ paddingHorizontal: SIZES.padding.container }}>
          <TouchableOpacity
            onPress={() => toast.success('Refer & Earn', { message: 'Share code GOLD2026 and get 1g free!' })}
            style={[pageS.referBanner, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight, ...SHADOWS.sm }]}
          >
            <AppIcon name="gift-outline" variant="gold" size={28} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium" style={{ fontWeight: 'bold' }}>Refer a Friend, Get 1g Gold Free!</AppText>
              <AppText variant="caption">Share your code and earn rewards.</AppText>
            </View>
            <AppIcon name="chevron-forward-outline" variant="ghost" />
          </TouchableOpacity>
        </View>

        <PoweredByFooter />
      </ScrollView>

      <InAppMessageModal />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const rateTile = StyleSheet.create({
  card:      { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  iconWrap:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  metalLbl:  { fontSize: 11 },
  rateVal:   { fontSize: 22, letterSpacing: -0.5, marginTop: 2 },
  unit:      { fontSize: 13 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  changeTxt: { fontSize: 12 },
  footer:    { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 2 },
  viewTxt:   { fontSize: 12 },
});

const pageS = StyleSheet.create({
  emptyBox: {
    width: SCREEN_W * 0.7,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTxt:    { fontSize: 13 },
  viewMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  viewMoreTxt: { fontSize: 14 },
  referBanner: { borderRadius: 12, padding: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
});