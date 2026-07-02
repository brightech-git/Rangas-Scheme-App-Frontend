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
import { LinearGradient } from 'expo-linear-gradient';

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

// ── Section Header — left red accent bar ─────────────────────────
function SectionHeader({
  title, subtitle, onViewAll,
}: { title: string; subtitle?: string; onViewAll?: () => void }) {
  const { COLORS, FONTS } = useTheme();
  return (
    <View style={sh.wrap}>
      <View style={sh.leftBar} />
      <View style={{ flex: 1 }}>
        <Text style={[sh.title, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[sh.sub, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} style={sh.viewAllBtn}>
          <Text style={[sh.viewAllTxt, { fontFamily: FONTS.family.semiBold }]}>See all</Text>
          <Ionicons name="arrow-forward" size={12} color="#aa0404" />
        </TouchableOpacity>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  leftBar:    { width: 4, height: 22, borderRadius: 2, backgroundColor: '#aa0404' },
  title:      { fontSize: 17 },
  sub:        { fontSize: 11, marginTop: 1 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fff5f5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  viewAllTxt: { fontSize: 12, color: '#aa0404' },
});

// ── Dot Indicator ────────────────────────────────────────────────
function DotIndicator({ total, activeIndex }: { total: number; activeIndex: number }) {
  if (total === 0) return null;
  const maxDots   = 10;
  const display   = Math.min(total, maxDots);
  const remaining = total - maxDots;
  return (
    <View style={dots.row}>
      {Array.from({ length: display }).map((_, i) => (
        <View
          key={i}
          style={[
            dots.dot,
            {
              width: i === activeIndex ? 22 : 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: i === activeIndex ? '#aa0404' : '#ead8d8',
            },
          ]}
        />
      ))}
      {remaining > 0 && (
        <Text style={{ fontSize: 11, color: '#9a4040', marginLeft: 4 }}>+{remaining}</Text>
      )}
    </View>
  );
}
const dots = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 5 },
  dot: {},
});

// ── Rate Tile — horizontal with left accent strip ─────────────────
function RateTile({
  label, rate, unit, changePct, accentColor, icon, onPress,
}: {
  label: string; rate: string; unit: string; changePct: number;
  accentColor: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void;
}) {
  const { COLORS, FONTS, SHADOWS } = useTheme();
  const up = changePct >= 0;
  return (
    <TouchableOpacity
      style={[rt.card, { backgroundColor: COLORS.card, ...SHADOWS.sm }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[rt.strip, { backgroundColor: accentColor }]} />
      <View style={[rt.iconBox, { backgroundColor: accentColor + '1a' }]}>
        <Ionicons name={icon} size={20} color={accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[rt.label, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
          {label}
        </Text>
        <Text style={[rt.value, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
          {rate}
          <Text style={[rt.unit, { fontFamily: FONTS.family.regular, color: COLORS.textTertiary }]}>
            {' '}{unit}
          </Text>
        </Text>
      </View>
      <View style={[rt.pill, { backgroundColor: up ? '#dcfce7' : '#fee2e2' }]}>
        <Ionicons name={up ? 'trending-up' : 'trending-down'} size={12} color={up ? '#16a34a' : '#dc2626'} />
        <Text style={[rt.pillTxt, { color: up ? '#16a34a' : '#dc2626', fontFamily: FONTS.family.semiBold }]}>
          {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}
const rt = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, overflow: 'hidden', marginBottom: 10, paddingVertical: 14, paddingRight: 14, gap: 12 },
  strip:   { width: 5, alignSelf: 'stretch' },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 11, marginBottom: 2 },
  value:   { fontSize: 20, letterSpacing: -0.3 },
  unit:    { fontSize: 12 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  pillTxt: { fontSize: 11 },
});

// ── Quick Action ──────────────────────────────────────────────────
function QuickAction({ icon, label, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void;
}) {
  const { FONTS } = useTheme();
  return (
    <TouchableOpacity style={qa.wrap} onPress={onPress} activeOpacity={0.8}>
      <View style={[qa.circle, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[qa.label, { fontFamily: FONTS.family.medium, color: '#1a0000' }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const qa = StyleSheet.create({
  wrap:   { alignItems: 'center', gap: 6 },
  circle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  label:  { fontSize: 11, textAlign: 'center' },
});

// ── Main Screen ───────────────────────────────────────────────────
export default function HomeScreen() {
  const { COLORS, FONTS, SIZES, SHADOWS } = useTheme();
  const toast      = useToast();
  const navigation = useNavigation<NavProps>();

  const { schemes, loading: schemesLoading }     = useSchemes();
  const { mySchemes, loading: mySchemesLoading } = useMySchemes();
  const activeSchemes = schemes.filter(s => s.ACTIVE === 'Y');

  const [rates, setRates] = useState<RatesResponse | null>(null);
  useEffect(() => { ratesService.getRates().then(setRates).catch(() => {}); }, []);

  const gold    = rates?.gold;
  const silver  = rates?.silver;
  const fmtRate = (n?: number) => n != null ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';

  const [mySchemesIndex,  setMySchemesIndex]  = useState(0);
  const [allSchemesIndex, setAllSchemesIndex] = useState(0);

  const mySchemesFlatListRef  = useRef<FlatList>(null);
  const allSchemesFlatListRef = useRef<FlatList>(null);

  const onMySchemesViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setMySchemesIndex(viewableItems[0].index ?? 0);
  }).current;

  const onAllSchemesViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setAllSchemesIndex(viewableItems[0].index ?? 0);
  }).current;

  const PAD     = SIZES.padding.container;
  const SLIDE_W = SCREEN_W - PAD * 2;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <MainHeader onProfilePress={() => navigation.navigate('Profile' as any)} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>

        {/* ── Banner ── */}
        <View style={{ paddingHorizontal: SIZES.padding.container, paddingTop: 16 }}>
          <HomeBanner />
        </View>

        {/* ── Quick Actions strip ── */}
        <View style={[qs.container, { backgroundColor: COLORS.card, marginHorizontal: SIZES.padding.container, ...SHADOWS.sm }]}>
          <QuickAction icon="grid-outline"    label="Schemes"  color="#aa0404" onPress={() => (navigation as any).navigate('Scheme')} />
          <View style={qs.divider} />
          <QuickAction icon="diamond-outline" label="Buy Gold" color="#cc9900" onPress={() => (navigation as any).navigate('BuyGold')} />
          <View style={qs.divider} />
          <QuickAction icon="receipt-outline" label="History"  color="#2e86de" onPress={() => (navigation as any).navigate('Transactions')} />
          <View style={qs.divider} />
          <QuickAction icon="person-outline"  label="Profile"  color="#8b5cf6" onPress={() => (navigation as any).navigate('Profile')} />
        </View>

        {/* ── Today's Rates ── */}
        <View style={{ paddingHorizontal: SIZES.padding.container, marginTop: 24 }}>
          <SectionHeader
            title="Today's Rates"
            subtitle="Live market prices"
            onViewAll={() => (navigation as any).navigate('Rates', { metal: 'Gold' })}
          />
          <RateTile
            label="Gold (91.6%) · per gram"
            rate={fmtRate(gold?.currentRate)}
            unit="/g"
            changePct={gold?.changePct ?? 0}
            accentColor="#ffcc00"
            icon="diamond-outline"
            onPress={() => (navigation as any).navigate('Rates', { metal: 'Gold' })}
          />
          <RateTile
            label="Silver (91.6%) · per gram"
            rate={fmtRate(silver?.currentRate)}
            unit="/g"
            changePct={silver?.changePct ?? 0}
            accentColor="#9ca3af"
            icon="ellipse-outline"
            onPress={() => (navigation as any).navigate('Rates', { metal: 'Silver' })}
          />
        </View>

        {/* ── My Schemes ── */}
        <View style={{ marginTop: 24 }}>
          <View style={{ paddingHorizontal: SIZES.padding.container }}>
            <SectionHeader
              title="My Schemes"
              subtitle={
                mySchemesLoading ? 'Loading…'
                : mySchemes.length > 0 ? `${mySchemes.length} active enrolment${mySchemes.length !== 1 ? 's' : ''}`
                : 'No schemes joined yet'
              }
              onViewAll={() => (navigation as any).navigate('Scheme')}
            />
          </View>

          {mySchemesLoading ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <ActivityIndicator color="#aa0404" />
            </View>
          ) : (
            <>
              <FlatList
                ref={mySchemesFlatListRef}
                horizontal
                data={mySchemes}
                keyExtractor={(item) => String(item.regNo)}
                renderItem={({ item }) => (
                  <View style={{ width: SCREEN_W, alignItems: 'center', justifyContent: 'center' }}>
                    <GlassSchemeCard item={item} width={SCREEN_W - 32} />
                  </View>
                )}
                pagingEnabled
                snapToAlignment="center"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onMySchemesViewable}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                contentContainerStyle={{ alignItems: 'center' }}
                ListEmptyComponent={
                  <View style={[ms.emptyBox, { width: SCREEN_W - 40 }]}>
                    <View style={ms.emptyIconRing}>
                      <Ionicons name="diamond-outline" size={28} color="#aa0404" />
                    </View>
                    <Text style={[ms.emptyTitle, { fontFamily: FONTS.family.semiBold }]}>
                      No schemes yet
                    </Text>
                    <Text style={[ms.emptySub, { fontFamily: FONTS.family.regular }]}>
                      Join a gold scheme to start saving
                    </Text>
                    <TouchableOpacity style={ms.emptyBtn} onPress={() => (navigation as any).navigate('Scheme')}>
                      <Text style={[ms.emptyBtnTxt, { fontFamily: FONTS.family.semiBold }]}>
                        Browse Schemes
                      </Text>
                    </TouchableOpacity>
                  </View>
                }
              />
              {mySchemes.length > 0 && (
                <DotIndicator total={mySchemes.length} activeIndex={mySchemesIndex} />
              )}
            </>
          )}
        </View>

        {/* ── All Schemes ── */}
        <View style={{ marginTop: 24 }}>
          <View style={{ paddingHorizontal: SIZES.padding.container }}>
            <SectionHeader
              title="All Schemes"
              subtitle="Explore & start saving"
              onViewAll={() => (navigation as any).navigate('Scheme')}
            />
          </View>

          {schemesLoading ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <ActivityIndicator color="#aa0404" />
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
                onViewableItemsChanged={onAllSchemesViewable}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                ListEmptyComponent={
                  <View style={{ paddingHorizontal: SIZES.padding.container }}>
                    <Text style={{ color: COLORS.textTertiary, fontFamily: FONTS.family.regular }}>
                      No schemes available
                    </Text>
                  </View>
                }
              />
              {activeSchemes.length > 0 && (
                <DotIndicator total={activeSchemes.length} activeIndex={allSchemesIndex} />
              )}
            </>
          )}
        </View>

        {/* ── Referral Banner ── */}
        <View style={{ paddingHorizontal: SIZES.padding.container, marginTop: 24 }}>
          <TouchableOpacity
            onPress={() => toast.success('Refer & Earn', { message: 'Share code GOLD2026 and get 1g free!' })}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#aa0404', '#7a0303']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={ref.banner}
            >
              <View style={ref.goldStripe} />
              <View style={ref.iconCircle}>
                <Ionicons name="gift-outline" size={22} color="#ffcc00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[ref.title, { fontFamily: FONTS.family.bold }]}>
                  Refer & Earn 1g Gold Free!
                </Text>
                <Text style={[ref.sub, { fontFamily: FONTS.family.regular }]}>
                  Share code GOLD2026 with friends
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <PoweredByFooter />
      </ScrollView>

      <InAppMessageModal />
    </View>
  );
}

// ── Quick actions styles ──────────────────────────────────────────
const qs = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginTop: 16,
  },
  divider: { width: 1, height: 40, backgroundColor: '#ead8d8' },
});

// ── My schemes empty state ────────────────────────────────────────
const ms = StyleSheet.create({
  emptyBox: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ead8d8',
    borderStyle: 'dashed',
    gap: 8,
    backgroundColor: '#fff5f5',
  },
  emptyIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#aa040430',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle:   { fontSize: 15, color: '#1a0000' },
  emptySub:     { fontSize: 12, color: '#9a4040', textAlign: 'center' },
  emptyBtn:     { marginTop: 6, backgroundColor: '#aa0404', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  emptyBtnTxt:  { color: '#fff', fontSize: 13 },
});

// ── Referral banner styles ────────────────────────────────────────
const ref = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
  },
  goldStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#ffcc00',
    opacity: 0.9,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,204,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, color: '#fff', marginBottom: 2 },
  sub:   { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
});
