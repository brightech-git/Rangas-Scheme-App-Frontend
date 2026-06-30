// src/screens/payment/PayInstallmentScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import RazorpayWebCheckout, { RazorpayWebCheckoutRef } from '../../components/ui/RazorpayWebCheckout';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useRazorpay } from '../../api/hooks/Razorpay/useRazorpay';
import { UserDetails, RazorpaySuccessPayment } from '../../types/Razorpay/Razorpay';
import { PPData } from '../../types/Account/PhoneDetails';
import { accountService } from '../../api/services/accountService';
import { AccountInsertData } from '../../types/Account/AccountInsert';
import { useToast } from '../../components/ui/Toast';
import SubPageHeader from '../../components/ui/SubPageHeader';

type RouteProps = RouteProp<RootStackParamList, 'PayInstallment'>;
type NavProps   = NativeStackNavigationProp<RootStackParamList, 'PayInstallment'>;

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(raw: string): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function generateReceipt(groupCode: string, regNo: number, installment: number): string {
  return `rcpt_${groupCode}_${regNo}_ins${installment}_${Date.now()}`;
}

// ── Info Row ──────────────────────────────────────────────────────
function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const { COLORS, FONTS } = useTheme();
  return (
    <View style={s.infoRow}>
      <Text style={[s.infoLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>{label}</Text>
      <Text style={[s.infoValue, { color: valueColor ?? COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{value}</Text>
    </View>
  );
}

// ── Success Modal ─────────────────────────────────────────────────
function SuccessModal({ visible, amount, schemeName, paymentId, onDone }: {
  visible:    boolean;
  amount:     number;
  schemeName: string;
  paymentId:  string;
  onDone:     () => void;
}) {
  const { COLORS, FONTS } = useTheme();
  const scale   = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 160 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.7);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={s.modalOverlay}>
        <Animated.View style={[s.modalCard, { backgroundColor: COLORS.background, transform: [{ scale }], opacity }]}>

          {/* Icon */}
          <View style={[s.modalIconWrap, { backgroundColor: COLORS.success + '18' }]}>
            <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
          </View>

          <Text style={[s.modalTitle, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
            Payment Successful!
          </Text>

          <Text style={[s.modalDesc, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
            Your installment for{'\n'}
            <Text style={{ color: COLORS.primary, fontFamily: FONTS.family.semiBold }}>{schemeName}</Text>
            {'\n'}has been paid successfully.
          </Text>

          {/* Amount chip */}
          <View style={[s.amountChip, { backgroundColor: COLORS.success + '12', borderColor: COLORS.success + '30' }]}>
            <Ionicons name="cash-outline" size={16} color={COLORS.success} />
            <Text style={[s.amountChipText, { color: COLORS.success, fontFamily: FONTS.family.bold }]}>
              ₹{amount.toLocaleString('en-IN')} paid
            </Text>
          </View>

          {/* Payment ID */}
          {paymentId ? (
            <Text style={[s.paymentId, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
              Payment ID: {paymentId}
            </Text>
          ) : null}

          <TouchableOpacity style={[s.modalBtn, { backgroundColor: COLORS.primary }]} onPress={onDone}>
            <Text style={[s.modalBtnText, { color: COLORS.white, fontFamily: FONTS.family.bold }]}>
              Back to My Schemes
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Failure Modal ─────────────────────────────────────────────────
function FailureModal({ visible, message, onRetry, onCancel }: {
  visible:  boolean;
  message:  string;
  onRetry:  () => void;
  onCancel: () => void;
}) {
  const { COLORS, FONTS } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.modalOverlay}>
        <View style={[s.modalCard, { backgroundColor: COLORS.background }]}>
          <View style={[s.modalIconWrap, { backgroundColor: '#E5393518' }]}>
            <Ionicons name="close-circle" size={72} color="#E53935" />
          </View>
          <Text style={[s.modalTitle, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
            Payment Failed
          </Text>
          <Text style={[s.modalDesc, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
            {message || 'Something went wrong with your payment. Please try again.'}
          </Text>
          <TouchableOpacity style={[s.modalBtn, { backgroundColor: COLORS.primary, marginBottom: 10 }]} onPress={onRetry}>
            <Text style={[s.modalBtnText, { color: COLORS.white, fontFamily: FONTS.family.bold }]}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.modalBtn, { backgroundColor: COLORS.borderLight }]} onPress={onCancel}>
            <Text style={[s.modalBtnText, { color: COLORS.textSecondary, fontFamily: FONTS.family.semiBold }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function PayInstallmentScreen() {
  const { COLORS, FONTS, SHADOWS, moderateScale } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route      = useRoute<RouteProps>();
  const { ppData } = route.params;

  const { status, verifyData, error, pay, reset } = useRazorpay();
  const rzpWebRef = useRef<RazorpayWebCheckoutRef>(null);
  const toast = useToast();

  // ── Derive scheme info ────────────────────────────────────────
  const scheme        = ppData.schemeSummary;
  const schemeName    = scheme?.schemeName ?? ppData.pName;
  const isFixed       = scheme?.fixedIns === 'Y';
  const paid          = parseInt(scheme?.schemaSummaryTransBalance?.insPaid ?? '0');
  const total         = parseInt(scheme?.instalment ?? '0');
  const nextInstNum   = paid + 1;
  const prevAmount    = ppData.paymentHistoryList?.[0]?.amount ?? null;
  const defaultAmount = prevAmount ? Math.round(parseFloat(prevAmount)) : 0;

  const [customAmount, setCustomAmount] = useState('');
  const effectiveAmount = isFixed ? defaultAmount : (parseInt(customAmount) || 0);

  const isReady = effectiveAmount > 0;

  // ── Status-based modal visibility ─────────────────────────────
  const showSuccess  = status === 'success';
  const showFailed   = status === 'failed';

  // ── Pay ───────────────────────────────────────────────────────
  // ── Build userDetails payload for /verify_payment ─────────────
  const buildUserDetails = (): UserDetails => {
    const today   = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayDT  = `${todayStr} 00:00:00`;
    const pi       = ppData.personalInfo;

    return {
      newMember: {
        pName:    ppData.pName     || undefined,
        doorNo:   pi?.doorNo      || undefined,
        address1: pi?.address1    || undefined,
        address2: pi?.address2    || undefined,
        area:     pi?.area        || undefined,
        city:     pi?.city        || undefined,
        state:    pi?.state       || undefined,
        country:  pi?.country     || undefined,
        pinCode:  pi?.pinCode     || undefined,
        mobile:   pi?.mobile      || undefined,
        mobile2:  pi?.mobile2     || undefined,
      },
      createSchemeSummary: {
        schemeId:   scheme?.schemeId      || undefined,
        groupCode:  ppData.groupCode      || undefined,
        regNo:      String(ppData.regNo)  || undefined,
        joinDate:   ppData.joinDate       || todayStr,
        updateTime: todayDT,
        totalIns:   scheme?.instalment    || undefined,
        costId:     pi?.costId            || undefined,
      },
      schemeCollectInsert: {
        groupCode:  ppData.groupCode      || undefined,
        regNo:      String(ppData.regNo),
        rDate:      todayDT,
        amount:     String(effectiveAmount),
        modePay:    'ONLINE',
        installment:String(nextInstNum),
        SchemeId:   scheme?.schemeId ? Number(scheme.schemeId) : undefined,
        chqBankCode:'RAZORPAY',
        // chqCardNo filled by useRazorpay hook with razorpay_payment_id
      },
    };
  };

  // ── Build /api/v1/account/insert payload for a further installment ──
  const buildInstallmentPayload = (payment: RazorpaySuccessPayment): AccountInsertData => {
    const now  = new Date();
    const pad  = (n: number) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const hasWeightLedger = scheme?.weightLedger === 'Y';

    return {
      groupCode:    ppData.groupCode || '',
      regNo:        ppData.regNo || 0,
      rDate:        today,
      amount:       effectiveAmount,
      modePay:      4,
      accCode:      '00001',
      updateTime:   today,
      installment:  nextInstNum,
      weight:       hasWeightLedger ? parseFloat(scheme?.totalWeight || '0') : 0,
      sWeight:      hasWeightLedger ? parseFloat(scheme?.lastWeight || '0')  : 0,
      userID:       999,
      schemeId:     scheme?.schemeId ? parseInt(scheme.schemeId) : 0,
      chqBankCode:  4,
      chqCardNo:    payment.razorpay_payment_id,   // paymentId
      chqBranch:    'Online',
      chkBank:      'Razorpay',
      chqRtnReason: payment.razorpay_order_id,      // orderId
    };
  };

  const handlePay = () => {
    if (!isReady) return;

    const RECEIPT = generateReceipt(ppData.groupCode, ppData.regNo, nextInstNum);

    pay(
      {
        // Send rupees — backend createOrder multiplies by 100 to get paise.
        AMOUNT:             effectiveAmount,
        CURRENCY:           'INR',
        RECEIPT,
        SCHEMEID:           scheme?.schemeId,
        GROUPCODE:          ppData.groupCode,
        INSTALLMENTNUMBER:  nextInstNum,
        REGNO:              String(ppData.regNo),
      },
      {
        _checkoutFn: (opts: any) => rzpWebRef.current!.open(opts),
        name:        'Rangas DigiGold',
        description: `Instalment ${nextInstNum} – ${schemeName}`,
        image:       'https://scheme.rangasjewellery.com/logo.png',
        prefill: {
          name:    ppData.pName,
          email:   ppData.personalInfo?.mobile + '@Rangas.com',
          contact: ppData.personalInfo?.mobile ?? '',
        },
        theme: { color: COLORS.primary },
      },
      buildUserDetails(),
      // After the payment is verified, record the installment via /api/v1/account/insert.
      async (payment) => {
        const payload = buildInstallmentPayload(payment);
        console.log('=== /api/v1/account/insert REQUEST BODY ===');
        console.log(JSON.stringify(payload, null, 2));
        console.log('===========================================');
        const result = await accountService.insertEntry(payload);
        // Backend returns the plain string "Success" or an error/validation message.
        const ok = typeof result === 'string' && result.toLowerCase().includes('success');
        if (!ok) {
          throw new Error(typeof result === 'string' && result.trim()
            ? result
            : 'Installment could not be recorded. Please contact support.');
        }
      },
    );
  };

  // On payment success: redirect straight to Home and show an auto-dismissing
  // popup there (no button needed).
  useEffect(() => {
    if (status !== 'success') return;
    toast.success('Payment Successful 🎉', {
      message: `Instalment #${nextInstNum} for ${schemeName} is paid.`,
      position: 'top',
      duration: 4000,
      closable: false,
    });
    reset();
    navigation.navigate('Main');
  }, [status]);

  const handleSuccessDone = () => {
    reset();
    navigation.navigate('Main');
  };

  const handleFailedCancel = () => {
    reset();
    navigation.goBack();
  };

  const isProcessing = ['creating_order', 'checkout_open', 'verifying'].includes(status);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>

      {/* Header */}
      <SubPageHeader title="Pay Installment" subtitle={schemeName} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Scheme Summary Card ── */}
        <View style={[s.card, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight, ...SHADOWS.sm }]}>
          <View style={[s.cardIconWrap, { backgroundColor: COLORS.primary + '12' }]}>
            <Ionicons name="diamond-outline" size={22} color={COLORS.primary} />
          </View>
          <Text style={[s.cardTitle, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
            {schemeName}
          </Text>
          <Text style={[s.cardSub, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
            Scheme Code: {scheme?.schemeSName ?? ppData.groupCode}  ·  Reg No: {ppData.regNo}
          </Text>

          <View style={[s.divider, { backgroundColor: COLORS.borderLight }]} />

          <InfoRow label="Instalments Paid"   value={`${paid} / ${total}`} />
          <InfoRow label="Next Instalment No." value={`# ${nextInstNum}`} valueColor={COLORS.primary} />
          <InfoRow label="Maturity Date"       value={formatDate(ppData.maturityDate)} />
          <InfoRow label="Next Due Date"       value={formatDate(ppData.nextDueDate)} valueColor={COLORS.warning} />
          <InfoRow label="Total Invested"      value={`₹${ppData.totalAmount.toLocaleString('en-IN')}`} />
          <InfoRow label="Total with Bonus"    value={`₹${ppData.totalAmountWithBonus.toLocaleString('en-IN')}`} valueColor={COLORS.success} />
        </View>

        {/* ── Amount Section ── */}
        <View style={[s.card, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight, ...SHADOWS.sm }]}>
          <Text style={[s.sectionTitle, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
            {isFixed ? 'Installment Amount' : 'Enter Installment Amount'}
          </Text>
          <Text style={[s.sectionSub, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
            {isFixed
              ? 'This is a fixed instalment scheme. The amount is set from your first payment.'
              : 'This is a flexible instalment scheme. Enter any amount for this instalment.'}
          </Text>

          {isFixed ? (
            /* Fixed amount display */
            <View style={[s.fixedAmountBox, { backgroundColor: COLORS.primary + '08', borderColor: COLORS.primary + '30' }]}>
              <Ionicons name="cash-outline" size={22} color={COLORS.primary} />
              <View>
                <Text style={[s.fixedAmountValue, { color: COLORS.primary, fontFamily: FONTS.family.bold }]}>
                  ₹{effectiveAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={[s.fixedAmountLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                  per instalment
                </Text>
              </View>
            </View>
          ) : (
            /* Flexible amount input */
            <View>
              <Text style={[s.inputLabel, { color: COLORS.textSecondary, fontFamily: FONTS.family.medium }]}>
                Amount (₹) *
              </Text>
              <View style={[s.inputBox, { borderColor: customAmount ? COLORS.primary : COLORS.borderLight, backgroundColor: customAmount ? COLORS.primary + '05' : COLORS.white }]}>
                <Text style={[s.inputPrefix, { color: COLORS.textSecondary, fontFamily: FONTS.family.semiBold }]}>₹</Text>
                <TextInput
                  style={[s.input, { color: COLORS.textPrimary, fontFamily: FONTS.family.regular }]}
                  placeholder="Enter amount"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={(v) => setCustomAmount(v.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>
          )}
        </View>

        {/* ── Payment Summary ── */}
        {isReady && (
          <View style={[s.card, { backgroundColor: COLORS.primary + '06', borderColor: COLORS.primary + '20', ...SHADOWS.sm }]}>
            <Text style={[s.sectionTitle, { color: COLORS.primary, fontFamily: FONTS.family.bold }]}>
              Payment Summary
            </Text>

            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>Scheme</Text>
              <Text style={[s.summaryValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]} numberOfLines={1}>
                {schemeName}
              </Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>Instalment No.</Text>
              <Text style={[s.summaryValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>#{nextInstNum}</Text>
            </View>
            <View style={[s.divider, { backgroundColor: COLORS.primary + '20', marginVertical: 10 }]} />
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: COLORS.primary, fontFamily: FONTS.family.bold, fontSize: 15 }]}>Total Payable</Text>
              <Text style={[s.summaryValue, { color: COLORS.primary, fontFamily: FONTS.family.bold, fontSize: 18 }]}>
                ₹{effectiveAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Fixed Footer Button ── */}
      <View style={[s.footer, { backgroundColor: COLORS.background, borderTopColor: COLORS.borderLight, paddingBottom: Platform.OS === 'ios' ? 8 : 20 }]}>
        <TouchableOpacity
          style={[
            s.payBtn,
            {
              backgroundColor: isReady && !isProcessing ? COLORS.primary : COLORS.borderLight,
              ...(isReady && !isProcessing ? SHADOWS.md : {}),
            },
          ]}
          onPress={handlePay}
          disabled={!isReady || isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={[s.payBtnText, { color: COLORS.white, fontFamily: FONTS.family.bold }]}>
                {status === 'creating_order' ? 'Creating Order…'
                  : status === 'checkout_open' ? 'Processing…'
                  : 'Verifying…'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="card-outline"
                size={20}
                color={isReady ? COLORS.white : COLORS.textTertiary}
              />
              <Text style={[s.payBtnText, { color: isReady ? COLORS.white : COLORS.textTertiary, fontFamily: FONTS.family.bold }]}>
                Pay ₹{effectiveAmount > 0 ? effectiveAmount.toLocaleString('en-IN') : '—'} via Razorpay
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Razorpay WebView checkout ── */}
      <RazorpayWebCheckout ref={rzpWebRef} />

      {/* ── Modals ── */}
      <FailureModal
        visible={showFailed}
        message={error ?? ''}
        onRetry={() => { reset(); handlePay(); }}
        onCancel={handleFailedCancel}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:         { width: 40, alignItems: 'center' },
  headerCenter:    { flex: 1, alignItems: 'center' },
  headerTitle:     { fontSize: 18, letterSpacing: -0.3 },
  headerSub:       { fontSize: 12, marginTop: 2, opacity: 0.7 },
  scrollContent:   { padding: 16, gap: 16 },

  card:            { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardIconWrap:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardTitle:       { fontSize: 16, marginBottom: 4 },
  cardSub:         { fontSize: 12, opacity: 0.7, marginBottom: 14 },

  divider:         { height: 1, marginVertical: 12 },
  infoRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel:       { fontSize: 13 },
  infoValue:       { fontSize: 13 },

  sectionTitle:    { fontSize: 16, marginBottom: 4 },
  sectionSub:      { fontSize: 12, lineHeight: 18, opacity: 0.7, marginBottom: 16 },

  fixedAmountBox:  { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 14 },
  fixedAmountValue:{ fontSize: 26 },
  fixedAmountLabel:{ fontSize: 12, marginTop: 2 },

  inputLabel:      { fontSize: 13, marginBottom: 6 },
  inputBox:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, height: 52 },
  inputPrefix:     { fontSize: 20, marginRight: 6 },
  input:           { flex: 1, fontSize: 18, height: '100%' },

  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  summaryLabel:    { fontSize: 13 },
  summaryValue:    { fontSize: 14, flex: 1, textAlign: 'right', marginLeft: 12 },

  footer:          { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  payBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
  payBtnText:      { fontSize: 16 },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard:       { width: '100%', borderRadius: 24, padding: 28, alignItems: 'center' },
  modalIconWrap:   { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalTitle:      { fontSize: 22, marginBottom: 10 },
  modalDesc:       { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  amountChip:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  amountChipText:  { fontSize: 16 },
  paymentId:       { fontSize: 11, opacity: 0.6, marginBottom: 24, textAlign: 'center' },
  modalBtn:        { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnText:    { fontSize: 16 },
});
