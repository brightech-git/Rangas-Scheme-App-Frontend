import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { METAL_LABEL } from '../../types/Scheme/Scheme';
import { usePayment } from '../../api/hooks/Payment/usePayment';
import { InitiatePaymentRequest } from '../../types/Payment/Payment';
import { useMemberScheme } from '../../api/hooks/Member/useMemberScheme';
import { MemberSchemeGroup } from '../../types/Member/MemberScheme';
import { useToast } from '../../components/ui/Toast';
import { useAppSelector } from '../../store/hooks';
import { classifySchemeKind } from '../../utils/schemeKind';
import { ratesService } from '../../api/services/ratesService';
import EmpIdField from '../../components/ui/appcomponents/EmpIdField';
import { RatesResponse } from '../../types/Rates/Rates';

import {
  ScreenCanvas,
  PageHeader,
  PaymentTile,
  SummaryCard,
  BottomActionBar,
  SectionHeading,
  PremiumButton,
  StatusChip,
  SkeletonBlock,
  FormField,
  asText,
  money,
  type SummaryRow,
} from '../../components/ui/premium';

type RouteProps = RouteProp<RootStackParamList, 'SchemeJoin'>;
type NavProps = NativeStackNavigationProp<RootStackParamList, 'SchemeJoin'>;

const DRAFT_KEY = (schemeId: number) => `SCHEME_JOIN_DRAFT_${schemeId}`;

export default function SchemeJoinScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteProps>();
  const { scheme } = route.params;

  const { status, initiateData, error, initiate, checkStatus, reset } = usePayment();
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);

  const { groups, loading: groupsLoading } = useMemberScheme(scheme.SchemeId);

  const mLabel = METAL_LABEL[scheme.MetalType] ?? scheme.MetalType;

  const schemeKind = classifySchemeKind(scheme.FixedIns, scheme.Instalment, scheme.WeightLedger);
  const isFixed    = schemeKind === 'fixed';
  const isLumpsum  = schemeKind === 'lumpsum';
  const isFlexible = schemeKind === 'flexible';

  const [selectedGroup, setSelectedGroup] = useState<MemberSchemeGroup | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showAmountModal, setShowAmountModal] = useState(false);

  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [mode, setMode] = useState<'amount' | 'weight'>('amount');
  const [flexInput, setFlexInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const clearErr = (key: string) =>
    setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; });

  useEffect(() => {
    if (!isFlexible) return;
    ratesService.getRates().then(setRates).catch(() => {}).finally(() => setRatesLoading(false));
  }, [isFlexible]);

  const goldRate = rates?.gold?.currentRate ?? 0;

  const { amount: flexAmount, weight: flexWeight } = useMemo(() => {
    const val = parseFloat(flexInput.replace(/[^0-9.]/g, '')) || 0;
    if (mode === 'amount') return { amount: val, weight: goldRate > 0 ? val / goldRate : 0 };
    return { amount: val * goldRate, weight: val };
  }, [flexInput, mode, goldRate]);

  const switchMode = (m: 'amount' | 'weight') => {
    if (m === mode) return;
    if (m === 'weight') setFlexInput(flexWeight > 0 ? flexWeight.toFixed(4) : '');
    else setFlexInput(flexAmount > 0 ? String(Math.round(flexAmount)) : '');
    setMode(m);
  };

  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) setSelectedGroup(groups[0]);
  }, [groups]);

  const effectiveAmount = isFixed
    ? selectedGroup?.AMOUNT ?? 0
    : isFlexible
    ? Math.round(flexAmount)
    : parseInt(customAmount) || 0;

  const loginName   = user?.username      ?? '';
  const loginMobile = user?.contactNumber ?? '';
  const loginEmail  = user?.email         ?? '';

  const [customerName, setCustomerName] = useState(loginName);
  useEffect(() => {
    if (loginName) setCustomerName((prev) => (prev ? prev : loginName));
  }, [loginName]);

  const isProcessing = status === 'initiating';
  const showFailed   = status === 'failed';
  const showSuccess  = status === 'success';

  const buildPayload = (): InitiatePaymentRequest => {
    const activeGroup = isFixed ? selectedGroup : (groups[0] ?? null);
    const groupCode   = activeGroup?.GROUPCODE ?? '';
    const regNo       = activeGroup ? (activeGroup.REGNO ?? activeGroup.CURRENTREGNO ?? 1) : 1;

    return {
      amount:         effectiveAmount,
      currency:       'INR',
      billingName:    customerName.trim() || loginName,
      billingEmail:   loginEmail,
      billingTel:     loginMobile,
      billingAddress: '',
      billingCity:    '',
      billingState:   '',
      billingZip:     '',
      billingCountry: 'India',
      groupcode:      groupCode,
      newJoin:        true,
      schemeDetails:  null,
      nmData: {
        newMember: {
          pName:  customerName.trim() || loginName,
          mobile: loginMobile,
          userId: '999',
          appVer: 'Web',
        } as any,
        createSchemeSummary: {
          schemeId:  scheme.SchemeId,
          groupCode: groupCode,
          userId2:   '999',
          iEmp:      empId.trim() || '999',
        } as any,
        schemeCollectInsert: {
          amount: effectiveAmount,
        } as any,
      },
    };
  };

  const scrollRef  = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  const handleSubmit = () => {
    const fe: Record<string, string> = {};
    if (!customerName.trim())      fe.name   = 'Enter your name';
    if (effectiveAmount <= 0)      fe.amount = 'Select or enter amount';
    if (isFixed && !selectedGroup) fe.group  = 'Select a group';

    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) {
      toast.error('Please check the form', { position: 'top', duration: 3500 });
      return;
    }

    initiate(buildPayload(), (url) => {
      navigation.navigate('WebView', { url, title: 'Payment' });
    });
  };

  const statusRef     = React.useRef(status);
  const initiateRef   = React.useRef(initiateData);
  statusRef.current   = status;
  initiateRef.current = initiateData;

  const orderIdRef = React.useRef<string | null>(null);
  if (initiateData?.orderId) orderIdRef.current = initiateData.orderId;

  const [isChecking, setIsChecking] = useState(false);
  const [empId, setEmpId] = useState('999');
  const [empName, setEmpName] = useState('');
  const [showEmpId, setShowEmpId] = useState(false);
  const [summaryTapCount, setSummaryTapCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (statusRef.current === 'pending' && orderIdRef.current) {
        setIsChecking(true);
        checkStatus(orderIdRef.current).then((sd) => {
          if (sd) {
            AsyncStorage.removeItem(DRAFT_KEY(scheme.SchemeId));
            navigation.navigate('PaymentResult', { result: sd, context: 'join' });
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

  useEffect(() => {
    if (status !== 'success') return;
    AsyncStorage.removeItem(DRAFT_KEY(scheme.SchemeId));
  }, [status]);

  const submitLabel = isProcessing ? 'Processing…' : 'Confirm & pay';
  const G = SIZES.layout.gutter;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScreenCanvas
        overlap={moderateScale(24)}
        paddingBottom={moderateScale(40)}
        scrollProps={{ ref: scrollRef } as any}
        header={
          <PageHeader
            eyebrow="Enrolment"
            title="Join scheme"
            caption={
              isLumpsum
                ? `${scheme.schemeName} · One-time payment · ${mLabel}`
                : isFlexible
                ? `${scheme.schemeName} · Pay anytime · ${mLabel}`
                : `${scheme.schemeName} · ${scheme.Instalment} instalments · ${mLabel}`
            }
            bleedBottom={moderateScale(24)}
          >
            <StatusChip
              surface="hero"
              tone="success"
              icon="checkmark-circle"
              label="Terms accepted"
              style={{ marginTop: SIZES.margin.lg }}
            />
          </PageHeader>
        }
        footer={
          <BottomActionBar
            label={isLumpsum ? 'One-time payment' : isFlexible ? 'Paying now' : 'Monthly instalment'}
            value={effectiveAmount > 0 ? money(effectiveAmount) : '—'}
            note={
              isLumpsum
                ? mLabel
                : isFlexible
                ? `≈ ${flexWeight.toFixed(4)} g · ${mLabel}`
                : `${scheme.Instalment} instalments · ${mLabel}`
            }
            actionLabel={submitLabel}
            onAction={handleSubmit}
            loading={isProcessing}
            disabled={isProcessing}
          />
        }
      >
        <View ref={contentRef} collapsable={false}>
          {/* ═══ YOUR DETAILS ═══ */}
          <View style={{ marginTop: SIZES.layout.sectionTight }}>
            <SectionHeading
              eyebrow="Step 1"
              title="Your details"
              caption="We've filled this in from your profile — change it if needed"
            />
            <View style={{ marginTop: SIZES.margin.lg }}>
              <FormField
                label="Full name"
                indicator="required"
                icon="person-outline"
                value={customerName}
                placeholder="Enter your name"
                autoCapitalize="words"
                onChangeText={(v) => { setCustomerName(v); clearErr('name'); }}
                error={fieldErrors.name}
              />
            </View>
          </View>

          {/* ═══ PLAN ═══ */}
          <View style={{ marginTop: SIZES.layout.section }}>
            <SectionHeading
              eyebrow="Step 2"
              title="Choose your plan"
              caption={
                isFixed
                  ? 'Pick a monthly instalment from the available groups'
                  : isLumpsum
                  ? 'Enter the one-time amount you want to pay'
                  : 'Pay any amount, any time — by rupees or by gold weight'
              }
            />

            <View style={{ marginTop: SIZES.margin.lg, gap: 10 }}>
              {isFixed ? (
                groupsLoading ? (
                  <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary }]}>
                    Loading available amounts…
                  </Text>
                ) : groups.length === 0 ? (
                  <StatusChip tone="warning" icon="alert-circle-outline" label="No instalment groups available" />
                ) : (
                  <Pressable
                    onPress={() => setShowAmountModal(true)}
                    style={({ pressed }) => ([{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: SIZES.padding.lg,
                      paddingHorizontal: SIZES.padding.lg,
                      borderRadius: SIZES.radius.tile,
                      borderWidth: 1,
                      borderColor: fieldErrors.group ? COLORS.error : selectedGroup ? COLORS.primary : COLORS.hairline,
                      backgroundColor: COLORS.canvasElevated,
                      opacity: pressed ? 0.7 : 1,
                    }])}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="cash-outline" size={SIZES.icon.md} color={selectedGroup ? COLORS.primary : COLORS.inkTertiary} />
                      <View>
                        <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}>Monthly instalment</Text>
                        <Text style={[asText(FONTS.microBold), { color: selectedGroup ? COLORS.inkPrimary : COLORS.inkMuted, marginTop: 2 }]}>
                          {selectedGroup ? `${money(selectedGroup.AMOUNT)} / month` : 'Tap to select amount'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-down" size={SIZES.icon.sm} color={COLORS.inkMuted} />
                  </Pressable>
                )
              ) : isFlexible ? (
                <>
                  <View style={[s.flexRail, { borderColor: COLORS.hairline, borderRadius: SIZES.radius.tile }]}>
                    {(['amount', 'weight'] as const).map((m, i) => {
                      const on = m === mode;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => switchMode(m)}
                          style={({ pressed }) => [
                            s.flexRailItem,
                            {
                              paddingVertical: SIZES.padding.md,
                              borderLeftWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                              borderLeftColor: COLORS.hairline,
                              opacity: pressed ? 0.6 : 1,
                            },
                          ]}
                        >
                          <Text style={[asText(FONTS.microBold), { color: on ? COLORS.primary : COLORS.inkTertiary }]}>
                            {m === 'amount' ? 'By amount' : 'By weight'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View
                    style={[
                      s.flexInputBox,
                      {
                        borderRadius: SIZES.radius.panel,
                        borderColor: flexInput ? COLORS.primary : COLORS.hairline,
                        borderWidth: flexInput ? 1.5 : 1,
                        backgroundColor: COLORS.canvasElevated,
                        paddingHorizontal: SIZES.padding.xl,
                        paddingVertical: SIZES.padding.lg,
                      },
                    ]}
                  >
                    {mode === 'amount' && (
                      <Text style={[asText(FONTS.displaySm), { color: COLORS.inkTertiary }]}>₹</Text>
                    )}
                    <TextInput
                      value={flexInput}
                      onChangeText={(v) => { setFlexInput(v.replace(/[^0-9.]/g, '')); clearErr('amount'); }}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={COLORS.inkMuted}
                      selectionColor={COLORS.primary}
                      style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary, flex: 1, padding: 0 }]}
                    />
                    {mode === 'weight' && (
                      <Text style={[asText(FONTS.displaySm), { color: COLORS.inkTertiary }]}>g</Text>
                    )}
                  </View>

                  {ratesLoading && !rates ? (
                    <SkeletonBlock width="60%" height={14} />
                  ) : (
                    <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary }]}>
                      {mode === 'amount'
                        ? `You get ${flexWeight.toFixed(4)} g`
                        : `You pay ${money(Math.round(flexAmount))}`}
                      {goldRate > 0 ? ` · at ${money(goldRate)} / g` : ''}
                    </Text>
                  )}

                  {!!fieldErrors.amount && (
                    <StatusChip tone="danger" icon="alert-circle" label={fieldErrors.amount} />
                  )}
                </>
              ) : (
                <FormField
                  label="One-time amount (₹)"
                  indicator="required"
                  icon="cash-outline"
                  value={customAmount}
                  placeholder="e.g. 1500"
                  keyboardType="numeric"
                  onChangeText={(v) => { setCustomAmount(v.replace(/[^0-9]/g, '')); clearErr('amount'); }}
                  error={fieldErrors.amount}
                  hint="Paid once — no recurring instalments after this"
                />
              )}

              {isFixed && !!fieldErrors.group && (
                <StatusChip tone="danger" icon="alert-circle" label={fieldErrors.group} />
              )}
            </View>
          </View>

          {/* ── Summary ── */}
          <View style={{ marginTop: SIZES.layout.section }}>
            <Pressable onPress={() => {
                const next = summaryTapCount + 1;
                setSummaryTapCount(next);
                if (next >= 3) setShowEmpId(true);
              }}>
              <SectionHeading eyebrow="Review" title="Enrolment summary" />
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
                if (scheme.schemeName) rows.push({ label: 'Scheme', value: scheme.schemeName });
                if (mLabel) rows.push({ label: 'Metal', value: mLabel });
                rows.push({ label: 'Plan type', value: isFixed ? 'Fixed' : isLumpsum ? 'One-time' : 'Flexible' });
                if (!isLumpsum && scheme.Instalment) rows.push({ label: 'Instalments', value: String(scheme.Instalment) });
                if (isFixed && selectedGroup) rows.push({ label: 'Group', value: String(selectedGroup.GROUPCODE) });
                if (isFlexible && goldRate > 0 && flexWeight > 0) rows.push({ label: 'Gold equivalent', value: `${flexWeight.toFixed(4)} g` });
                // if (empId.trim()) rows.push({ label: 'Employee ID', value: empId.trim() });
                if (effectiveAmount > 0) rows.push({
                  label: isLumpsum ? 'Paying now (one-time)' : isFlexible ? 'Paying now' : 'Paying now (instalment 1)',
                  value: money(effectiveAmount),
                  total: true,
                });
                return rows;
              })()}
            />
          </View>
        </View>
      </ScreenCanvas>

      {/* Success overlay */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={[s.overlay, { backgroundColor: COLORS.blackOpacity60, justifyContent: 'center', alignItems: 'center', padding: G * 2 }]}>
          <View style={[s.resultCard, { backgroundColor: COLORS.canvasElevated, borderRadius: SIZES.radius.sheet, padding: SIZES.padding.xxl }]}>
            <View style={[s.resultIcon, { backgroundColor: COLORS.successBg ?? '#E6F9F0' }]}>
              <Ionicons name="checkmark-circle" size={SIZES.icon.xl} color={COLORS.success ?? '#1A9E5C'} />
            </View>
            <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary, marginTop: SIZES.margin.xl, textAlign: 'center' }]}>
              You're enrolled! 🎉
            </Text>
            <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, marginTop: 6, textAlign: 'center', lineHeight: 19 }]}>
              {`Welcome to ${scheme.schemeName}. Your first instalment has been received.`}
            </Text>
            <PremiumButton label="Go to home" style={{ marginTop: SIZES.margin.xxl }} onPress={() => { reset(); navigation.navigate('Main'); }} />
          </View>
        </View>
      </Modal>

      {/* Failure modal */}
      <Modal visible={showFailed} transparent animationType="fade">
        <View style={[s.overlay, { backgroundColor: COLORS.blackOpacity60, justifyContent: 'center', alignItems: 'center', padding: G * 2 }]}>
          <View style={[s.resultCard, { backgroundColor: COLORS.canvasElevated, borderRadius: SIZES.radius.sheet, padding: SIZES.padding.xxl }]}>
            <View style={[s.resultIcon, { backgroundColor: COLORS.errorBg }]}>
              <Ionicons name="close-circle" size={SIZES.icon.xl} color={COLORS.error} />
            </View>
            <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary, marginTop: SIZES.margin.xl, textAlign: 'center' }]}>
              Payment failed
            </Text>
            <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, marginTop: 6, textAlign: 'center', lineHeight: 19 }]}>
              {error || 'Something went wrong. No amount has been debited. Please try again.'}
            </Text>
            <View style={{ marginTop: SIZES.margin.xxl, gap: 10, width: '100%' }}>
              <PremiumButton label="Try again" onPress={() => { reset(); void handleSubmit(); }} />
              <PremiumButton label="Cancel" variant="outline" onPress={() => reset()} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Amount selector modal */}
      <Modal visible={showAmountModal} transparent animationType="fade" onRequestClose={() => setShowAmountModal(false)}>
        <Pressable style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]} onPress={() => setShowAmountModal(false)}>
          <Pressable style={[s.sheet, { backgroundColor: COLORS.canvasElevated, borderRadius: SIZES.radius.sheet, width: '90%', maxHeight: '75%', paddingBottom: SIZES.padding.xxl, overflow: 'hidden' }]}>
            <View style={{ paddingHorizontal: G, paddingTop: SIZES.padding.xl, paddingBottom: SIZES.padding.md }}>
              <Text style={[asText(FONTS.eyebrow), { color: COLORS.primaryInk }]}>Plan</Text>
              <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary, marginTop: 2 }]}>Select monthly amount</Text>
            </View>
            <FlatList
              data={groups}
              keyExtractor={(g, i) => `${g.GROUPCODE}-${i}`}
              style={{ paddingHorizontal: G }}
              contentContainerStyle={{ paddingBottom: SIZES.padding.xl, gap: 10 }}
              renderItem={({ item: g, index: i }) => (
                <PaymentTile
                  icon="cash-outline"
                  title={`${money(g.AMOUNT)} / month`}
                  subtitle={undefined}
                  selected={selectedGroup?.GROUPCODE === g.GROUPCODE}
                  tag={i === 0 ? 'POPULAR' : undefined}
                  onPress={() => { setSelectedGroup(g); clearErr('group'); setShowAmountModal(false); }}
                />
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Verifying overlay */}
      {isChecking && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', gap: 12, zIndex: 999 }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[asText(FONTS.microBold), { color: COLORS.inkPrimary }]}>Verifying your payment…</Text>
          <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary }]}>Please wait, do not close the app</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flexRail:     { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  flexRailItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flexInputBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  overlay:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sheet:        { width: '100%' },
  resultCard:   { width: '100%', alignItems: 'center' },
  resultIcon:   { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
