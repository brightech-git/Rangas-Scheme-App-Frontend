// src/screens/rates/RatesScreen.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Polyline, Polygon, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useTheme } from '../../theme';
import { ratesService } from '../../api/services/ratesService';
import { RatesResponse, MetalRates, RateEntry } from '../../types/Rates/Rates';
import PoweredByFooter from '../../components/ui/PoweredByFooter';
import { RootStackParamList } from '../../navigation/RootNavigator';
import SubPageHeader from '../../components/ui/SubPageHeader';

const { width: SW } = Dimensions.get('window');
const CHART_PADDING = 24;
const CHART_W = SW - CHART_PADDING * 2 - 32; // inner chart area
const CHART_H = 180;

type Metal = 'Gold' | 'Silver';

// ── SVG Line Chart ────────────────────────────────────────────────
function RateChart({ data, color }: { data: RateEntry[]; color: string }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (!data || data.length < 2) return null;

  const rates = data.map(d => d.rate);
  const min   = Math.min(...rates);
  const max   = Math.max(...rates);
  const range = max - min || 1;

  const PAD_TOP = 12; const PAD_BOT = 28; const PAD_X = 10;
  const innerH = CHART_H - PAD_TOP - PAD_BOT;
  const innerW = CHART_W - PAD_X * 2;

  const pt = (i: number) => {
    const x = PAD_X + (i / (data.length - 1)) * innerW;
    const y = PAD_TOP + (1 - (rates[i] - min) / range) * innerH;
    return { x, y };
  };

  const linePts  = data.map((_, i) => { const p = pt(i); return `${p.x},${p.y}`; }).join(' ');
  const fillPts  = [
    `${PAD_X},${PAD_TOP + innerH}`,
    ...data.map((_, i) => { const p = pt(i); return `${p.x},${p.y}`; }),
    `${PAD_X + innerW},${PAD_TOP + innerH}`,
  ].join(' ');

  // X-axis labels — show every other to avoid crowding
  const labels = data.map((d, i) => {
    const p = pt(i);
    const short = d.date.slice(0, 6); // "11 Jun"
    return { x: p.x, y: CHART_H - 6, label: short, i };
  }).filter((_, i) => i % 2 === 0 || i === data.length - 1);

  const active = activeIdx !== null ? pt(activeIdx) : null;

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const x = e.nativeEvent.locationX;
          const step = innerW / (data.length - 1);
          const idx = Math.round((x - PAD_X) / step);
          setActiveIdx(Math.max(0, Math.min(idx, data.length - 1)));
        }}
        onResponderMove={(e) => {
          const x = e.nativeEvent.locationX;
          const step = innerW / (data.length - 1);
          const idx = Math.round((x - PAD_X) / step);
          setActiveIdx(Math.max(0, Math.min(idx, data.length - 1)));
        }}
        onResponderRelease={() => setTimeout(() => setActiveIdx(null), 1500)}
      >
        <Defs>
          <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={color} stopOpacity="0.28" />
            <Stop offset="0.8" stopColor={color} stopOpacity="0.04" />
            <Stop offset="1"   stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Fill */}
        <Polygon points={fillPts} fill="url(#chartGrad)" />

        {/* Line */}
        <Polyline points={linePts} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Data dots (small) */}
        {data.map((_, i) => {
          const p = pt(i);
          return <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} opacity={0.5} />;
        })}

        {/* Active indicator */}
        {active && activeIdx !== null && (
          <>
            <Line x1={active.x} y1={PAD_TOP} x2={active.x} y2={PAD_TOP + innerH}
              stroke={color} strokeWidth={1} strokeDasharray="4,3" opacity={0.6} />
            <Circle cx={active.x} cy={active.y} r={6} fill={color} />
            <Circle cx={active.x} cy={active.y} r={9} fill={color} opacity={0.2} />
          </>
        )}

        {/* X axis labels */}
        {labels.map(({ x, y, label }) => (
          <SvgText key={label} x={x} y={y} textAnchor="middle"
            fontSize="9" fill="#9CA3AF">
            {label}
          </SvgText>
        ))}
      </Svg>

      {/* Tooltip */}
      {activeIdx !== null && (
        <View style={[cs.tooltip, { backgroundColor: color, left: Math.max(4, Math.min(CHART_W - 100, pt(activeIdx).x - 46)) }]}>
          <Text style={cs.tooltipDate}>{data[activeIdx].date.slice(0, 6)}</Text>
          <Text style={cs.tooltipRate}>₹{data[activeIdx].rate.toLocaleString('en-IN')}</Text>
        </View>
      )}
    </View>
  );
}

const cs = StyleSheet.create({
  tooltip:     { position: 'absolute', top: -38, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tooltipDate: { color: '#fff', fontSize: 10, opacity: 0.85 },
  tooltipRate: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

// ── Rate Row ──────────────────────────────────────────────────────
function RateRow({ entry, isLast, colors, fonts }: {
  entry: RateEntry; isLast: boolean; colors: any; fonts: any;
}) {
  const up = entry.changePct >= 0;
  return (
    <View style={[rr.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
      <Text style={[rr.date, { color: colors.textSecondary, fontFamily: fonts.family.regular }]}>
        {entry.date.slice(0, 6)}
      </Text>
      <Text style={[rr.rate, { color: colors.textPrimary, fontFamily: fonts.family.semiBold }]}>
        ₹{entry.rate.toLocaleString('en-IN')}
      </Text>
      <View style={rr.changeCell}>
        <Ionicons name={up ? 'caret-up' : 'caret-down'} size={10} color={up ? '#22C55E' : '#EF4444'} />
        <Text style={[rr.changeTxt, { color: up ? '#22C55E' : '#EF4444', fontFamily: fonts.family.medium }]}>
          {up ? '+' : ''}{entry.change.toLocaleString('en-IN')}
        </Text>
        <Text style={[rr.pctTxt, { color: up ? '#22C55E' : '#EF4444', fontFamily: fonts.family.regular }]}>
          ({up ? '+' : ''}{entry.changePct.toFixed(2)}%)
        </Text>
      </View>
    </View>
  );
}

const rr = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  date:      { flex: 1.4, fontSize: 13 },
  rate:      { flex: 1.6, fontSize: 14, textAlign: 'right' },
  changeCell:{ flex: 2.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  changeTxt: { fontSize: 12 },
  pctTxt:    { fontSize: 11 },
});

// ── Main Screen ───────────────────────────────────────────────────
type RouteProps = RouteProp<RootStackParamList, 'Rates'>;

export default function RatesScreen() {
  const { COLORS, FONTS, SIZES, SHADOWS } = useTheme();
  const navigation = useNavigation();
  const route      = useRoute<RouteProps>();

  const initialMetal: Metal = (route.params as any)?.metal ?? 'Gold';

  const [activeMetal, setActiveMetal] = useState<Metal>(initialMetal);
  const [rates,       setRates]       = useState<RatesResponse | null>(null);
  const [loading,     setLoading]     = useState(true);

  const tabAnim = useRef(new Animated.Value(initialMetal === 'Gold' ? 0 : 1)).current;

  const load = useCallback(async () => {
    setLoading(true);
    const data = await ratesService.getRates(10);
    setRates(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const switchMetal = (m: Metal) => {
    setActiveMetal(m);
    Animated.spring(tabAnim, { toValue: m === 'Gold' ? 0 : 1, useNativeDriver: true, damping: 18, stiffness: 200 }).start();
  };

  const metal: MetalRates | null = rates ? rates[activeMetal === 'Gold' ? 'gold' : 'silver'] : null;
  const goldColor   = '#C9A84C';
  const silverColor = '#7A8FA6';
  const activeColor = activeMetal === 'Gold' ? goldColor : silverColor;
  const isUp        = (metal?.changePct ?? 0) >= 0;

  const TAB_W = (SW - 48) / 2;
  const tabTranslate = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, TAB_W] });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: COLORS.background }]} edges={['top']}>

      {/* Header */}
      <SubPageHeader
        title="Metal Rates"
        rightElement={
          <TouchableOpacity onPress={load} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Metal Tabs */}
        <View style={[s.tabsOuter, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight }]}>
          <Animated.View style={[s.tabPill, { width: TAB_W, backgroundColor: activeColor + '18',
            borderColor: activeColor + '50', transform: [{ translateX: tabTranslate }] }]} />
          {(['Gold', 'Silver'] as Metal[]).map(m => {
            const sel = m === activeMetal;
            const clr = m === 'Gold' ? goldColor : silverColor;
            return (
              <TouchableOpacity key={m} style={[s.tab, { width: TAB_W }]} onPress={() => switchMetal(m)} activeOpacity={0.8}>
                <Ionicons name={m === 'Gold' ? 'diamond-outline' : 'ellipse-outline'} size={15} color={sel ? clr : COLORS.textTertiary} />
                <Text style={[s.tabTxt, { color: sel ? clr : COLORS.textTertiary, fontFamily: sel ? FONTS.family.bold : FONTS.family.medium }]}>
                  {m} {m === 'Gold' ? '(916)' : '(999)'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading || !metal ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={activeColor} />
          </View>
        ) : (
          <>
            {/* Current Rate Card */}
            <View style={[s.rateCard, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight, ...SHADOWS.sm, marginHorizontal: 16 }]}>
              <View style={s.rateCardTop}>
                <View style={[s.metalBadge, { backgroundColor: activeColor + '18' }]}>
                  <Ionicons name={activeMetal === 'Gold' ? 'diamond-outline' : 'ellipse-outline'} size={14} color={activeColor} />
                  <Text style={[s.metalBadgeTxt, { color: activeColor, fontFamily: FONTS.family.semiBold }]}>
                    {metal.purity}
                  </Text>
                </View>
                <View style={[s.changePill, { backgroundColor: isUp ? '#22C55E18' : '#EF444418', borderColor: isUp ? '#22C55E40' : '#EF444440' }]}>
                  <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={14} color={isUp ? '#22C55E' : '#EF4444'} />
                  <Text style={[s.changePillTxt, { color: isUp ? '#22C55E' : '#EF4444', fontFamily: FONTS.family.semiBold }]}>
                    {isUp ? '+' : ''}{metal.changePct.toFixed(2)}%
                  </Text>
                </View>
              </View>

              <Text style={[s.rateLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                {metal.unit}
              </Text>
              <Text style={[s.rateValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
                ₹{metal.currentRate.toLocaleString('en-IN')}
              </Text>
              <View style={s.changeRow}>
                <Ionicons name={isUp ? 'caret-up' : 'caret-down'} size={12} color={isUp ? '#22C55E' : '#EF4444'} />
                <Text style={[s.changeAbs, { color: isUp ? '#22C55E' : '#EF4444', fontFamily: FONTS.family.medium }]}>
                  {isUp ? '+' : ''}₹{Math.abs(metal.change).toLocaleString('en-IN')} today
                </Text>
                <Text style={[s.updatedAt, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                  · {metal.updatedAt}
                </Text>
              </View>
            </View>

            {/* Chart Card */}
            <View style={[s.chartCard, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight, ...SHADOWS.sm, marginHorizontal: 16 }]}>
              <View style={s.chartHeader}>
                <Text style={[s.sectionTitle, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                  10-Day Trend
                </Text>
                <Text style={[s.chartSub, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                  Touch chart to see details
                </Text>
              </View>
              <View style={{ marginTop: 8, marginLeft: -4 }}>
                <RateChart data={metal.history} color={activeColor} />
              </View>
            </View>

            {/* Rate List Card */}
            <View style={[s.listCard, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight, ...SHADOWS.sm, marginHorizontal: 16 }]}>
              {/* Table header */}
              <View style={[s.tableHead, { backgroundColor: activeColor + '12', borderBottomColor: COLORS.borderLight }]}>
                <Text style={[s.headTxt, { flex: 1.4, color: COLORS.textTertiary, fontFamily: FONTS.family.semiBold }]}>Date</Text>
                <Text style={[s.headTxt, { flex: 1.6, textAlign: 'right', color: COLORS.textTertiary, fontFamily: FONTS.family.semiBold }]}>Rate/g</Text>
                <Text style={[s.headTxt, { flex: 2.2, textAlign: 'right', color: COLORS.textTertiary, fontFamily: FONTS.family.semiBold }]}>Change</Text>
              </View>

              {[...metal.history].reverse().map((entry, i, arr) => (
                <RateRow key={entry.dateRaw} entry={entry} isLast={i === arr.length - 1} colors={COLORS} fonts={FONTS} />
              ))}
            </View>

            {/* Disclaimer */}
            <View style={[s.disclaimer, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight, marginHorizontal: 16 }]}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.textTertiary} />
              <Text style={[s.disclaimerTxt, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                Rates are indicative and may vary slightly from actual transaction prices.
              </Text>
            </View>
          </>
        )}

        <PoweredByFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle:   { fontSize: 18 },
  loader:        { paddingVertical: 80, alignItems: 'center' },

  // tabs
  tabsOuter:     { flexDirection: 'row', margin: 16, borderRadius: 14, borderWidth: 1, padding: 4, position: 'relative', overflow: 'hidden' },
  tabPill:       { position: 'absolute', top: 4, left: 4, height: '100%', borderRadius: 11, borderWidth: 1.5 },
  tab:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6, zIndex: 1 },
  tabTxt:        { fontSize: 14 },

  // rate card
  rateCard:      { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 12 },
  rateCardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  metalBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  metalBadgeTxt: { fontSize: 13 },
  changePill:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  changePillTxt: { fontSize: 13 },
  rateLabel:     { fontSize: 12, marginBottom: 2 },
  rateValue:     { fontSize: 36, letterSpacing: -1, marginBottom: 4 },
  changeRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeAbs:     { fontSize: 13 },
  updatedAt:     { fontSize: 11 },

  // chart card
  chartCard:     { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 12 },
  chartHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  { fontSize: 15 },
  chartSub:      { fontSize: 11 },

  // list card
  listCard:      { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  tableHead:     { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1 },
  headTxt:       { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 },

  // disclaimer
  disclaimer:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  disclaimerTxt: { fontSize: 11, flex: 1, lineHeight: 16 },
});
