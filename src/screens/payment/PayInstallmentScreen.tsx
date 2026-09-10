import React, { useState, useEffect, useMemo } from 'react';
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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { usePayment } from '../../api/hooks/Payment/usePayment';
import { InitiatePaymentRequest } from '../../types/Payment/Payment';
import { useToast } from '../../components/ui/Toast';
import { schemeMetrics } from '../../utils/schemeMetrics';

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
type NavProps  = NativeStackNavigationProp<RootStackParamList, 'PayInstallment'>;

export default function PayInstallmentScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route      = useRoute<RouteProps>();
  const { ppData } = route.params;

  const { status, initiateData, error, initiate, checkStatus, reset } = usePayment();
  const toast = useToast();

  const scheme        = ppData.schemeSummary;
  const schemeName    = scheme?.schemeName ?? ppData.pName;
  const isFixed       = scheme?.fixedIns === 'Y';
  const paid          = parseInt(scheme?.schemaSummaryTransBalance?.insPaid ?? '0');
  const total         = parseInt(scheme?.instalment ?? '0');
  const nextInstNum   = paid + 1;
  const prevAmount    = ppData.paymentHistoryList?.[0]?.amount ?? null;
  const defaultAmount = prevAmount ? Math.round(parseFloat(prevAmount)) : 0;

  const [customAmount, setCustomAmount] = useState('');
  const effectiveAmount = isFixed ? defaultAmount : parseInt(customAmount) || 0;

  const mx          = schemeMetrics(ppData);
  const isReady     = effectiveAmount > 0;
  const isProcessing = status === 'initiating';
  const showFailed  = status === 'failed';

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
        userID:       '9999',
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
    initiate(buildPayload(), (url, orderId) => {
      navigation.navigate('WebView', { url, title: 'Payment' });
    });
  };

  const statusRef      = React.useRef(status);
  const initiateRef    = React.useRef(initiateData);
  statusRef.current    = status;
  initiateRef.current  = initiateData;

  // Poll status once when returning from the CCAvenue WebView
  useFocusEffect(
    useCallback(() => {
      if (statusRef.current === 'pending' && initiateRef.current?.orderId) {
        checkStatus(initiateRef.current.orderId);
      }
    }, [])
  );

  useEffect(() => {
    if (status !== 'success') return;
    toast.success('Payment Successful 🎉', {
      message:  `Instalment #${nextInstNum} for ${schemeName} is paid.`,
      position: 'top',
      duration: 4000,
      closable: false,
    });
    reset();
    navigation.navigate('Main');
  }, [status]);

  const presets = useMemo(() => {
    const base = defaultAmount > 0 ? defaultAmount : 1000;
    return Array.from(new Set([base, base * 2, base * 3, base * 5])).filter((n) => n > 0);
  }, [defaultAmount]);

  const schemeRows: SummaryRow[] = useMemo(() => [
    { label: 'Scheme code',       value: scheme?.schemeSName ?? ppData.groupCode },
    { label: 'Registration no.',  value: String(ppData.regNo) },
    { label: 'Instalments paid',  value: `${paid} of ${total}` },
    { label: 'Next due',          value: prettyDate(ppData.nextDueDate) },
    { label: 'Maturity',          value: prettyDate(ppData.maturityDate) },
    { label: 'Paid to date',      value: money(mx.invested) },
    { label: 'Total commitment',  value: mx.committed > 0 ? money(mx.committed) : '—' },
    {
      label:     'Still to pay after this',
      value:     mx.remaining > 0 ? money(Math.max(0, mx.remaining - effectiveAmount)) : '—',
      highlight: true,
    },
  ], [scheme, ppData, paid, total]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                note={ppData.nextDueDate ? `Due ${prettyDate(ppData.nextDueDate)}` : undefined}
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
            actionLabel={isProcessing ? 'Processing…' : 'Pay Now'}
            onAction={handlePay}
            loading={isProcessing}
            disabled={!isReady || isProcessing}
          />
        }
      >
        {/* Amount */}
        <View style={{ marginTop: SIZES.layout.sectionTight }}>
          <SectionHeading
            eyebrow={isFixed ? 'Fixed scheme' : 'Flexible scheme'}
            title="Amount"
            caption={isFixed ? 'Set from your first payment and cannot be changed' : 'Pay any amount for this instalment'}
          />

          {isFixed ? (
            <View style={[s.fixedBox, { marginTop: SIZES.margin.lg, borderRadius: SIZES.radius.panel, borderColor: COLORS.hairline, backgroundColor: COLORS.canvasElevated, padding: SIZES.padding.xxl }]}>
              <View style={{ flex: 1 }}>
                <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}>Per instalment</Text>
                <Text numberOfLines={1} style={[asText(FONTS.displayLg), { color: COLORS.inkPrimary, marginTop: 3 }]}>{money(effectiveAmount)}</Text>
              </View>
              <View style={[s.lockChip, { borderRadius: SIZES.radius.md, backgroundColor: COLORS.canvasSunken }]}>
                <Ionicons name="lock-closed" size={SIZES.icon.sm} color={COLORS.inkTertiary} />
              </View>
            </View>
          ) : (
            <>
              <View style={[s.inputBox, { marginTop: SIZES.margin.lg, borderRadius: SIZES.radius.panel, borderColor: customAmount ? COLORS.primary : COLORS.hairline, borderWidth: customAmount ? 1.5 : 1, backgroundColor: COLORS.canvasElevated, paddingHorizontal: SIZES.padding.xxl, paddingVertical: SIZES.padding.xl }]}>
                <Text style={[asText(FONTS.displayLg), { color: COLORS.inkTertiary }]}>₹</Text>
                <TextInput
                  value={customAmount}
                  onChangeText={(v) => setCustomAmount(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.inkMuted}
                  selectionColor={COLORS.primary}
                  style={[asText(FONTS.displayLg), { color: COLORS.inkPrimary, flex: 1, padding: 0 }]}
                />
              </View>
              <View style={[s.presetRow, { marginTop: SIZES.margin.md }]}>
                {presets.map((p) => {
                  const on = String(p) === customAmount;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setCustomAmount(String(p))}
                      style={({ pressed }) => [s.preset, { borderRadius: SIZES.radius.pill, borderColor: on ? COLORS.primary : COLORS.hairline, borderWidth: on ? 1.5 : 1, backgroundColor: COLORS.canvasElevated, paddingVertical: SIZES.padding.sm, opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Text style={[asText(FONTS.microBold), { color: on ? COLORS.primary : COLORS.inkSecondary }]}>{money(p)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Scheme record */}
        <View style={{ marginTop: SIZES.layout.section }}>
          <SectionHeading eyebrow="Your enrolment" title="Scheme record" />
          <SummaryCard rows={schemeRows} style={{ marginTop: SIZES.margin.lg }} />
        </View>

        {/* Payment summary */}
        {isReady && (
          <View style={{ marginTop: SIZES.layout.section }}>
            <SectionHeading eyebrow="Confirm" title="Payment summary" />
            <SummaryCard
              style={{ marginTop: SIZES.margin.lg }}
              rows={[
                { label: 'Scheme',         value: schemeName },
                { label: 'Instalment no.', value: `#${nextInstNum}` },
                { label: 'Method',         value: 'Online payment' },
                { label: 'Total payable',  value: money(effectiveAmount), total: true },
              ]}
            />
          </View>
        )}
      </ScreenCanvas>

      {/* Failure sheet */}
      <Modal visible={showFailed} transparent animationType="fade">
        <View style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]}>
          <View style={[s.sheet, { backgroundColor: COLORS.canvasElevated, borderTopLeftRadius: SIZES.radius.sheet, borderTopRightRadius: SIZES.radius.sheet, paddingHorizontal: SIZES.layout.gutter, paddingTop: SIZES.padding.xxl, paddingBottom: SIZES.padding.xxxl }]}>
            <View style={[s.grabber, { backgroundColor: COLORS.hairlineBold }]} />
            <View style={[s.failMark, { borderRadius: SIZES.radius.tile, backgroundColor: COLORS.errorBg, marginTop: SIZES.margin.xl }]}>
              <Ionicons name="close" size={SIZES.icon.xl} color={COLORS.error} />
            </View>
            <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary, marginTop: SIZES.margin.xl }]}>Payment failed</Text>
            <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, marginTop: 6, lineHeight: 19 }]}>
              {error || 'Something went wrong. No amount has been debited. Please try again.'}
            </Text>
            <View style={{ marginTop: SIZES.margin.xxl, gap: 10 }}>
              <PremiumButton label="Try again" onPress={() => { reset(); handlePay(); }} />
              <PremiumButton label="Cancel" variant="outline" onPress={() => { reset(); navigation.goBack(); }} />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  fixedBox:  { borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  lockChip:  { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  inputBox:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  presetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  preset:    { flexGrow: 1, flexBasis: '22%', alignItems: 'center' },
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  sheet:     { width: '100%' },
  grabber:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  failMark:  { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
