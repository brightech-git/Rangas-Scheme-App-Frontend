import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from 'react-native';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { ratesService } from '../../api/services/ratesService';
import { RatesResponse } from '../../types/Rates/Rates';
import { useToast } from '../../components/ui/Toast';
import { usePayment } from '../../api/hooks/Payment/usePayment';
import { useMemberScheme } from '../../api/hooks/Member/useMemberScheme';
import { useAppSelector } from '../../store/hooks';
import { InitiatePaymentRequest } from '../../types/Payment/Payment';

import {
  ScreenCanvas,
  PageHeader,
  BottomActionBar,
  SummaryCard,
  SectionHeading,
  SkeletonBlock,
  PremiumButton,
  asText,
  money,
  type SummaryRow,
} from '../../components/ui/premium';
import GoldAmountInput from '../../components/ui/appcomponents/GoldAmountInput';

import EmpIdField from '../../components/ui/appcomponents/EmpIdField';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BuyGold'>;

const DIGI_GOLD_SCHEME_ID = 6;

export default function BuyGoldScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const scheme     = route.params?.scheme;

  const toast = useToast();
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  // ── Rates ──
  const [rates,   setRates]   = useState<RatesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    ratesService.getRates().then(setRates).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const goldRate = rates?.gold?.currentRate ?? 0;

  // ── Amount / weight inputs ──
  const [amountInput, setAmountInput] = useState('1000');
  const [weightInput, setWeightInput] = useState('');

  useEffect(() => {
    if (goldRate > 0) {
      const val = parseFloat(amountInput) || 0;
      setWeightInput(val > 0 ? (val / goldRate).toFixed(4) : '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goldRate]);

  const handleAmountChange = useCallback((v: string) => {
    const cleaned = v.replace(/[^0-9.]/g, '');
    setAmountInput(cleaned);
    if (goldRate > 0) {
      const val = parseFloat(cleaned) || 0;
      setWeightInput(val > 0 ? (val / goldRate).toFixed(4) : '');
    }
  }, [goldRate]);

  const handleWeightChange = useCallback((v: string) => {
    const cleaned = v.replace(/[^0-9.]/g, '');
    setWeightInput(cleaned);
    if (goldRate > 0) {
      const val = parseFloat(cleaned) || 0;
      setAmountInput(val > 0 ? String(Math.round(val * goldRate)) : '');
    }
  }, [goldRate]);

  const amount = parseFloat(amountInput) || 0;
  const weight = parseFloat(weightInput) || 0;

  // ── Member groups ──
  const { groups } = useMemberScheme(DIGI_GOLD_SCHEME_ID);

  // ── Payment ──
  const { status, initiateData, error, initiate, checkStatus, reset } = usePayment();
  const isProcessing = status === 'initiating';
  const isVerifying  = status === 'pending';

  const loginName   = user?.username      ?? '';
  const loginMobile = user?.contactNumber ?? '';
  const loginEmail  = user?.email         ?? '';

  // ── Emp ID — hidden, revealed by 3 taps on summary heading ──
  const [empId,   setEmpId]   = useState('999');
  const [empName, setEmpName] = useState('');
  const [showEmpId, setShowEmpId] = useState(false);
  const [summaryTapCount, setSummaryTapCount] = useState(0);

  const isReady = amount > 0 && (!(scheme?.COMMAMT) || amount >= scheme.COMMAMT);

  // ── Payload ──
  const buildPayload = (): InitiatePaymentRequest => {
    const group     = groups[0] ?? null;
    const groupCode = group?.GROUPCODE ?? '';
    const regNo     = group ? (group.REGNO ?? group.CURRENTREGNO ?? 1) : 1;
    const finalAmount = Math.round(amount);

    return {
      amount:         finalAmount,
      currency:       'INR',
      billingName:    loginName,
      billingEmail:   loginEmail,
      billingTel:     loginMobile,
      billingAddress: '',
      billingCity:    '',
      billingState:   '',
      billingZip:     '',
      billingCountry: 'India',
      regno:          Number(regNo),
      groupcode:      groupCode,
      newJoin:        true,
      schemeDetails:  null,
      nmData: {
        newMember: {
          pName:  loginName,
          mobile: loginMobile,
          userId: '9999',
          appVer: 'APP',
        } as any,
        createSchemeSummary: {
          schemeId:  DIGI_GOLD_SCHEME_ID,
          groupCode: groupCode,
          userId2:   '9999',
          iEmp:      empId.trim() || '999',
        } as any,
        schemeCollectInsert: {
          amount: finalAmount,
        } as any,
      },
    };
  };

  const handleBuy = () => {
    if (amount <= 0) {
      toast.info('Enter an amount', { message: 'Please enter how much gold to buy.' });
      return;
    }
    initiate(buildPayload(), (url) => {
      navigation.navigate('WebView', { url, title: 'Payment' });
    });
  };

  // ── Poll status on return from WebView ──
  const statusRef     = useRef(status);
  const initiateRef   = useRef(initiateData);
  statusRef.current   = status;
  initiateRef.current = initiateData;

  const orderIdRef = useRef<string | null>(null);
  if (initiateData?.orderId) orderIdRef.current = initiateData.orderId;

  const [isChecking, setIsChecking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (statusRef.current === 'pending' && orderIdRef.current) {
        setIsChecking(true);
        checkStatus(orderIdRef.current).then((sd) => {
          if (sd) {
            navigation.navigate('PaymentResult', { result: sd, context: 'buygold' });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          }
          reset();
        }).catch(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          reset();
        }).finally(() => setIsChecking(false));
      }
    }, [])
  );



  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenCanvas
        overlap={moderateScale(24)}
        paddingBottom={moderateScale(40)}
        header={
          <PageHeader
            eyebrow="Digital gold · 916"
            title="Buy gold"
            bleedBottom={moderateScale(24)}
            actions={[{ icon: 'refresh-outline', onPress: load }]}
          >
            <View style={[s.rateCard, { marginTop: SIZES.margin.xxl, borderColor: COLORS.heroHairline, borderRadius: SIZES.radius.tile }]}>
              <View style={[s.rateCoin, { backgroundColor: COLORS.heroAccent }]}>
                <Ionicons name="star" size={SIZES.icon.sm} color={COLORS.heroTextPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary, fontSize: 10 }]}>
                  Gold rate · 916 (22K)
                </Text>
                {loading && !rates ? (
                  <View style={{ marginTop: 4 }}>
                    <SkeletonBlock width={140} height={24} surface="hero" />
                  </View>
                ) : (
                  <Text style={[asText(FONTS.displaySm), { color: COLORS.heroTextPrimary, marginTop: 2 }]}>
                    {goldRate > 0 ? `${money(goldRate)} / gram` : '—'}
                  </Text>
                )}
              </View>
            </View>
          </PageHeader>
        }
        footer={
          <BottomActionBar
            label="Total payable"
            value={money(Math.round(amount))}
            note={`${weight.toFixed(4)} g of 916 gold`}
            actionLabel={isProcessing ? 'Processing…' : 'Buy gold'}
            actionVariant="gold"
            disabled={!isReady || isProcessing}
            loading={isProcessing}
            onAction={handleBuy}
          />
        }
      >
        <View style={{ marginTop: SIZES.margin.lg }}>
          <GoldAmountInput
            amountInput={amountInput}
            weightInput={weightInput}
            onAmountChange={handleAmountChange}
            onWeightChange={handleWeightChange}
            goldRate={goldRate}
            ratesLoading={loading}
            minAmount={scheme?.COMMAMT ? scheme.COMMAMT : undefined}
          />
        </View>

        {/* ── Summary ── */}
        <View style={{ marginTop: SIZES.layout.section }}>
          <Pressable onPress={() => {
            const next = summaryTapCount + 1;
            setSummaryTapCount(next);
            if (next >= 3) setShowEmpId(true);
          }}>
            <SectionHeading eyebrow="Review" title="Order summary" />
          </Pressable>

          {showEmpId && (
            <EmpIdField
              empId={empId}
              empName={empName}
              onSelect={(emp) => { setEmpId(emp.empId); setEmpName(emp.empName); }}
            />
          )}

          <SummaryCard
            style={{ marginTop: SIZES.margin.lg }}
            rows={(() => {
              const rows: SummaryRow[] = [];
              if (goldRate > 0) rows.push({ label: 'Gold rate', value: `${money(goldRate)} / g` });
              if (weight > 0)   rows.push({ label: 'Gold weight', value: `${weight.toFixed(4)} g` });
              // if (empId.trim()) rows.push({ label: 'Employee ID', value: empId.trim() });
              if (amount > 0)   rows.push({ label: 'Total payable', value: money(Math.round(amount)), total: true });
              return rows;
            })()}
          />
        </View>
      </ScreenCanvas>

      {/* Verifying overlay */}
      {(isVerifying || isChecking) && (
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
  rateCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16 },
  rateCoin: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  overlay:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
});
