import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  FormField,
  PremiumButton,
  StatusChip,
  asText,
  money,
  type SummaryRow,
} from '../../components/ui/premium';
import GoldAmountInput from '../../components/ui/appcomponents/GoldAmountInput';
import EmpIdField from '../../components/ui/appcomponents/EmpIdField';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BuyGold'>;
type Step  = 1 | 2;

type PostOffice = {
  Name: string;
  Block: string;
  District: string;
  State: string;
};

const DIGI_GOLD_SCHEME_ID = 6;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function calcAge(day: number, month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  )
    age--;
  return age;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;
const GENDER_ICONS: Record<string, string> = {
  Male: 'male-outline',
  Female: 'female-outline',
  Other: 'people-outline',
};

export default function BuyGoldScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const scheme     = route.params?.scheme;

  const toast = useToast();
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  // ── Two-step flow: 1 = your details, 2 = amount / weight + review ──
  const [step, setStep] = useState<Step>(1);

  // ── Rates ──
  const [rates,   setRates]   = useState<RatesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Dual input: amount (₹) and weight (g) stay in sync with each other ──
  const [amountInput, setAmountInput] = useState('1000');
  const [weightInput, setWeightInput] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    ratesService.getRates().then(setRates).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const goldRate = rates?.gold?.currentRate ?? 0;

  const amount = parseFloat(amountInput) || 0;
  const weight = parseFloat(weightInput) || 0;

  // Whenever the live rate changes (initial load / refresh), re-derive weight
  // from the currently entered amount so the two fields stay consistent.
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

  // ── Member groups (for groupCode / regNo) ──
  const { groups } = useMemberScheme(DIGI_GOLD_SCHEME_ID);

  // ── Payment ──
  const { status, initiateData, error, initiate, checkStatus, reset } = usePayment();
  const isProcessing = status === 'initiating';
  const isVerifying  = status === 'pending';

  // name / mobile / email come directly from login — not stored in form state
  const loginName   = user?.username      ?? '';
  const loginMobile = user?.contactNumber ?? '';
  const loginEmail  = user?.email         ?? '';

  // ── Address ──
  const [doorStreet, setDoorStreet] = useState('');
  const [area,       setArea]       = useState('');
  const [city,       setCity]       = useState('');
  const [district,   setDistrict]   = useState('');
  const [stateVal,   setStateVal]   = useState('');
  const [pincode,    setPincode]    = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearErr = (key: string) =>
    setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; });

  // ── KYC details ──
  const [aadhaar, setAadhaar] = useState('');
  const [pan,     setPan]     = useState('');
  const [gender,  setGender]  = useState('');

  // ── Emp ID — staff-only, hidden from regular members. Tapping the
  // "Your details" section heading 5 times in quick succession reveals it.
  const [empId, setEmpId] = useState('999');
  const [empName, setEmpName] = useState('');
  const [showEmpId, setShowEmpId] = useState(false);
  const empIdTapCount = useRef(0);
  const empIdTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleDetailsHeadingTap = () => {
    if (showEmpId) return;
    empIdTapCount.current += 1;
    if (empIdTapTimer.current) clearTimeout(empIdTapTimer.current);
    if (empIdTapCount.current >= 5) {
      setShowEmpId(true);
      empIdTapCount.current = 0;
      return;
    }
    empIdTapTimer.current = setTimeout(() => { empIdTapCount.current = 0; }, 600);
  };

  const today = new Date();
  const [dobDay,   setDobDay]   = useState(today.getDate());
  const [dobMonth, setDobMonth] = useState(today.getMonth() + 1);
  const [dobYear,  setDobYear]  = useState(today.getFullYear() - 25);
  const [dobSet,   setDobSet]   = useState(false);
  const [showDob,  setShowDob]  = useState(false);
  const [tempDob,  setTempDob]  = useState<Date>(new Date(today.getFullYear() - 25, 0, 1));

  // ── Nominee ──
  const [nominee,   setNominee]   = useState('');
  const [nomRel,    setNomRel]    = useState('');
  const [nomMobile, setNomMobile] = useState('');

  // Load shared personal draft (same key as SchemeJoinScreen)
  useEffect(() => {
    AsyncStorage.getItem('SCHEME_JOIN_PERSONAL').then((raw) => {
      if (!raw) return;
      try {
        const d = JSON.parse(raw);
        if (d.doorStreet) setDoorStreet(d.doorStreet);
        if (d.pincode)    setPincode(d.pincode);
        if (d.area)       setArea(d.area);
        if (d.city)       setCity(d.city);
        if (d.district)   setDistrict(d.district);
        if (d.stateVal)   setStateVal(d.stateVal);
        if (d.gender)     setGender(d.gender);
        if (d.dobDay)     setDobDay(d.dobDay);
        if (d.dobMonth)   setDobMonth(d.dobMonth);
        if (d.dobYear)    setDobYear(d.dobYear);
        if (d.dobSet)     setDobSet(d.dobSet);
        if (d.aadhaar)    setAadhaar(d.aadhaar);
        if (d.pan)        setPan(d.pan);
        if (d.empId)      setEmpId(d.empId);
        if (d.empName)    setEmpName(d.empName);
        if (d.nominee)    setNominee(d.nominee);
        if (d.nomRel)     setNomRel(d.nomRel);
        if (d.nomMobile)  setNomMobile(d.nomMobile);
      } catch {}
    });
  }, []);

  // Save shared personal draft on every change
  useEffect(() => {
    AsyncStorage.setItem('SCHEME_JOIN_PERSONAL', JSON.stringify({
      doorStreet, pincode, area, city, district, stateVal,
      gender, dobDay, dobMonth, dobYear, dobSet,
      aadhaar, pan, empId, empName, nominee, nomRel, nomMobile,
    }));
  }, [doorStreet, pincode, area, city, district, stateVal, gender, dobDay, dobMonth, dobYear, dobSet, aadhaar, pan, empId, empName, nominee, nomRel, nomMobile]);

  useEffect(() => {
    if (!user) return;
    if (user.address1 && !doorStreet) setDoorStreet(user.address1);
    if (user.city     && !city)       setCity(user.city);
    if (user.state    && !stateVal)   setStateVal(user.state);
    if (user.pincode  && !pincode)    setPincode(user.pincode);
    if (user.gender   && !gender)     setGender(user.gender);
    if (user.dateOfBirth && !dobSet) {
      try {
        const d = new Date(user.dateOfBirth);
        if (!isNaN(d.getTime())) {
          setDobDay(d.getDate());
          setDobMonth(d.getMonth() + 1);
          setDobYear(d.getFullYear());
          setDobSet(true);
        }
      } catch {}
    }
  }, [user]);

  // ── Pincode → auto-fill area / city / district / state ──
  const [pincodeOptions, setPincodeOptions] = useState<PostOffice[]>([]);
  const [showPincodeModal, setShowPincodeModal] = useState(false);

  const fetchPincode = async (pin: string) => {
    if (pin.length !== 6) {
      setArea('');
      setCity('');
      setDistrict('');
      setStateVal('');
      setPincodeOptions([]);
      return;
    }
    try {
      setPincodeLoading(true);
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();
      const po = json?.[0];
      if (po?.Status === 'Success' && po.PostOffice?.length > 0) {
        const offices = po.PostOffice as PostOffice[];
        if (offices.length === 1) {
          setArea(offices[0].Name ?? '');
          setCity(offices[0].Block ?? '');
          setDistrict(offices[0].District ?? '');
          setStateVal(offices[0].State ?? '');
        } else {
          setPincodeOptions(offices);
          setShowPincodeModal(true);
          setDistrict(offices[0].District ?? '');
          setStateVal(offices[0].State ?? '');
        }
        clearErr('pincode');
      } else {
        setFieldErrors((p) => ({ ...p, pincode: 'Invalid pincode — no results found' }));
      }
    } catch {
      setFieldErrors((p) => ({ ...p, pincode: 'Could not fetch pincode data' }));
    } finally {
      setPincodeLoading(false);
    }
  };

  const addressRows: SummaryRow[] = useMemo(() => {
    const rows: SummaryRow[] = [];
    if (area) rows.push({ label: 'Area', value: area });
    if (city) rows.push({ label: 'City', value: city });
    if (district) rows.push({ label: 'District', value: district });
    if (stateVal) rows.push({ label: 'State', value: stateVal });
    return rows;
  }, [area, city, district, stateVal]);

  const dobLabel = dobSet
    ? `${String(dobDay).padStart(2, '0')} ${MONTHS[dobMonth - 1]} ${dobYear}`
    : '';
  const dobAge = dobSet ? calcAge(dobDay, dobMonth, dobYear) : 0;

  const dobMax = new Date();
  dobMax.setFullYear(dobMax.getFullYear() - 18);
  const dobMin = new Date();
  dobMin.setFullYear(dobMin.getFullYear() - 100);

  const applyDob = (d: Date) => {
    setDobDay(d.getDate());
    setDobMonth(d.getMonth() + 1);
    setDobYear(d.getFullYear());
    setDobSet(true);
  };

  const openDobPicker = () => {
    setTempDob(dobSet ? new Date(dobYear, dobMonth - 1, dobDay) : dobMax);
    setShowDob(true);
  };

  const onDobChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDob(false);
      if (event?.type === 'set' && selected) applyDob(selected);
    } else if (selected) {
      setTempDob(selected);
    }
  };

  const isValidMobile = (v: string) => /^[6-9]\d{9}$/.test(v.trim());
  const isValidEmail  = (v: string) => v.includes('@') && v.includes('.');
  const isValidAadhaar = (v: string) => /^\d{12}$/.test(v.trim());
  const isValidPAN = (v: string) =>
    v === '' || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.trim().toUpperCase());

  const isCustomerValid =
    loginName.trim().length > 0 &&
    loginMobile.trim().length > 0 &&
    isValidAadhaar(aadhaar) &&
    isValidPAN(pan) &&
    dobSet && dobAge >= 18 &&
    gender !== '' &&
    doorStreet.trim().length > 3 &&
    pincode.trim().length === 6 &&
    nominee.trim().length > 1 &&
    (nomMobile === '' || isValidMobile(nomMobile));

  const isReady = amount > 0 && isCustomerValid && (!(scheme?.COMMAMT) || amount >= scheme.COMMAMT);

  const validateCustomerFields = (): Record<string, string> => {
    const fe: Record<string, string> = {};
    if (!isValidAadhaar(aadhaar))   fe.aadhaar    = 'Aadhaar must be exactly 12 digits';
    if (!isValidPAN(pan))           fe.pan        = 'Invalid PAN format (e.g. ABCDE1234F)';
    if (!dobSet || dobAge < 18)     fe.dob        = 'Must be 18 years or older';
    if (gender === '')              fe.gender     = 'Select gender';
    if (doorStreet.trim().length <= 3) fe.doorStreet = 'Enter your address';
    if (pincode.trim().length !== 6)   fe.pincode    = 'Enter a valid 6-digit pincode';
    if (nominee.trim().length <= 1) fe.nominee    = 'Enter nominee name';
    if (nomMobile && !isValidMobile(nomMobile)) fe.nomMobile = 'Enter a valid 10-digit mobile';
    return fe;
  };

  // Step 1 → Step 2: validate personal/KYC/nominee details before moving on
  const goToStep2 = () => {
    const fe = validateCustomerFields();
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) {
      toast.error('Please check your details', { position: 'top', duration: 3000 });
      return;
    }
    setStep(2);
  };

  // ── Payload ──
  const buildPayload = (): InitiatePaymentRequest => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dt  = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const dobFormatted = dobSet ? `${dobYear}-${pad(dobMonth)}-${pad(dobDay)}` : '';
    const titleMap: Record<string, string> = { Male: 'Mr', Female: 'Mrs', Other: 'Mx' };
    const group   = groups[0] ?? null;
    const groupCode = group?.GROUPCODE ?? '';
    const regNo     = group ? (group.REGNO ?? group.CURRENTREGNO ?? 1) : 1;
    const finalAmount = Math.round(amount);

    return {
      amount:         finalAmount,
      currency:       'INR',
      billingName:    loginName,
      billingEmail:   loginEmail,
      billingTel:     loginMobile,
      billingAddress: doorStreet.trim(),
      billingCity:    city.trim(),
      billingState:   stateVal.trim(),
      billingZip:     pincode.trim(),
      billingCountry: 'India',
      regno:          Number(regNo),
      groupcode:      groupCode,
      newJoin:        true,
      schemeDetails:  null,
      nmData: {
        newMember: {
          title:       titleMap[gender] || 'Mr',
          initial:     (loginName[0] || 'K').toUpperCase(),
          pName:       loginName || 'NA',
          sName:       'NA',
          doorNo:      doorStreet.trim(),
          address1:    doorStreet.trim(),
          address2:    district.trim(),
          area:        area.trim(),
          city:        city.trim(),
          state:       stateVal.trim() || 'Tamil Nadu',
          country:     'India',
          pinCode:     pincode.trim(),
          mobile:      loginMobile,
          idProof:     'Aadhaar',
          idProofNo:   aadhaar.trim(),
          panNumber:   pan.trim().toUpperCase(),
          dob:         dobFormatted,
          email:       loginEmail,
          upDateTime:  dt,
          userId:      '9999',
          appVer:      'APP',
        },
        createSchemeSummary: {
          schemeId:    DIGI_GOLD_SCHEME_ID,
          groupCode:   groupCode,
          regNo:       Number(regNo),
          joinDate:    dt,
          upDateTime2: dt,
          openingDate: dt,
          userId2:     '9999',
          iEmp:        empId.trim() || '999',
        },
        schemeCollectInsert: {
          amount:  finalAmount,
          modePay: 'O',
          accCode: '',
        },
      },
    };
  };

  const handleBuy = () => {
    const fe = validateCustomerFields();
    if (amount <= 0) {
      toast.info('Enter an amount', { message: 'Please enter how much gold to buy.' });
      return;
    }
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) {
      toast.error('Please check your details', { position: 'top', duration: 3000 });
      setStep(1);
      return;
    }
    const payload = buildPayload();
    console.log('[BuyGold] Initiate payload:', JSON.stringify(payload, null, 2));
    initiate(payload, (url) => {
      navigation.navigate('WebView', { url, title: 'Payment' });
    });
  };

  // ── Poll status on return from WebView ──
  const statusRef    = useRef(status);
  const initiateRef  = useRef(initiateData);
  statusRef.current  = status;
  initiateRef.current = initiateData;

  // Persist orderId in a plain ref so it survives reset()
  const orderIdRef = useRef<string | null>(null);
  if (initiateData?.orderId) orderIdRef.current = initiateData.orderId;

  const [isChecking, setIsChecking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('[BuyGold] useFocusEffect fired — status:', statusRef.current, 'orderId:', orderIdRef.current);
      if (statusRef.current === 'pending' && orderIdRef.current) {
        setIsChecking(true);
        checkStatus(orderIdRef.current).then((sd) => {
          console.log('[BuyGold] checkStatus resolved — sd:', sd ? 'has data' : 'null/undefined');
          if (sd) {
            navigation.navigate('PaymentResult', { result: sd, context: 'buygold' });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          }
          reset();
        }).catch((e) => {
          console.log('[BuyGold] checkStatus catch:', e);
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          reset();
        }).finally(() => setIsChecking(false));
      }
    }, [])
  );

  // ── Breakdown rows — only show a row when its underlying data is present ──
  const breakdown: SummaryRow[] = useMemo(() => {
    const rows: SummaryRow[] = [];
    if (goldRate > 0) rows.push({ label: 'Live rate · 916 (22K)', value: `${money(goldRate)} / g` });
    if (amount > 0) rows.push({ label: 'Amount entered', value: money(amount) });
    if (weight > 0) rows.push({ label: 'Gold received', value: `${weight.toFixed(4)} g`, highlight: true });
    if (amount > 0) rows.push({ label: 'Total payable', value: money(Math.round(amount)), total: true });
    return rows;
  }, [goldRate, amount, weight]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenCanvas
        overlap={moderateScale(24)}
        paddingBottom={moderateScale(40)}
        header={
          <PageHeader
            eyebrow={step === 1 ? 'Step 1 of 2 · Digital gold · 916' : 'Step 2 of 2 · Digital gold · 916'}
            title={step === 1 ? 'Your details' : 'Amount & weight'}
            bleedBottom={moderateScale(24)}
            actions={[{ icon: 'refresh-outline', onPress: load }]}
          >
            {step === 1 ? (
              <Text style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary, marginTop: SIZES.margin.lg, fontSize: 11, lineHeight: 17 }]}>
                A few KYC details to open your DigiGold account — takes under a minute.
              </Text>
            ) : (
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
            )}
          </PageHeader>
        }
        footer={
          step === 1 ? (
            <View
              style={[
                s.stepFooter,
                {
                  backgroundColor: COLORS.canvasElevated,
                  borderTopColor: COLORS.hairline,
                  paddingHorizontal: SIZES.layout.gutter,
                  paddingTop: SIZES.padding.lg,
                  paddingBottom: SIZES.padding.xl,
                },
              ]}
            >
              <PremiumButton label="Continue to amount" onPress={goToStep2} disabled={!isCustomerValid} />
            </View>
          ) : (
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
          )
        }
      >
        {step === 1 ? (
          <>
            {/* ── Customer info ── */}
            <View style={{ marginTop: SIZES.layout.sectionTight }}>
              <Pressable onPress={handleDetailsHeadingTap}>
                <SectionHeading
                  eyebrow="Required"
                  title="Your details"
                  caption="Used for billing and delivery of your DigiGold"
                />
              </Pressable>
              <View style={{ marginTop: SIZES.margin.lg, gap: 18 }}>
                <FormField
                  label="Aadhaar number"
                  indicator="required"
                  icon="card-outline"
                  value={aadhaar}
                  placeholder="12-digit Aadhaar"
                  keyboardType="numeric"
                  maxLength={12}
                  onChangeText={(v) => { setAadhaar(v.replace(/[^0-9]/g, '')); clearErr('aadhaar'); }}
                  error={fieldErrors.aadhaar}
                />
                <FormField
                  label="PAN number"
                  indicator="optional"
                  icon="document-text-outline"
                  value={pan}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  autoCapitalize="characters"
                  onChangeText={(v) => { setPan(v.toUpperCase()); clearErr('pan'); }}
                  error={fieldErrors.pan}
                  hint="Leave blank if not available"
                />
                {showEmpId && (
                  <EmpIdField
                    empId={empId}
                    empName={empName}
                    onSelect={(emp) => { setEmpId(emp.empId); setEmpName(emp.empName); }}
                  />
                )}
                <FormField
                  asButton
                  onPress={openDobPicker}
                  label="Date of birth"
                  indicator="required"
                  icon="calendar-outline"
                  value={dobLabel}
                  placeholder="Select date of birth"
                  rightIcon="chevron-down"
                  onRightIconPress={openDobPicker}
                  badge={dobSet ? `${dobAge}y` : undefined}
                  badgeTone={dobSet && dobAge >= 18 ? 'success' : 'error'}
                  error={fieldErrors.dob ?? (dobSet && dobAge < 18 ? 'Age must be 18 or older' : undefined)}
                  hint={!dobSet ? 'You must be 18 or older' : undefined}
                />

                <View>
                  <View style={s.labelRow}>
                    <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}>
                      Gender
                      <Text style={{ color: COLORS.metalGold }}> *</Text>
                    </Text>
                  </View>
                  <View style={[s.genderRow, { marginTop: 6 }]}>
                    {GENDER_OPTIONS.map((g) => {
                      const on = gender === g;
                      return (
                        <Pressable
                          key={g}
                          onPress={() => { setGender(g); clearErr('gender'); }}
                          style={({ pressed }) => [
                            s.genderChip,
                            {
                              borderRadius: SIZES.radius.tile,
                              borderColor: on ? COLORS.primary : fieldErrors.gender ? COLORS.error : COLORS.hairline,
                              borderWidth: on ? 1.5 : 1,
                              backgroundColor: COLORS.canvasElevated,
                              paddingVertical: SIZES.padding.md,
                              opacity: pressed ? 0.75 : 1,
                            },
                          ]}
                        >
                          <Ionicons name={GENDER_ICONS[g] as any} size={SIZES.icon.sm} color={on ? COLORS.primary : COLORS.inkTertiary} />
                          <Text style={[asText(FONTS.microBold), { color: on ? COLORS.primary : COLORS.inkSecondary }]}>{g}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {!!fieldErrors.gender && (
                    <View style={s.msgRow}>
                      <Ionicons name="alert-circle" size={12} color={COLORS.error} />
                      <Text style={[asText(FONTS.micro), { color: COLORS.error, fontSize: 10 }]}>{fieldErrors.gender}</Text>
                    </View>
                  )}
                </View>

                <FormField
                  label="Door no. / street"
                  indicator="required"
                  icon="home-outline"
                  value={doorStreet}
                  placeholder="12A, Gandhi Nagar, 2nd Street"
                  autoCapitalize="words"
                  onChangeText={(v) => { setDoorStreet(v); clearErr('doorStreet'); }}
                  error={fieldErrors.doorStreet}
                />
                <FormField
                  label="Pincode"
                  indicator="required"
                  icon="location-outline"
                  value={pincode}
                  placeholder="6-digit pincode"
                  keyboardType="numeric"
                  maxLength={6}
                  onChangeText={(v) => {
                    const p = v.replace(/[^0-9]/g, '').slice(0, 6);
                    setPincode(p);
                    clearErr('pincode');
                    if (p.length === 6) fetchPincode(p);
                  }}
                  error={fieldErrors.pincode}
                  rightIcon={
                    pincodeLoading
                      ? 'hourglass-outline'
                      : area
                      ? 'checkmark-circle-outline'
                      : undefined
                  }
                />

                {addressRows.length > 0 && (
                  <SummaryCard
                    eyebrow="Detected address"
                    rows={
                      pincodeOptions.length > 1
                        ? [
                            ...addressRows,
                            {
                              label: 'Change area',
                              value: `${pincodeOptions.length} options`,
                              onPress: () => setShowPincodeModal(true),
                            },
                          ]
                        : addressRows
                    }
                  />
                )}
              </View>
            </View>

            {/* ── Nominee ── */}
            <View style={{ marginTop: SIZES.layout.section }}>
              <SectionHeading
                eyebrow="Required"
                title="Nominee"
                caption="Mandatory for DigiGold enrolment"
              />
              <View style={{ marginTop: SIZES.margin.lg, gap: 18 }}>
                <FormField
                  label="Nominee name"
                  indicator="required"
                  icon="people-outline"
                  value={nominee}
                  placeholder="Nominee's full name"
                  autoCapitalize="words"
                  onChangeText={(v) => { setNominee(v); clearErr('nominee'); }}
                  error={fieldErrors.nominee}
                />
                <FormField
                  label="Relationship"
                  indicator="optional"
                  icon="heart-outline"
                  value={nomRel}
                  placeholder="Spouse, son, daughter…"
                  autoCapitalize="words"
                  onChangeText={setNomRel}
                />
                <FormField
                  label="Nominee mobile"
                  indicator="optional"
                  icon="call-outline"
                  value={nomMobile}
                  placeholder="10-digit mobile"
                  keyboardType="phone-pad"
                  maxLength={10}
                  onChangeText={(v) => { setNomMobile(v.replace(/[^0-9]/g, '')); clearErr('nomMobile'); }}
                  error={fieldErrors.nomMobile}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => setStep(1)}
              hitSlop={8}
              style={[s.backLink, { marginTop: SIZES.layout.sectionTight }]}
            >
              <Ionicons name="chevron-back" size={16} color={COLORS.inkTertiary} />
              <Text style={[asText(FONTS.microBold), { color: COLORS.inkTertiary }]}>Edit your details</Text>
            </Pressable>

            <View style={{ marginTop: SIZES.margin.lg }}>
              <GoldAmountInput
                amountInput={amountInput}
                weightInput={weightInput}
                onAmountChange={handleAmountChange}
                onWeightChange={handleWeightChange}
                goldRate={goldRate}
                ratesLoading={loading}
                minAmount={scheme?.COMMAMT ? scheme.COMMAMT : undefined}
                breakdownRows={breakdown}
              />
            </View>
          </>
        )}
      </ScreenCanvas>

      {/* ── Pincode area selector ── */}
      <Modal
        visible={showPincodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPincodeModal(false)}
      >
        <Pressable
          style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]}
          onPress={() => setShowPincodeModal(false)}
        >
          <Pressable
            style={[
              s.sheet,
              {
                backgroundColor: COLORS.canvasElevated,
                borderRadius: SIZES.radius.sheet,
                width: '90%',
                maxHeight: '75%',
                paddingBottom: SIZES.padding.xxl,
                overflow: 'hidden',
              },
            ]}
          >
            <View
              style={{
                paddingHorizontal: SIZES.layout.gutter,
                paddingTop: SIZES.padding.xl,
                paddingBottom: SIZES.padding.md,
              }}
            >
              <Text style={[asText(FONTS.eyebrow), { color: COLORS.primaryInk }]}>
                Pincode {pincode}
              </Text>
              <Text
                style={[
                  asText(FONTS.displaySm),
                  { color: COLORS.inkPrimary, marginTop: 2 },
                ]}
              >
                Select your area
              </Text>
            </View>

            <FlatList
              data={pincodeOptions}
              keyExtractor={(_, i) => String(i)}
              style={{ paddingHorizontal: SIZES.layout.gutter }}
              contentContainerStyle={{ paddingBottom: SIZES.padding.xl }}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => {
                    setArea(item.Name);
                    setCity(item.Block);
                    setDistrict(item.District);
                    setStateVal(item.State);
                    setShowPincodeModal(false);
                  }}
                  style={({ pressed }) => [
                    s.poRow,
                    {
                      paddingVertical: SIZES.padding.lg,
                      borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: COLORS.hairline,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        asText(FONTS.microBold),
                        { color: COLORS.inkPrimary },
                      ]}
                    >
                      {item.Name}
                    </Text>
                    <Text
                      style={[
                        asText(FONTS.micro),
                        { color: COLORS.inkTertiary, fontSize: 10, marginTop: 2 },
                      ]}
                    >
                      {item.Block} · {item.District}
                    </Text>
                  </View>
                  <Ionicons
                    name={area === item.Name ? 'checkmark-circle' : 'chevron-forward'}
                    size={SIZES.icon.md}
                    color={area === item.Name ? COLORS.primary : COLORS.inkMuted}
                  />
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Native Date of Birth picker ── */}
      {showDob && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDob}
          mode="date"
          display="default"
          maximumDate={dobMax}
          minimumDate={dobMin}
          onChange={onDobChange}
        />
      )}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDob}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDob(false)}
        >
          <Pressable
            style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]}
            onPress={() => setShowDob(false)}
          >
            <Pressable
              style={[
                s.sheet,
                {
                  backgroundColor: COLORS.canvasElevated,
                  borderRadius: SIZES.radius.sheet,
                  width: '90%',
                  overflow: 'hidden',
                },
              ]}
            >
              <View
                style={[
                  s.sheetHead,
                  {
                    paddingHorizontal: SIZES.layout.gutter,
                    paddingVertical: SIZES.padding.lg,
                    borderBottomColor: COLORS.hairline,
                  },
                ]}
              >
                <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary }]}>
                  Date of birth
                </Text>
                <Pressable
                  onPress={() => { applyDob(tempDob); setShowDob(false); }}
                  hitSlop={10}
                >
                  <Text style={[asText(FONTS.microBold), { color: COLORS.primaryInk }]}>
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDob}
                mode="date"
                display="spinner"
                maximumDate={dobMax}
                minimumDate={dobMin}
                onChange={onDobChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Verifying overlay — shown while checkStatus API call is in flight */}
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
  rateCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16 },
  rateCoin:   { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  backLink:   { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  stepFooter: { borderTopWidth: StyleSheet.hairlineWidth },
  overlay:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  sheet:      { width: '100%' },
  sheetHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  poRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labelRow:   { flexDirection: 'row', alignItems: 'center' },
  genderRow:  { flexDirection: 'row', gap: 8 },
  genderChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  msgRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
});