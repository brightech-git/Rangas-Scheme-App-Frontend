// src/screens/scheme/Scheme.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IMAGE_BASE_URL } from '@env';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import PoweredByFooter from '../../components/ui/PoweredByFooter';
import { useSchemes } from '../../api/hooks/Schemes/useSchemes';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { ApiScheme, METAL_LABEL, METAL_COLOR } from '../../types/Scheme/Scheme';
import { PPData } from '../../types/Account/PhoneDetails';
import AppHeader from '../../components/ui/appcomponents/AppHeader';

const { width } = Dimensions.get('window');

// ── Helpers ──────────────────────────────────────────────────────
const imgUrl  = (path: string) => (path ? `${IMAGE_BASE_URL}${path}` : '');

function formatDate(raw: string): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ppStatus(pp: PPData): 'active' | 'pending' | 'completed' {
  const ct = pp.schemeClosedSummary?.closeType ?? '';
  if (ct.trim() !== '') return 'completed';
  return parseInt(pp.schemeSummary?.schemaSummaryTransBalance?.insPaid ?? '0') > 0
    ? 'active'
    : 'pending';
}

function statusColor(status: string, COLORS: any): string {
  if (status === 'active')    return COLORS.success;
  if (status === 'completed') return COLORS.warning;
  if (status === 'pending')   return '#FF9800';
  return COLORS.textTertiary;
}

function statusIcon(status: string): keyof typeof Ionicons.glyphMap {
  if (status === 'active')    return 'checkmark-circle';
  if (status === 'completed') return 'checkmark-done-circle';
  if (status === 'pending')   return 'time-outline';
  return 'ellipse-outline';
}

// ── All-Scheme Expandable Card ────────────────────────────────────
function AllSchemeCard({
  item,
  onJoin,
}: {
  item: ApiScheme;
  onJoin: (s: ApiScheme) => void;
}) {
  const { COLORS, FONTS, SHADOWS, moderateScale } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      damping: 12,
      stiffness: 100,
    }).start();
  }, [expanded]);

  const maxHeight  = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 320] });
  const rotateIcon = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const mColor = METAL_COLOR[item.MetalType] ?? COLORS.primary;
  const mLabel = METAL_LABEL[item.MetalType] ?? item.MetalType;
  const canJoin = item.ADDNEWMEMBER === 'Y';

  return (
    <Animated.View style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight, ...SHADOWS.sm }]}>

      {/* Header row */}
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.7} style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {/* Scheme image / fallback icon */}
          <View style={[styles.iconContainer, { backgroundColor: mColor + '12' }]}>
            {item.image_path && !imgError ? (
              <Image
                source={{ uri: imgUrl(item.image_path) }}
                style={styles.schemeImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <Ionicons name="diamond-outline" size={moderateScale(20)} color={mColor} />
            )}
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
              {item.schemeName}
            </Text>
            {/* Metal badge */}
            <View style={[styles.statusBadge, { backgroundColor: mColor + '15' }]}>
              <Ionicons name="ellipse" size={7} color={mColor} />
              <Text style={[styles.statusText, { color: mColor }]}>{mLabel}</Text>
            </View>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
          <Ionicons name="chevron-down" size={moderateScale(22)} color={COLORS.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Always-visible stats */}
      <View style={styles.cardContent}>
        <Text style={[styles.description, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
          {item.FixedIns === 'Y' ? 'Fixed' : 'Flexible'} instalment {mLabel.toLowerCase()} savings scheme.
          Code: {item.SchemeSName}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Instalments</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{item.Instalment}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Metal</Text>
            <Text style={[styles.statValue, { color: mColor, fontFamily: FONTS.family.semiBold }]}>{mLabel}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Amount</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
              {item.FixedIns === 'Y' ? 'Fixed' : 'Flexible'}
            </Text>
          </View>
        </View>
      </View>

      {/* Expandable detail */}
      <Animated.View style={[styles.expandableContent, { maxHeight }]}>
        {expanded && (
          <View style={styles.expandedDetails}>
            <View style={[styles.divider, { backgroundColor: COLORS.borderLight }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Scheme Code</Text>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{item.SchemeSName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Instalment Type</Text>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                {item.FixedIns === 'Y' ? 'Fixed Amount' : 'Flexible Amount'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Weight Ledger</Text>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                {item.WeightLedger === 'Y' ? 'Maintained' : 'Not Maintained'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Enrolment</Text>
              <Text style={[styles.detailValue, {
                color: canJoin ? COLORS.success : COLORS.error ?? '#E53935',
                fontFamily: FONTS.family.semiBold,
              }]}>
                {canJoin ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Action */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: canJoin ? COLORS.primary : COLORS.borderLight }]}
          onPress={() => canJoin && onJoin(item)}
          disabled={!canJoin}
          activeOpacity={canJoin ? 0.85 : 1}
        >
          <Ionicons
            name={canJoin ? 'add-circle-outline' : 'lock-closed-outline'}
            size={20}
            color={canJoin ? COLORS.white : COLORS.textTertiary}
          />
          <Text style={[styles.actionButtonText, {
            color: canJoin ? COLORS.white : COLORS.textTertiary,
            fontFamily: FONTS.family.semiBold,
          }]}>
            {canJoin ? 'Join Scheme' : 'Enrolment Closed'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── My-Scheme Expandable Card ─────────────────────────────────────
function MySchemeCard({
  item,
  index,
}: {
  item: PPData;
  index: number;
}) {
  const { COLORS, FONTS, SHADOWS, moderateScale } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      damping: 12,
      stiffness: 100,
    }).start();
  }, [expanded]);

  const maxHeight  = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 420] });
  const rotateIcon = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const status   = ppStatus(item);
  const sColor   = statusColor(status, COLORS);
  const paid     = parseInt(item.schemeSummary?.schemaSummaryTransBalance?.insPaid ?? '0');
  const total    = parseInt(item.schemeSummary?.instalment ?? '1');
  const pct      = total > 0 ? Math.min(paid / total, 1) : 0;

  return (

    <Animated.View style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight, ...SHADOWS.sm }]}>

      {/* Header */}
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.7} style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '10' }]}>
            <Ionicons name="diamond-outline" size={moderateScale(20)} color={COLORS.primary} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
              {item.schemeSummary?.schemeName ?? item.pName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: sColor + '15' }]}>
              <Ionicons name={statusIcon(status)} size={11} color={sColor} />
              <Text style={[styles.statusText, { color: sColor }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
            </View>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
          <Ionicons name="chevron-down" size={moderateScale(22)} color={COLORS.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Always-visible stats */}
      <View style={styles.cardContent}>
        <Text style={[styles.description, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
          {item.schemeSummary?.fixedIns === 'Y' ? 'Fixed' : 'Flexible'} instalment scheme · Reg No: {item.regNo}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Instalments</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{paid}/{total}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Invested</Text>
            <Text style={[styles.statValue, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]}>
              ₹{item.totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>With Bonus</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
              ₹{item.totalAmountWithBonus.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Expandable */}
      <Animated.View style={[styles.expandableContent, { maxHeight }]}>
        {expanded && (
          <View style={styles.expandedDetails}>
            <View style={[styles.divider, { backgroundColor: COLORS.borderLight }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Total Invested</Text>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                ₹{item.totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Bonus Amount</Text>
              <Text style={[styles.detailValue, { color: COLORS.success, fontFamily: FONTS.family.semiBold }]}>
                ₹{item.bonusAmount.toLocaleString('en-IN')} ({item.bonusPercent}%)
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Total with Bonus</Text>
              <Text style={[styles.detailValue, { color: COLORS.success, fontFamily: FONTS.family.semiBold }]}>
                ₹{item.totalAmountWithBonus.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>EMIs Paid</Text>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{paid} / {total}</Text>
            </View>
            {item.nextDueDate ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Next Due Date</Text>
                <Text style={[styles.detailValue, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]}>
                  {formatDate(item.nextDueDate)}
                </Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Maturity Date</Text>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                {formatDate(item.maturityDate)}
              </Text>
            </View>
            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Progress</Text>
                <Text style={[styles.progressValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                  {Math.round(pct * 100)}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: COLORS.borderLight }]}>
                <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: COLORS.primary }]} />
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Action */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PayInstallment', { ppData: item })}
        >
          <Ionicons name="card-outline" size={20} color={COLORS.white} />
          <Text style={[styles.actionButtonText, { color: COLORS.white, fontFamily: FONTS.family.semiBold }]}>
            Pay Installment
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Skeleton placeholder ──────────────────────────────────────────
function SkeletonCard() {
  const { COLORS } = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight, opacity: pulse }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.borderLight }} />
        <View style={{ gap: 8, flex: 1 }}>
          <View style={{ height: 14, borderRadius: 6, backgroundColor: COLORS.borderLight, width: '60%' }} />
          <View style={{ height: 10, borderRadius: 6, backgroundColor: COLORS.borderLight, width: '35%' }} />
        </View>
      </View>
      <View style={{ marginTop: 16, gap: 10 }}>
        <View style={{ height: 10, borderRadius: 6, backgroundColor: COLORS.borderLight }} />
        <View style={{ height: 10, borderRadius: 6, backgroundColor: COLORS.borderLight, width: '80%' }} />
      </View>
      <View style={{ marginTop: 20, height: 44, borderRadius: 10, backgroundColor: COLORS.borderLight }} />
    </Animated.View>
  );
}


// ── Main Screen ───────────────────────────────────────────────────
export default function SchemeScreen() {
  const { COLORS, FONTS } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeTab, setActiveTab] = useState<'all' | 'my'>('my');

  const { schemes, loading: loadingAll, error: errorAll, refetch: refetchAll } = useSchemes();
  const { mySchemes, loading: loadingMy, error: errorMy, refetch: refetchMy } = useMySchemes();

  const activeSchemes = schemes.filter(s => s.ACTIVE === 'Y');

  const loading  = activeTab === 'all' ? loadingAll  : loadingMy;
  const error    = activeTab === 'all' ? errorAll    : errorMy;
  const refetch  = activeTab === 'all' ? refetchAll  : refetchMy;

  const handleJoin = (scheme: ApiScheme) => {
    navigation.navigate('SchemeTerms', { scheme });
  };

  return (<>
         <AppHeader
        title="Schemes"
        showBack
        onBackPress={() => (navigation as any).navigate('Home')}
      />

      {/* Header */}


      {/* Tab Switcher */}
      <View style={[styles.tabContainer, { backgroundColor: COLORS.background }]}>
        <View style={[styles.tabWrapper, { backgroundColor: COLORS.borderLight }]}>
          {(['all', 'my'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && [styles.activeTab, { backgroundColor: COLORS.primary }]]}
                onPress={() => setActiveTab(tab)}
              >
                <Ionicons
                  name={tab === 'all'
                    ? (isActive ? 'grid' : 'grid-outline')
                    : (isActive ? 'folder' : 'folder-outline')}
                  size={16}
                  color={isActive ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[styles.tabText, { fontFamily: FONTS.family.medium, color: isActive ? COLORS.white : COLORS.textSecondary }]}>
                  {tab === 'all' ? 'View All' : 'My Schemes'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
      >
        {/* Loading skeletons */}
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.textTertiary} />
            <Text style={[styles.errorText, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { borderColor: COLORS.primary }]} onPress={refetch}>
              <Text style={[styles.retryTxt, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View All tab */}
        {!loading && !error && activeTab === 'all' && (
          activeSchemes.length === 0 ? (
            <View style={styles.errorBox}>
              <Ionicons name="diamond-outline" size={36} color={COLORS.textTertiary} />
              <Text style={[styles.errorText, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>No schemes available</Text>
            </View>
          ) : (
            activeSchemes.map((item) => (
              <AllSchemeCard key={item.SchemeId} item={item} onJoin={handleJoin} />
            ))
          )
        )}

        {/* My Schemes tab */}
        {!loading && !error && activeTab === 'my' && (
          mySchemes.length === 0 ? (
            <View style={styles.errorBox}>
              <Ionicons name="folder-open-outline" size={36} color={COLORS.textTertiary} />
              <Text style={[styles.errorText, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
                You haven't joined any schemes yet.
              </Text>
              <TouchableOpacity
                style={[styles.retryBtn, { borderColor: COLORS.primary }]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.retryTxt, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]}>Browse Schemes</Text>
              </TouchableOpacity>
              {/* DEV TEST ONLY — remove before release */}
  
            </View>
          ) : (
            mySchemes.map((item, index) => (
              <MySchemeCard key={item.regNo} item={item} index={index} />
            ))
          )
        )}
      <PoweredByFooter style={{ marginTop: 8 }} />
      </ScrollView>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:         { flex: 1 },
  header:            { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle:       { fontSize: 28, letterSpacing: -0.5 },
  headerSubtitle:    { fontSize: 14, marginTop: 4, opacity: 0.7 },
  tabContainer:      { paddingHorizontal: 20, paddingVertical: 12 },
  tabWrapper:        { flexDirection: 'row', borderRadius: 12, padding: 4, height: 44 },
  tab:               { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, height: 36, gap: 6 },
  activeTab:         { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tabText:           { fontSize: 14 },
  scrollView:        { flex: 1 },
  scrollContent:     { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8, flexGrow: 1 },

  // Card
  card:              { borderRadius: 16, borderWidth: 1, marginBottom: 16, padding: 16 },
  cardHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  schemeImage:       { width: 40, height: 40, borderRadius: 12 },
  cardTitleContainer:{ flex: 1 },
  cardTitle:         { fontSize: 16, lineHeight: 22 },
  statusBadge:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 3, alignSelf: 'flex-start', gap: 4 },
  statusText:        { fontSize: 10, fontWeight: '600' },

  // Card body
  cardContent:       { marginTop: 12 },
  description:       { fontSize: 13, lineHeight: 19, marginBottom: 12, opacity: 0.75 },
  statsRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  statItem:          { flex: 1 },
  statLabel:         { fontSize: 11, marginBottom: 2 },
  statValue:         { fontSize: 14 },

  // Expandable
  expandableContent: { overflow: 'hidden' },
  expandedDetails:   { paddingTop: 4 },
  divider:           { height: 1, marginVertical: 10 },
  detailRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel:       { fontSize: 13 },
  detailValue:       { fontSize: 13 },

  // Progress
  progressContainer: { marginTop: 10 },
  progressHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel:     { fontSize: 12 },
  progressValue:     { fontSize: 12 },
  progressBar:       { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:      { height: '100%', borderRadius: 3 },

  // Footer
  cardFooter:        { marginTop: 16 },
  actionButton:      { flexDirection: 'row', paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionButtonText:  { fontSize: 14 },

  // Error / empty
  errorBox:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  errorText:         { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn:          { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  retryTxt:          { fontSize: 14 },
});
