// src/screens/PaymentReceipt/PaymentReceipt.tsx

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { PaymentHistory } from '../../types/Account/PhoneDetails';
import { useCompanies } from '../../api/hooks/Company/useCompanies';
import { downloadPaymentReceipt } from '../../utils/PaymentReceiptPDF';
import AppHeader from '../../components/ui/appcomponents/AppHeader';

type RouteProps = RouteProp<RootStackParamList, 'PaymentReceipt'>;

function formatDate(raw?: string | null): string {
  if (!raw || raw.startsWith('1900-01-01')) return 'N/A';
  const iso = raw.includes(' ') ? raw.replace(' ', 'T').replace(/\.\d+$/, '') : raw;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function currency(v: string | number | null | undefined): string {
  const n = parseFloat(String(v ?? 0)) || 0;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function paymentMode(p: PaymentHistory): { label: string; icon: keyof typeof Ionicons.glyphMap } {
  const bank = (p.chqBank ?? '').toLowerCase();
  if (bank.includes('razorpay') || (p.chq_CardNo ?? '').startsWith('pay_')) {
    return { label: 'Online Payment', icon: 'phone-portrait-outline' };
  }
  if (bank) return { label: p.chqBank, icon: 'business-outline' };
  return { label: 'Cash', icon: 'cash-outline' };
}

export default function PaymentReceipt() {
  const { COLORS, FONTS, SHADOWS } = useTheme();
  const route = useRoute<RouteProps>();
  const { ppData, payment } = route.params;
  const { companies } = useCompanies();
  const company = companies[0];
  const [downloading, setDownloading] = useState(false);

  const method = paymentMode(payment);
  const weight = parseFloat(String(payment.weight ?? '0')) || 0;
  const groupRegNo = `${ppData.groupCode ?? 'N/A'}-${ppData.regNo ?? 'N/A'}`;
  const pi = ppData.personalInfo;
  const userAddrLine1 = [pi?.doorNo, pi?.area].filter(Boolean).join(', ');
  const userAddrLine2 = [pi?.city, pi?.state, pi?.pinCode].filter(Boolean).join(', ');
  const hasPaymentMode =
    (payment.chqBank && payment.chqBank !== 'N/A') ||
    (payment.chq_CardNo && payment.chq_CardNo !== 'N/A');

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    await downloadPaymentReceipt({ ppData, payment }, company);
    setDownloading(false);
  };

  return (
    <SafeAreaView style={[st.flex, { backgroundColor: COLORS.background }]} edges={['bottom']}>
      <AppHeader
        title="Payment Receipt"
        subtitle={`Receipt No: ${payment.receiptNo}`}
        showBack
        rightComponent={
          <TouchableOpacity
            onPress={handleDownload}
            disabled={downloading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {downloading
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Ionicons name="download-outline" size={21} color={COLORS.white} />}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[st.card, { backgroundColor: COLORS.surface, borderColor: COLORS.border, ...SHADOWS.sm }]}>

          {/* Company header */}
          <View style={st.companyRow}>
            <Image source={require('../../assets/company/logo.png')} style={st.logo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[st.companyName, { color: COLORS.primaryDark, fontFamily: FONTS.family.bold }]} numberOfLines={1}>
                {company?.COMPANYNAME?.trim() || 'Rangas DigiGold'}
              </Text>
              {!!company?.PHONE && (
                <Text style={[st.companyMeta, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]} numberOfLines={1}>
                  {company.PHONE}
                </Text>
              )}
            </View>
            <View style={[st.statusPill, { backgroundColor: COLORS.success + '22' }]}>
              <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
              <Text style={[st.statusPillTxt, { color: COLORS.success, fontFamily: FONTS.family.semiBold }]}>PAID</Text>
            </View>
          </View>

          {(company?.EMAIL || company?.ADDRESS1 || company?.ADDRESS2 || company?.ADDRESS3 || company?.ADDRESS4) && (
            <View style={[st.contactBox, { backgroundColor: COLORS.primaryPale }]}>
              {!!company?.EMAIL && (
                <Text style={[st.contactTxt, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
                  ✉ {company.EMAIL}
                </Text>
              )}
              {!!company?.ADDRESS1 && (
                <Text style={[st.contactTxt, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]} numberOfLines={1}>
                  📍 {[company.ADDRESS1, company.ADDRESS2].filter(Boolean).join(', ')}
                </Text>
              )}
              {!!(company?.ADDRESS3 || company?.ADDRESS4) && (
                <Text style={[st.contactTxt, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]} numberOfLines={1}>
                  📍 {[company.ADDRESS3, company.ADDRESS4].filter(Boolean).join(', ')}
                </Text>
              )}
            </View>
          )}

          <View style={[st.divider, { backgroundColor: COLORS.primary }]} />

          <Text style={[st.title, { color: COLORS.primaryDark, fontFamily: FONTS.family.bold }]}>PAYMENT RECEIPT</Text>

          {/* Scheme + date */}
          <View style={[st.infoBox, { backgroundColor: COLORS.gray100, borderLeftColor: COLORS.primary }]}>
            <View style={{ flex: 1 }}>
              <Text style={[st.lbl, { color: COLORS.textTertiary, fontFamily: FONTS.family.semiBold }]}>SCHEME NAME</Text>
              <Text style={[st.val, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]} numberOfLines={1}>
                {ppData.schemeSummary?.schemeName?.trim() || 'Scheme'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.lbl, { color: COLORS.textTertiary, fontFamily: FONTS.family.semiBold }]}>TRANSACTION DATE</Text>
              <Text style={[st.val, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
                {formatDate(payment.updateTime)}
              </Text>
            </View>
          </View>

          {/* Receipt to */}
          <Text style={[st.sectionTitle, { color: COLORS.primaryDark, fontFamily: FONTS.family.bold }]}>RECEIPT TO</Text>
          <View style={[st.customerBox, { borderColor: COLORS.border, backgroundColor: COLORS.gray100 }]}>
            <View style={st.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[st.custLbl, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Name</Text>
                <Text style={[st.custVal, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]} numberOfLines={1}>
                  {ppData.personalInfo?.pName ?? ppData.pName}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.custLbl, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Receipt No</Text>
                <Text style={[st.custVal, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                  {payment.receiptNo}
                </Text>
              </View>
            </View>
            <View style={st.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[st.custLbl, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Mobile</Text>
                <Text style={[st.custVal, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                  {pi?.mobile ?? 'N/A'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.custLbl, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Group Code - Reg No</Text>
                <Text style={[st.custVal, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                  {groupRegNo}
                </Text>
              </View>
            </View>
            {!!(userAddrLine1 || userAddrLine2) && (
              <View style={{ marginTop: 2 }}>
                <Text style={[st.custLbl, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Address</Text>
                {!!userAddrLine1 && (
                  <Text style={[st.custVal, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                    {userAddrLine1}
                  </Text>
                )}
                {!!userAddrLine2 && (
                  <Text style={[st.custVal, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                    {userAddrLine2}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Payment table */}
          <View style={[st.table, { borderColor: COLORS.border }]}>
            <View style={[st.tableHeader, { backgroundColor: COLORS.primary }]}>
              <Text style={[st.th, { flex: 0.5 }]}>S.No</Text>
              <Text style={[st.th, { flex: 1.8 }]}>Group-Reg No</Text>
              <Text style={[st.th, { flex: 1 }]}>Installment</Text>
              {weight > 0 && <Text style={[st.th, { flex: 1 }]}>Weight</Text>}
              <Text style={[st.th, { flex: 1.2 }]}>Amount</Text>
            </View>
            <View style={[st.tableRow, { borderTopColor: COLORS.border }]}>
              <Text style={[st.td, { flex: 0.5, color: COLORS.textPrimary }]}>1</Text>
              <Text style={[st.td, { flex: 1.8, color: COLORS.textPrimary }]}>{groupRegNo}</Text>
              <Text style={[st.td, { flex: 1, color: COLORS.textPrimary }]}>#{payment.installment}</Text>
              {weight > 0 && <Text style={[st.td, { flex: 1, color: COLORS.textPrimary }]}>{weight.toFixed(3)}</Text>}
              <Text style={[st.td, { flex: 1.2, color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
                {currency(payment.amount)}
              </Text>
            </View>
          </View>

          {/* Total */}
          <View style={[st.totalBox, { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primaryLight + '55' }]}>
            <Text style={[st.totalLbl, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>Total Amount Paid</Text>
            <Text style={[st.totalVal, { color: COLORS.primaryDark, fontFamily: FONTS.family.bold }]}>
              {currency(payment.amount)}
            </Text>
          </View>

          {/* Payment mode */}
          {hasPaymentMode && (
            <View style={[st.paymodeBox, { backgroundColor: COLORS.gray100 }]}>
              <View style={st.paymodeTitleRow}>
                <Ionicons name={method.icon} size={13} color={COLORS.primary} />
                <Text style={[st.paymodeTitle, { color: COLORS.primaryDark, fontFamily: FONTS.family.bold }]}>Payment Details</Text>
              </View>
              {!!payment.chqBank && payment.chqBank !== 'N/A' && (
                <View style={st.pmRow}>
                  <Text style={[st.pmK, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Mode</Text>
                  <Text style={[st.pmV, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{payment.chqBank}</Text>
                </View>
              )}
              {!!payment.chqBranch && payment.chqBranch !== 'N/A' && (
                <View style={st.pmRow}>
                  <Text style={[st.pmK, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Branch</Text>
                  <Text style={[st.pmV, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{payment.chqBranch}</Text>
                </View>
              )}
              {!!payment.chq_CardNo && payment.chq_CardNo !== 'N/A' && (
                <View style={st.pmRow}>
                  <Text style={[st.pmK, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Ref No</Text>
                  <Text style={[st.pmV, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]} numberOfLines={1}>{payment.chq_CardNo}</Text>
                </View>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={[st.footer, { borderTopColor: COLORS.border }]}>
            <Text style={[st.footerTxt, { color: COLORS.textSecondary, fontFamily: FONTS.family.semiBold }]}>
              Thank you for being our valued customer
            </Text>
            <Text style={[st.footerSub, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
              This is a computer generated receipt
            </Text>
          </View>
        </View>

        {/* Download CTA */}
        <TouchableOpacity
          style={[st.downloadBtn, { backgroundColor: COLORS.primary, opacity: downloading ? 0.7 : 1 }]}
          activeOpacity={0.9}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Ionicons name="download-outline" size={16} color={COLORS.white} />}
          <Text style={[st.downloadBtnTxt, { color: COLORS.white, fontFamily: FONTS.family.bold }]}>
            {downloading ? 'Preparing…' : 'Download Receipt (PDF)'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },

  card: { borderRadius: 18, borderWidth: 1, padding: 18 },

  companyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logo: { width: 48, height: 48, borderRadius: 24, marginRight: 10 },
  companyName: { fontSize: 16 },
  companyMeta: { fontSize: 11, marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 },
  statusPillTxt: { fontSize: 10, letterSpacing: 0.4 },

  contactBox: { borderRadius: 10, padding: 10, marginBottom: 14 },
  contactTxt: { fontSize: 11, lineHeight: 17 },

  divider: { height: 2, borderRadius: 1, marginBottom: 16 },
  title: { fontSize: 17, textAlign: 'center', letterSpacing: 1, marginBottom: 16 },

  infoBox: {
    flexDirection: 'row', gap: 12, borderRadius: 10, borderLeftWidth: 4,
    padding: 12, marginBottom: 16,
  },
  lbl: { fontSize: 9.5, letterSpacing: 0.4, marginBottom: 3 },
  val: { fontSize: 13 },

  sectionTitle: { fontSize: 11.5, letterSpacing: 0.4, marginBottom: 8 },
  customerBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  row2: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  custLbl: { fontSize: 10.5, marginBottom: 3 },
  custVal: { fontSize: 12.5 },

  table: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8 },
  th: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1 },
  td: { fontSize: 12, textAlign: 'center' },

  totalBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16,
  },
  totalLbl: { fontSize: 13.5 },
  totalVal: { fontSize: 18 },

  paymodeBox: { borderRadius: 10, padding: 12, marginBottom: 16 },
  paymodeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  paymodeTitle: { fontSize: 11.5 },
  pmRow: { flexDirection: 'row', marginBottom: 4 },
  pmK: { width: 66, fontSize: 11 },
  pmV: { flex: 1, fontSize: 11.5 },

  footer: { borderTopWidth: 1, paddingTop: 14, alignItems: 'center' },
  footerTxt: { fontSize: 12, marginBottom: 4 },
  footerSub: { fontSize: 10, fontStyle: 'italic' },

  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14, marginTop: 16,
  },
  downloadBtnTxt: { fontSize: 14 },
});
