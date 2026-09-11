import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { usePayment } from '../../api/hooks/Payment/usePayment';
import { InitiatePaymentRequest } from '../../types/Payment/Payment';
import { schemeMetrics } from '../../utils/schemeMetrics';
import { classifySchemeKind } from '../../utils/schemeKind';
import { ratesService } from '../../api/services/ratesService';
import { RatesResponse } from '../../types/Rates/Rates';

import {
  ScreenCanvas,
  PageHeader,
  SummaryCard,
  BottomActionBar,
  ProgressWidget,
  SectionHeading,
  asText,
  money,
  prettyDate,
  type SummaryRow,
} from '../../components/ui/premium';
import GoldAmountInput from '../../components/ui/appcomponents/GoldAmountInput';

type RouteProps = RouteProp<RootStackParamList, 'PayInstallment'>;
type NavProps  = NativeStackNavigationProp<RootStackParamList, 'PayInstallment'>;
type Mode = 'amount' | 'weight';

export default function PayInstallmentScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route      = useRoute<RouteProps>();
  const { ppData } = route.params;

  const { status, initiateData, statusData, error, initiate, checkStatus, reset } = usePayment();

  const scheme        = ppData.schemeSummary;
  const schemeName    = scheme?.schemeName ?? ppData.pName;

  // Payment shape: 'fixed' = locked monthly amount, 'lumpsum' = single
  // one-time payment, 'flexible' (DigiGold-style) = pay-anytime by
  // rupees or by gold weight. See utils/schemeKind.ts.
  const schemeKind    = classifySchemeKind(scheme?.fixedIns, scheme?.instalment, scheme?.weightLedger);
  const isFixed       = schemeKind === 'fixed';
  const isLumpsum     = schemeKind === 'lumpsum';
  const isMultiPay    = schemeKind === 'flexible';
  const paid          = parseInt(scheme?.schemaSummaryTransBalance?.insPaid ?? '0');
  const total         = isMultiPay ? 0 : parseInt(scheme?.instalment ?? '0');
  const nextInstNum   = paid + 1;
  const prevAmount    = ppData.paymentHistoryList?.[0]?.amount ?? null;
  const defaultAmount = prevAmount ? Math.round(parseFloat(prevAmount)) : 0;

  // ── Live rate → amount / weight entry (same conversion as Buy gold) ──
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    ratesService.getRates().then(setRates).catch(() => {}).finally(() => setRatesLoading(false));
  }, []);

  const goldRate = rates?.gold?.currentRate ?? 0;

  const [mode,  setMode]  = useState<Mode>('amount');
  const [input, setInput] = useState('');

  const { amount: enteredAmount, weight: enteredWeight } = useMemo(() => {
    const val = parseFloat(input.replace(/[^0-9.]/g, '')) || 0;
    if (mode === 'amount') return { amount: val, weight: goldRate > 0 ? val / goldRate : 0 };
    return { amount: val * goldRate, weight: val };
  }, [input, mode, goldRate]);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    if (m === 'weight') setInput(enteredWeight > 0 ? enteredWeight.toFixed(4) : '');
    else setInput(enteredAmount > 0 ? String(Math.round(enteredAmount)) : '');
    setMode(m);
  };

  const effectiveAmount = isFixed ? defaultAmount : Math.round(enteredAmount);
  const effectiveWeight = isFixed
    ? (goldRate > 0 ? defaultAmount / goldRate : 0)
    : enteredWeight;

  const mx          = schemeMetrics(ppData);
  const isReady     = effectiveAmount > 0;
  const isProcessing = status === 'initiating';
  const isVerifying  = status === 'pending';

  const buildPayload = (): InitiatePaymentRequest => {
    const pi  = ppData.personalInfo;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dt  = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    return {
      amount:         effectiveAmount,
      currency:       'INR',
      billingName:    ppData.pName || '',
      billingEmail:   (pi?.mobile ?? '') + '@rangas.com',
      billingTel:     pi?.mobile ?? '',
      billingAddress: pi?.address1 ?? '',
      billingCity:    pi?.city ?? '',
      billingState:   pi?.state ?? '',
      billingZip:     pi?.pinCode ?? '',
      billingCountry: 'India',
      regno:          ppData.regNo,
      groupcode:      ppData.groupCode,
      newJoin:        false,
      nmData:         null,
      schemeDetails: {
        schemeId:     scheme?.schemeId ? parseInt(scheme.schemeId) : 0,
        groupCode:    ppData.groupCode,
        regNo:        ppData.regNo,
        rDate:        dt,
        amount:       String(effectiveAmount),
        modePay:      'O',
        accCode:      '',
        updateTime:   dt,
        installment:  nextInstNum,
        userID:       '999',
        chqBankCode:  '',
        chqCardNo:    '',
        chqBranch:    '',
        chkBank:      '',
        chqRtnReason: '',
      },
    };
  };

  const handlePay = () => {
    if (!isReady) return;
    const payload = buildPayload();
    console.log('[PayInstallment] Initiate payload:', JSON.stringify(payload, null, 2));
    initiate(payload, (url, orderId) => {
      navigation.navigate('WebView', { url, title: 'Payment' });
    });
  };

  const statusRef      = React.useRef(status);
  const initiateRef    = React.useRef(initiateData);
  const statusDataRef   = React.useRef(statusData);
  statusRef.current     = status;
  initiateRef.current   = initiateData;
  statusDataRef.current = statusData;

  // Poll status once when returning from the CCAvenue WebView
  useFocusEffect(
    useCallback(() => {
      if (statusRef.current === 'pending' && initiateRef.current?.orderId) {
        console.log('[PayInstallment] Order status check payload:', { orderId: initiateRef.current.orderId });
        checkStatus(initiateRef.current.orderId).then((sd) => {
          if (sd) {
            reset();
            navigation.navigate('PaymentResult', { result: sd, context: 'installment' });
          }
        });
      }
    }, [])
  );

  useEffect(() => {
    if (status !== 'success') return;
    reset();
    navigation.navigate('Main');
  }, [status]);

  const paymentSummaryRows: SummaryRow[] = useMemo(() => [
    { label: 'Scheme',         value: schemeName },
    { label: 'Instalment no.', value: `#${nextInstNum}` },
    { label: 'Method',         value: 'Online payment' },
    ...(goldRate > 0 ? [{ label: 'Gold equivalent', value: `${effectiveWeight.toFixed(4)} g` }] : []),
    { label: 'Total payable',  value: money(effectiveAmount), total: true },
  ], [schemeName, nextInstNum, goldRate, effectiveWeight, effectiveAmount]);

  const breakdownRows: SummaryRow[] = useMemo(() => [
    { label: 'Live rate · 916 (22K)', value: `${money(goldRate)} / g` },
    { label: 'Amount entered',        value: money(effectiveAmount) },
    { label: 'Gold received',         value: `${effectiveWeight.toFixed(4)} g`, highlight: true },
    { label: 'Total payable',         value: money(effectiveAmount), total: true },
  ], [goldRate, effectiveAmount, effectiveWeight]);

  const presets = useMemo(() => {
    const base = defaultAmount > 0 ? defaultAmount : 1000;
    return Array.from(new Set([base, base * 2, base * 3, base * 5])).filter((n) => n > 0);
  }, [defaultAmount]);

  const schemeRows: SummaryRow[] = useMemo(() => [
    { label: 'Scheme code',       value: scheme?.schemeSName ?? ppData.groupCode },
    { label: 'Registration no.',  value: String(ppData.regNo) },
    ...(isMultiPay
      ? []
      : [{ label: 'Instalments paid', value: `${paid} of ${total}` }]),
    { label: 'Next due',          value: prettyDate(ppData.nextDueDate) },
    { label: 'Maturity',          value: prettyDate(ppData.maturityDate) },
    { label: 'Paid to date',      value: money(mx.invested) },
    { label: 'Total commitment',  value: mx.committed > 0 ? money(mx.committed) : '—' },
    {
      label:     'Still to pay after this',
      value:     mx.remaining > 0 ? money(Math.max(0, mx.remaining - effectiveAmount)) : '—',
      highlight: true,
    },
  ], [scheme, ppData, paid, total, isMultiPay, mx, effectiveAmount]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenCanvas
        overlap={moderateScale(24)}
        paddingBottom={moderateScale(40)}
        header={
          <PageHeader
            eyebrow={schemeName}
            title={isMultiPay ? 'Buy DigiGold' : `Instalment #${nextInstNum}`}
            caption={total > 0 ? `of ${total} total` : undefined}
            bleedBottom={moderateScale(24)}
          >
            {/* Live rate card — shown for all scheme types */}
            <View style={[s.rateCard, { marginTop: SIZES.margin.xxl, borderColor: COLORS.heroHairline, borderRadius: SIZES.radius.tile }]}>
              <View style={[s.rateCoin, { backgroundColor: COLORS.heroAccent }]}>
                <Ionicons name="star" size={SIZES.icon.sm} color={COLORS.heroTextPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary, fontSize: 10 }]}>
                  Gold rate · 916 (22K)
                </Text>
                <Text style={[asText(FONTS.displaySm), { color: COLORS.heroTextPrimary, marginTop: 2 }]}>
                  {ratesLoading && !rates ? 'Loading…' : goldRate > 0 ? `${money(goldRate)} / gram` : '—'}
                </Text>
              </View>
            </View>

            {isMultiPay ? (
              <View style={{ marginTop: SIZES.margin.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[asText(FONTS.eyebrow), { color: COLORS.heroTextTertiary }]}>Gold held</Text>
                  <Text style={[asText(FONTS.micro), { color: COLORS.heroTextMuted, fontSize: 10 }]}>
                    Flexible · buy anytime
                  </Text>
                </View>
                <Text style={[asText(FONTS.numeral), { color: COLORS.heroAccent, marginTop: 4 }]}>
                  {mx.weight > 0 ? `${mx.weight.toFixed(4)} g` : '0.0000 g'}
                </Text>
                <Text style={[asText(FONTS.micro), { color: COLORS.heroTextMuted, marginTop: 2, fontSize: 10 }]}>
                  {goldRate > 0 && mx.weight > 0
                    ? `≈ ${money(mx.weight * goldRate)} at today's rate`
                    : ppData.lastPaidDate
                    ? `Last bought ${prettyDate(ppData.lastPaidDate)}`
                    : 'No purchases yet'}
                </Text>
              </View>
            ) : (
              total > 0 && (
                <ProgressWidget
                  surface="hero"
                  paid={paid}
                  total={total}
                  label="Scheme progress"
                  note={ppData.nextDueDate ? `Due ${prettyDate(ppData.nextDueDate)}` : undefined}
                  style={{ marginTop: SIZES.margin.lg }}
                />
              )
            )}
          </PageHeader>
        }
        footer={
          <BottomActionBar
            label="Total payable"
            value={money(effectiveAmount)}
            note={`Instalment #${nextInstNum} · ${schemeName}`}
            actionLabel={isProcessing ? 'Processing…' : 'Pay Now'}
            onAction={handlePay}
            loading={isProcessing}
            disabled={!isReady || isProcessing}
          />
        }
      >
        {/* Amount */}
        <View style={{ marginTop: SIZES.layout.sectionTight }}>
          {/* <SectionHeading
            eyebrow={isFixed ? 'Fixed scheme' : isMultiPay ? 'Flexible scheme' : 'One-time payment'}
            title="Amount"
            caption={
              isFixed
                ? 'Set from your first payment and cannot be changed'
                : isMultiPay
                ? 'Pay any amount, any time — by rupees or by gold weight'
                : 'Enter the one-time amount you want to pay'
            }
          /> */}

          {isFixed ? (
            <View style={[s.fixedBox, { marginTop: SIZES.margin.lg, borderRadius: SIZES.radius.panel, borderColor: COLORS.hairline, backgroundColor: COLORS.canvasElevated, padding: SIZES.padding.xxl }]}>
              <View style={{ flex: 1 }}>
                <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}>Per instalment</Text>
                <Text numberOfLines={1} style={[asText(FONTS.displayLg), { color: COLORS.inkPrimary, marginTop: 3 }]}>{money(effectiveAmount)}</Text>
                <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, marginTop: 4, fontSize: 10 }]}>
                  {ratesLoading && !rates
                    ? 'Calculating gold equivalent…'
                    : goldRate > 0
                    ? `≈ ${effectiveWeight.toFixed(4)} g at ${money(goldRate)} / g`
                    : '—'}
                </Text>
              </View>
              <View style={[s.lockChip, { borderRadius: SIZES.radius.md, backgroundColor: COLORS.canvasSunken }]}>
                <Ionicons name="lock-closed" size={SIZES.icon.sm} color={COLORS.inkTertiary} />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: SIZES.margin.lg }}>
              <GoldAmountInput
                amountInput={mode === 'amount' ? input : (goldRate > 0 && enteredWeight > 0 ? String(Math.round(enteredWeight * goldRate)) : '')}
                weightInput={mode === 'weight' ? input : (goldRate > 0 && enteredAmount > 0 ? (enteredAmount / goldRate).toFixed(4) : '')}
                onAmountChange={(v) => { setMode('amount'); setInput(v.replace(/[^0-9.]/g, '')); }}
                onWeightChange={(v) => { setMode('weight'); setInput(v.replace(/[^0-9.]/g, '')); }}
                goldRate={goldRate}
                ratesLoading={ratesLoading}
                breakdownRows={isReady ? breakdownRows : undefined}
                presets={presets}
                onPresetPress={(p) => { setMode('amount'); setInput(String(p)); }}
              />
            </View>
          )}
        </View>

        {/* Scheme record */}
        <View style={{ marginTop: SIZES.layout.section }}>
          <SectionHeading eyebrow="Your enrolment" title="Scheme record" />
          <SummaryCard rows={schemeRows} style={{ marginTop: SIZES.margin.lg }} />
        </View>

        {/* Payment summary — only for fixed scheme */}
        {isFixed && isReady && (
          <View style={{ marginTop: SIZES.layout.section }}>
            <SectionHeading eyebrow="Confirm" title="Payment summary" />
            <SummaryCard style={{ marginTop: SIZES.margin.lg }} rows={paymentSummaryRows} />
          </View>
        )}
      </ScreenCanvas>
      {/* Verifying overlay — shown while checkStatus API call is in flight */}
      {isVerifying && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', gap: 12 }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[asText(FONTS.microBold), { color: COLORS.inkPrimary }]}>Verifying your payment…</Text>
          <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary }]}>Please wait, do not close the app</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  rateCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16 },
  rateCoin:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  fixedBox:  { borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  lockChip:  { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  overlay:   { flex: 1, justifyContent: 'flex-end' },
});
