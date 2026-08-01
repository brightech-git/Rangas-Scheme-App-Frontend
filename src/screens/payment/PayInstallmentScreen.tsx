// src/screens/payment/PayInstallmentScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   Hero shows WHICH instalment is being paid — "#7 of 12" — with a
//   segmented progress rail beneath it, so the member sees their
//   position in the scheme before the amount. The amount then sits on
//   paper as either a locked figure (fixed schemes) or a display-size
//   input with quick presets (flexible schemes). The pay control is a
//   pinned BottomActionBar showing the exact payable.
//
// WHY THIS IS BETTER UX
//   • The instalment number is the primary heading, which is the thing
//     most likely to be mis-paid; previously it was one row in a
//     six-row info card.
//   • The segmented rail makes "how many left" countable at a glance.
//   • The pay button is always visible with the live amount on it, so
//     it never scrolls away behind the keyboard on flexible schemes.
//   • Failure state is a sheet-style panel with the actual gateway
//     error surfaced, rather than a generic centred dialog.
//
// BUSINESS LOGIC — UNCHANGED
//   useRazorpay(status/verifyData/error/pay/reset), buildUserDetails,
//   buildInstallmentPayload, generateReceipt, accountService.insertEntry,
//   the success useEffect (toast + reset + navigate 'Main'),
//   RazorpayWebCheckout ref wiring, and every field of every payload
//   are byte-for-byte preserved from the previous implementation.
//   The unused SuccessModal (never rendered) was dropped as dead code.
//
// NEW UI COMPONENTS
//   ScreenCanvas, PageHeader, SummaryCard, PaymentTile,
//   BottomActionBar, ProgressWidget, SectionHeading, PremiumButton
// ─────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import RazorpayWebCheckout, {
  RazorpayWebCheckoutRef,
} from '../../components/ui/RazorpayWebCheckout';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useRazorpay } from '../../api/hooks/Razorpay/useRazorpay';
import {
  UserDetails,
  RazorpaySuccessPayment,
} from '../../types/Razorpay/Razorpay';
import { accountService } from '../../api/services/accountService';
import { AccountInsertData } from '../../types/Account/AccountInsert';
import { useToast } from '../../components/ui/Toast';

import {
  ScreenCanvas,
  PageHeader,
  SummaryCard,
  BottomActionBar,
  ProgressWidget,
  SectionHeading,
  PremiumButton,
  asText,
  money,
  prettyDate,
  type SummaryRow,
} from '../../components/ui/premium';

type RouteProps = RouteProp<RootStackParamList, 'PayInstallment'>;
type NavProps = NativeStackNavigationProp<RootStackParamList, 'PayInstallment'>;

// ── Helpers (unchanged) ──────────────────────────────────────────
function generateReceipt(
  groupCode: string,
  regNo: number,
  installment: number,
): string {
  return `rcpt_${groupCode}_${regNo}_ins${installment}_${Date.now()}`;
}

export default function PayInstallmentScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteProps>();
  const { ppData } = route.params;

  const { status, verifyData, error, pay, reset } = useRazorpay();
  const rzpWebRef = useRef<RazorpayWebCheckoutRef>(null);
  const toast = useToast();

  // ── Derive scheme info (unchanged) ────────────────────────────
  const scheme = ppData.schemeSummary;
  const schemeName = scheme?.schemeName ?? ppData.pName;
  const isFixed = scheme?.fixedIns === 'Y';
  const paid = parseInt(scheme?.schemaSummaryTransBalance?.insPaid ?? '0');
  const total = parseInt(scheme?.instalment ?? '0');
  const nextInstNum = paid + 1;
  const prevAmount = ppData.paymentHistoryList?.[0]?.amount ?? null;
  const defaultAmount = prevAmount ? Math.round(parseFloat(prevAmount)) : 0;

  const [customAmount, setCustomAmount] = useState('');
  const effectiveAmount = isFixed ? defaultAmount : parseInt(customAmount) || 0;

  const isReady = effectiveAmount > 0;
  const showFailed = status === 'failed';

  // ── Build userDetails payload for /verify_payment (unchanged) ──
  const buildUserDetails = (): UserDetails => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayDT = `${todayStr} 00:00:00`;
    const pi = ppData.personalInfo;

    return {
      newMember: {
        pName: ppData.pName || undefined,
        doorNo: pi?.doorNo || undefined,
        address1: pi?.address1 || undefined,
        address2: pi?.address2 || undefined,
        area: pi?.area || undefined,
        city: pi?.city || undefined,
        state: pi?.state || undefined,
        country: pi?.country || undefined,
        pinCode: pi?.pinCode || undefined,
        mobile: pi?.mobile || undefined,
        mobile2: pi?.mobile2 || undefined,
      },
      createSchemeSummary: {
        schemeId: scheme?.schemeId || undefined,
        groupCode: ppData.groupCode || undefined,
        regNo: String(ppData.regNo) || undefined,
        joinDate: ppData.joinDate || todayStr,
        updateTime: todayDT,
        totalIns: scheme?.instalment || undefined,
        costId: pi?.costId || undefined,
      },
      schemeCollectInsert: {
        groupCode: ppData.groupCode || undefined,
        regNo: String(ppData.regNo),
        rDate: todayDT,
        amount: String(effectiveAmount),
        modePay: 'ONLINE',
        installment: String(nextInstNum),
        SchemeId: scheme?.schemeId ? Number(scheme.schemeId) : undefined,
        chqBankCode: 'RAZORPAY',
        // chqCardNo filled by useRazorpay hook with razorpay_payment_id
      },
    };
  };

  // ── Build /api/v1/account/insert payload (unchanged) ──
  const buildInstallmentPayload = (
    payment: RazorpaySuccessPayment,
  ): AccountInsertData => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )}`;
    const hasWeightLedger = scheme?.weightLedger === 'Y';

    return {
      groupCode: ppData.groupCode || '',
      regNo: ppData.regNo || 0,
      rDate: today,
      amount: effectiveAmount,
      modePay: 4,
      accCode: '00001',
      updateTime: today,
      installment: nextInstNum,
      weight: hasWeightLedger ? parseFloat(scheme?.totalWeight || '0') : 0,
      sWeight: hasWeightLedger ? parseFloat(scheme?.lastWeight || '0') : 0,
      userID: 999,
      schemeId: scheme?.schemeId ? parseInt(scheme.schemeId) : 0,
      chqBankCode: 4,
      chqCardNo: payment.razorpay_payment_id, // paymentId
      chqBranch: 'Online',
      chkBank: 'Razorpay',
      chqRtnReason: payment.razorpay_order_id, // orderId
    };
  };

  const handlePay = () => {
    if (!isReady) return;

    const RECEIPT = generateReceipt(
      ppData.groupCode,
      ppData.regNo,
      nextInstNum,
    );

    pay(
      {
        // Send rupees — backend createOrder multiplies by 100 to get paise.
        AMOUNT: effectiveAmount,
        CURRENCY: 'INR',
        RECEIPT,
        SCHEMEID: scheme?.schemeId,
        GROUPCODE: ppData.groupCode,
        INSTALLMENTNUMBER: nextInstNum,
        REGNO: String(ppData.regNo),
      },
      {
        _checkoutFn: (opts: any) => rzpWebRef.current!.open(opts),
        name: 'Rangas DigiGold',
        description: `Instalment ${nextInstNum} – ${schemeName}`,
        image: 'https://scheme.rangasjewellery.com/logo.png',
        prefill: {
          name: ppData.pName,
          email: ppData.personalInfo?.mobile + '@Rangas.com',
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
        const ok =
          typeof result === 'string' && result.toLowerCase().includes('success');
        if (!ok) {
          throw new Error(
            typeof result === 'string' && result.trim()
              ? result
              : 'Installment could not be recorded. Please contact support.',
          );
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

  const handleFailedCancel = () => {
    reset();
    navigation.goBack();
  };

  const isProcessing = ['creating_order', 'checkout_open', 'verifying'].includes(
    status,
  );

  // ── Presentation-only derivations ──
  const presets = useMemo(() => {
    const base = defaultAmount > 0 ? defaultAmount : 1000;
    return Array.from(new Set([base, base * 2, base * 3, base * 5])).filter(
      (n) => n > 0,
    );
  }, [defaultAmount]);

  const schemeRows: SummaryRow[] = useMemo(
    () => [
      {
        label: 'Scheme code',
        value: scheme?.schemeSName ?? ppData.groupCode,
      },
      { label: 'Registration no.', value: String(ppData.regNo) },
      { label: 'Instalments paid', value: `${paid} of ${total}` },
      { label: 'Next due', value: prettyDate(ppData.nextDueDate) },
      { label: 'Maturity', value: prettyDate(ppData.maturityDate) },
      { label: 'Total invested', value: money(ppData.totalAmount) },
      {
        label: 'Total with bonus',
        value: money(ppData.totalAmountWithBonus),
        highlight: true,
      },
    ],
    [scheme, ppData, paid, total],
  );

  const payLabel = isProcessing
    ? status === 'creating_order'
      ? 'Creating order…'
      : status === 'checkout_open'
      ? 'Processing…'
      : 'Verifying…'
    : 'Pay via Razorpay';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenCanvas
        overlap={moderateScale(24)}
        paddingBottom={moderateScale(40)}
        header={
          <PageHeader
            eyebrow={schemeName}
            title={`Instalment #${nextInstNum}`}
            caption={total > 0 ? `of ${total} total` : undefined}
            bleedBottom={moderateScale(24)}
          >
            {total > 0 && (
              <ProgressWidget
                surface="hero"
                paid={paid}
                total={total}
                label="Scheme progress"
                note={
                  ppData.nextDueDate
                    ? `Due ${prettyDate(ppData.nextDueDate)}`
                    : undefined
                }
                style={{ marginTop: SIZES.margin.xxl }}
              />
            )}
          </PageHeader>
        }
        footer={
          <BottomActionBar
            label="Total payable"
            value={money(effectiveAmount)}
            note={`Instalment #${nextInstNum} · ${schemeName}`}
            actionLabel={payLabel}
            onAction={handlePay}
            loading={isProcessing}
            disabled={!isReady || isProcessing}
          />
        }
      >
        {/* ── Amount ── */}
        <View style={{ marginTop: SIZES.layout.sectionTight }}>
          <SectionHeading
            eyebrow={isFixed ? 'Fixed scheme' : 'Flexible scheme'}
            title="Amount"
            caption={
              isFixed
                ? 'Set from your first payment and cannot be changed'
                : 'Pay any amount for this instalment'
            }
          />

          {isFixed ? (
            <View
              style={[
                s.fixedBox,
                {
                  marginTop: SIZES.margin.lg,
                  borderRadius: SIZES.radius.panel,
                  borderColor: COLORS.hairline,
                  backgroundColor: COLORS.canvasElevated,
                  padding: SIZES.padding.xxl,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}
                >
                  Per instalment
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    asText(FONTS.displayLg),
                    { color: COLORS.inkPrimary, marginTop: 3 },
                  ]}
                >
                  {money(effectiveAmount)}
                </Text>
              </View>
              <View
                style={[
                  s.lockChip,
                  {
                    borderRadius: SIZES.radius.md,
                    backgroundColor: COLORS.canvasSunken,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={SIZES.icon.sm}
                  color={COLORS.inkTertiary}
                />
              </View>
            </View>
          ) : (
            <>
              {/* Display-size input */}
              <View
                style={[
                  s.inputBox,
                  {
                    marginTop: SIZES.margin.lg,
                    borderRadius: SIZES.radius.panel,
                    borderColor: customAmount
                      ? COLORS.primary
                      : COLORS.hairline,
                    borderWidth: customAmount ? 1.5 : 1,
                    backgroundColor: COLORS.canvasElevated,
                    paddingHorizontal: SIZES.padding.xxl,
                    paddingVertical: SIZES.padding.xl,
                  },
                ]}
              >
                <Text
                  style={[
                    asText(FONTS.displayLg),
                    { color: COLORS.inkTertiary },
                  ]}
                >
                  ₹
                </Text>
                <TextInput
                  value={customAmount}
                  onChangeText={(v) => setCustomAmount(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.inkMuted}
                  selectionColor={COLORS.primary}
                  style={[
                    asText(FONTS.displayLg),
                    { color: COLORS.inkPrimary, flex: 1, padding: 0 },
                  ]}
                />
              </View>

              {/* Presets */}
              <View style={[s.presetRow, { marginTop: SIZES.margin.md }]}>
                {presets.map((p) => {
                  const on = String(p) === customAmount;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setCustomAmount(String(p))}
                      style={({ pressed }) => [
                        s.preset,
                        {
                          borderRadius: SIZES.radius.pill,
                          borderColor: on ? COLORS.primary : COLORS.hairline,
                          borderWidth: on ? 1.5 : 1,
                          backgroundColor: COLORS.canvasElevated,
                          paddingVertical: SIZES.padding.sm,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          asText(FONTS.microBold),
                          { color: on ? COLORS.primary : COLORS.inkSecondary },
                        ]}
                      >
                        {money(p)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* ── Scheme record ── */}
        <View style={{ marginTop: SIZES.layout.section }}>
          <SectionHeading eyebrow="Your enrolment" title="Scheme record" />
          <SummaryCard
            rows={schemeRows}
            style={{ marginTop: SIZES.margin.lg }}
          />
        </View>

        {/* ── Payment summary ── */}
        {isReady && (
          <View style={{ marginTop: SIZES.layout.section }}>
            <SectionHeading eyebrow="Confirm" title="Payment summary" />
            <SummaryCard
              style={{ marginTop: SIZES.margin.lg }}
              rows={[
                { label: 'Scheme', value: schemeName },
                { label: 'Instalment no.', value: `#${nextInstNum}` },
                { label: 'Method', value: 'Razorpay · online' },
                {
                  label: 'Total payable',
                  value: money(effectiveAmount),
                  total: true,
                },
              ]}
            />
          </View>
        )}
      </ScreenCanvas>

      {/* ── Razorpay WebView checkout (unchanged) ── */}
      <RazorpayWebCheckout ref={rzpWebRef} />

      {/* ── Failure sheet ── */}
      <Modal visible={showFailed} transparent animationType="fade">
        <View
          style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]}
        >
          <View
            style={[
              s.sheet,
              {
                backgroundColor: COLORS.canvasElevated,
                borderTopLeftRadius: SIZES.radius.sheet,
                borderTopRightRadius: SIZES.radius.sheet,
                paddingHorizontal: SIZES.layout.gutter,
                paddingTop: SIZES.padding.xxl,
                paddingBottom: SIZES.padding.xxxl,
              },
            ]}
          >
            <View
              style={[s.grabber, { backgroundColor: COLORS.hairlineBold }]}
            />

            <View
              style={[
                s.failMark,
                {
                  borderRadius: SIZES.radius.tile,
                  backgroundColor: COLORS.errorBg,
                  marginTop: SIZES.margin.xl,
                },
              ]}
            >
              <Ionicons
                name="close"
                size={SIZES.icon.xl}
                color={COLORS.error}
              />
            </View>

            <Text
              style={[
                asText(FONTS.displaySm),
                { color: COLORS.inkPrimary, marginTop: SIZES.margin.xl },
              ]}
            >
              Payment failed
            </Text>
            <Text
              style={[
                asText(FONTS.micro),
                { color: COLORS.inkTertiary, marginTop: 6, lineHeight: 19 },
              ]}
            >
              {error ||
                'Something went wrong with your payment. No amount has been debited. Please try again.'}
            </Text>

            <View style={{ marginTop: SIZES.margin.xxl, gap: 10 }}>
              <PremiumButton
                label="Try again"
                onPress={() => {
                  reset();
                  handlePay();
                }}
              />
              <PremiumButton
                label="Cancel"
                variant="outline"
                onPress={handleFailedCancel}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  fixedBox: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  lockChip: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  presetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  preset: { flexGrow: 1, flexBasis: '22%', alignItems: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { width: '100%' },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  failMark: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
