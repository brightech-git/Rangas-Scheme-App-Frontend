// src/components/ui/GlassSchemeCard.tsx
//
// Frosted-glass / "blur mirror" card for a member's joined scheme.
// Base colour follows the app header gradient. Full-width (use inside a slider).
// Two actions: "Pay" (opens Pay Installment) and "Installments" (opens a modal
// listing the paid installment history).

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { PPData, PaymentHistory } from '../../types/Account/PhoneDetails';

const { width: SCREEN_W } = Dimensions.get('window');
type NavProps = NativeStackNavigationProp<RootStackParamList>;

// Full width minus the home container padding (16 each side)
export const GLASS_CARD_WIDTH = SCREEN_W - 32;

const STATUS_CLR: Record<string, string> = {
  active:    '#34D399',
  pending:   '#FBBF24',
  completed: '#F5D78E',
};

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

export default function GlassSchemeCard({ item, width }: { item: PPData; index?: number; width?: number }) {
  const { COLORS, FONTS } = useTheme();
  const navigation = useNavigation<NavProps>();
  const [showHistory, setShowHistory] = useState(false);

  // Header gradient colours (fallback to brand brown)
  const hg: string[] = (COLORS as any)?.gradient?.orangeDeep ?? ['#5C3F10', '#7B5E2A'];
  const deep = (COLORS as any)?.orangeDeep ?? '#3E2A05';
  const gradColors: [string, string, string] = [hg[1] ?? '#7B5E2A', hg[0] ?? '#5C3F10', deep];

  const paid    = parseInt(item.schemeSummary?.schemaSummaryTransBalance?.insPaid ?? '0');
  const total   = parseInt(item.schemeSummary?.instalment ?? '1');
  const pct     = total > 0 ? Math.min(paid / total, 1) : 0;
  const status  = schemeStatus(item);
  const done    = status === 'completed';
  const history = item.paymentHistoryList ?? [];

  return (
    <View style={[glass.shadowWrap, width ? { width } : null]}>
      <View style={glass.card}>
        {/* 1) Header-colour gradient base */}
        <LinearGradient
          colors={gradColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 2) Light "reflection" blobs for the mirror feel */}
        <View style={[glass.blob, glass.blobTop]} />
        <View style={[glass.blob, glass.blobBottom]} />

        {/* 3) Frosted glass blur */}
        <BlurView intensity={26} tint="light" style={StyleSheet.absoluteFill} />

        {/* 4) Glass sheet + light border */}
        <View style={glass.sheet} />
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* 5) Content */}
        <View style={glass.content}>
          <View style={glass.topRow}>
            <View style={glass.iconWrap}>
              <Ionicons name="diamond-outline" size={18} color="#fff" />
            </View>
            <View style={[glass.badge, { backgroundColor: STATUS_CLR[status] + 'E6' }]}>
              <Text style={[glass.badgeTxt, { fontFamily: FONTS.family.bold }]}>
                {status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[glass.title, { fontFamily: FONTS.family.bold }]} numberOfLines={1}>
            {item.schemeSummary?.schemeName ?? item.pName}
          </Text>
          <Text style={[glass.regNo, { fontFamily: FONTS.family.regular }]} numberOfLines={1}>
            Reg No: {item.regNo}
          </Text>

          <View style={glass.statsRow}>
            <View style={{ flex: 1 }}>
              <Text style={[glass.val, { fontFamily: FONTS.family.bold }]}>
                ₹{item.totalAmount.toLocaleString('en-IN')}
              </Text>
              <Text style={[glass.lbl, { fontFamily: FONTS.family.regular }]}>Invested</Text>
            </View>
            <View style={glass.div} />
            <View style={{ flex: 1 }}>
              <Text style={[glass.val, { fontFamily: FONTS.family.bold }]}>
                ₹{item.totalAmountWithBonus.toLocaleString('en-IN')}
              </Text>
              <Text style={[glass.lbl, { fontFamily: FONTS.family.regular }]}>With Bonus</Text>
            </View>
            <View style={glass.div} />
            <View style={{ flex: 1 }}>
              <Text style={[glass.val, { fontFamily: FONTS.family.bold }]}>{paid}/{total}</Text>
              <Text style={[glass.lbl, { fontFamily: FONTS.family.regular }]}>EMIs</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={glass.track}>
            <View style={[glass.fill, { width: `${Math.min(pct * 100, 100)}%` as any }]} />
          </View>
          <View style={glass.metaRow}>
            <Text style={[glass.next, { fontFamily: FONTS.family.regular }]} numberOfLines={1}>
              {done ? 'Scheme completed' : `Next: ${formatDate(item.nextDueDate ?? '')}`}
            </Text>
            <Text style={[glass.pct, { fontFamily: FONTS.family.semiBold }]}>{Math.round(pct * 100)}%</Text>
          </View>

          {/* Actions: View Installments + Pay */}
          <View style={glass.actionRow}>
            <TouchableOpacity
              style={[glass.btn, glass.btnGhost]}
              activeOpacity={0.85}
              onPress={() => setShowHistory(true)}
            >
              <Ionicons name="receipt-outline" size={15} color="#fff" />
              <Text style={[glass.btnGhostTxt, { fontFamily: FONTS.family.semiBold }]}>
                Installments
              </Text>
            </TouchableOpacity>

            {!done && (
              <TouchableOpacity
                style={[glass.btn, glass.btnSolid]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('PayInstallment', { ppData: item })}
              >
                <Ionicons name="card-outline" size={15} color={deep} />
                <Text style={[glass.btnSolidTxt, { color: deep, fontFamily: FONTS.family.bold }]}>
                  Pay
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Paid installments modal ── */}
      <Modal visible={showHistory} transparent animationType="fade" onRequestClose={() => setShowHistory(false)}>
        <View style={glass.modalOverlay}>
          <View style={[glass.modalCard, { backgroundColor: COLORS.background }]}>
            <View style={[glass.modalHeader, { borderBottomColor: COLORS.borderLight }]}>
              <View>
                <Text style={[glass.modalTitle, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
                  Paid Installments
                </Text>
                <Text style={[glass.modalSub, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                  {item.schemeSummary?.schemeName ?? item.pName} · {paid}/{total} paid
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {history.length === 0 ? (
              <View style={glass.emptyBox}>
                <Ionicons name="receipt-outline" size={32} color={COLORS.textTertiary} />
                <Text style={[glass.emptyTxt, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                  No installments paid yet.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {history.map((h: PaymentHistory, i: number) => (
                  <View
                    key={`${h.receiptNo}-${i}`}
                    style={[glass.histRow, { borderBottomColor: COLORS.borderLight }]}
                  >
                    <View style={[glass.histNo, { backgroundColor: COLORS.primary + '15' }]}>
                      <Text style={[glass.histNoTxt, { color: COLORS.primary, fontFamily: FONTS.family.bold }]}>
                        #{h.installment || (i + 1)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[glass.histAmt, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                        ₹{Math.round(parseFloat(h.amount || '0')).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[glass.histMeta, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                        {formatDate(h.updateTime)}{h.receiptNo ? `  ·  Rcpt: ${h.receiptNo}` : ''}
                      </Text>
                    </View>
                    {h.chqBank ? (
                      <Text style={[glass.histMode, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                        {h.chqBank}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[glass.modalClose, { backgroundColor: COLORS.primary }]}
              onPress={() => setShowHistory(false)}
            >
              <Text style={[glass.modalCloseTxt, { color: COLORS.white, fontFamily: FONTS.family.bold }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const RADIUS = 22;

const glass = StyleSheet.create({
  shadowWrap: {
    width: GLASS_CARD_WIDTH,
    borderRadius: RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  card: { borderRadius: RADIUS, overflow: 'hidden', minHeight: 210 },
  sheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
  },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' },
  blobTop:    { width: 170, height: 170, top: -60, right: -40 },
  blobBottom: { width: 130, height: 130, bottom: -50, left: -35, backgroundColor: 'rgba(255,255,255,0.12)' },

  content: { padding: 18 },
  topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconWrap:{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  badge:   { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  badgeTxt:{ color: '#1A1303', fontSize: 9, letterSpacing: 0.4 },

  title:   { color: '#fff', fontSize: 17, letterSpacing: -0.2 },
  regNo:   { color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 2, marginBottom: 14 },

  statsRow:{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  val:     { color: '#fff', fontSize: 14 },
  lbl:     { color: 'rgba(255,255,255,0.72)', fontSize: 10, marginTop: 2 },
  div:     { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.28)', marginHorizontal: 8 },

  track:   { height: 5, backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  fill:    { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  next:    { color: 'rgba(255,255,255,0.85)', fontSize: 11, flex: 1, marginRight: 8 },
  pct:     { color: '#fff', fontSize: 11 },

  actionRow:  { flexDirection: 'row', gap: 10 },
  btn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
  btnGhost:   { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.40)' },
  btnGhostTxt:{ color: '#fff', fontSize: 13 },
  btnSolid:   { backgroundColor: '#fff' },
  btnSolidTxt:{ fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard:    { borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, borderBottomWidth: 1, marginBottom: 8 },
  modalTitle:   { fontSize: 17 },
  modalSub:     { fontSize: 12, marginTop: 3 },
  emptyBox:     { alignItems: 'center', paddingVertical: 36, gap: 10 },
  emptyTxt:     { fontSize: 13 },
  histRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  histNo:       { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  histNoTxt:    { fontSize: 13 },
  histAmt:      { fontSize: 15 },
  histMeta:     { fontSize: 11, marginTop: 2 },
  histMode:     { fontSize: 11 },
  modalClose:   { marginTop: 14, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalCloseTxt:{ fontSize: 15 },
});
