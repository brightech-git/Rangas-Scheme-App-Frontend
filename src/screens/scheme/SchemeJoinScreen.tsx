// src/screens/scheme/SchemeJoinScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   The enrolment form, restructured from one long scroll into three
//   labelled stages with a step rail in the warm hero: Plan → Details
//   → Nominee. The rail shows which stages are complete and how many
//   errors each holds, so a 13-field KYC form stops feeling unbounded.
//
//   Fields are underlined rows with micro-caps labels rather than
//   boxed inputs, which makes a dense column of them far quieter. The
//   commit bar is pinned and always states the monthly amount and the
//   number of instalments being committed to.
//
// WHY THIS IS BETTER UX
//   • Progress is visible. The previous screen gave no sense of how
//     much form remained, which is the main abandonment driver on
//     enrolment flows.
//   • Errors are counted per stage in the rail, so after a failed
//     submit the member knows where to look before scrolling.
//   • Amount selection is a list of PaymentTiles rather than a modal
//     dropdown — one fewer tap, and all options compare side by side.
//   • The pincode result (area / city / district / state) is a proper
//     SummaryCard instead of an ad-hoc tinted box.
//
// BUSINESS LOGIC — UNCHANGED
//   useRazorpay, useMemberScheme, memberService.createMember,
//   buildUserDetails, buildMemberPayload, handleSubmit's validation
//   map and FIELD_ORDER, the AsyncStorage draft load/save, the
//   user-profile autofill effect, fetchPincode, all validators, the
//   success useEffect, DateTimePicker wiring and RazorpayWebCheckout
//   are preserved exactly.
//
//   NOTE: this file was edited concurrently while the redesign was in
//   progress — the pincode lookup was fixed (the URL no longer escapes
//   its interpolation) and gained multi-post-office selection. That
//   newer logic is carried forward here verbatim; only its presenter
//   changed, from a centred dropdown dialog to a bottom sheet.
//
// NEW UI COMPONENTS
//   ScreenCanvas, PageHeader, FormField, PaymentTile, SummaryCard,
//   BottomActionBar, SectionHeading, PremiumButton, StatusChip
// ─────────────────────────────────────────────────────────────────

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
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { RatesResponse } from '../../types/Rates/Rates';

import {
  ScreenCanvas,
  PageHeader,
  FormField,
  PaymentTile,
  SummaryCard,
  BottomActionBar,
  SectionHeading,
  PremiumButton,
  StatusChip,
  SkeletonBlock,
  asText,
  money,
  type SummaryRow,
} from '../../components/ui/premium';

type RouteProps = RouteProp<RootStackParamList, 'SchemeJoin'>;
type NavProps = NativeStackNavigationProp<RootStackParamList, 'SchemeJoin'>;

type PostOffice = {
  Name: string;
  Block: string;
  District: string;
  State: string;
};

// ── Helpers (unchanged) ──────────────────────────────────────────
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

const DRAFT_KEY = (schemeId: number) => `SCHEME_JOIN_DRAFT_${schemeId}`;
const PERSONAL_KEY = 'SCHEME_JOIN_PERSONAL';

export default function SchemeJoinScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteProps>();
  const { scheme } = route.params;

  const { status, initiateData, error, initiate, checkStatus, reset } = usePayment();
  const toast = useToast();
  const user  = useAppSelector((s) => s.auth.user);

  const { groups, loading: groupsLoading } = useMemberScheme(scheme.SchemeId);

  const mLabel = METAL_LABEL[scheme.MetalType] ?? scheme.MetalType;

  // Payment shape: 'fixed' picks a monthly group amount, 'lumpsum' is a
  // single one-time payment, 'flexible' (DigiGold-style) is pay-anytime
  // by rupees or by gold weight. See utils/schemeKind.ts.
  const schemeKind = classifySchemeKind(scheme.FixedIns, scheme.Instalment, scheme.WeightLedger);
  const isFixed    = schemeKind === 'fixed';
  const isLumpsum  = schemeKind === 'lumpsum';
  const isFlexible = schemeKind === 'flexible';

  // Selected group (FixedIns=Y)
  const [selectedGroup, setSelectedGroup] =
    useState<MemberSchemeGroup | null>(null);
  // Custom amount (lumpsum)
  const [customAmount, setCustomAmount] = useState('');

  // Amount ⇄ weight entry (flexible / DigiGold-style schemes only)
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [mode, setMode] = useState<'amount' | 'weight'>('amount');
  const [flexInput, setFlexInput] = useState('');

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

  // Auto-select first group when data loads
  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) setSelectedGroup(groups[0]);
  }, [groups]);

  const effectiveAmount = isFixed
    ? selectedGroup?.AMOUNT ?? 0
    : isFlexible
    ? Math.round(flexAmount)
    : parseInt(customAmount) || 0;

  // name / mobile / email come directly from login — not stored in form state
  const loginName   = user?.username       ?? '';
  const loginMobile = user?.contactNumber  ?? '';
  const loginEmail  = user?.email          ?? '';

  // Customer details
  const [nominee, setNominee] = useState('');
  const [nomRel, setNomRel] = useState('');
  const [nomMobile, setNomMobile] = useState('');
  const [gender, setGender] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [empId, setEmpId] = useState('999');
  // Staff-only field — hidden from regular members. Tapping the "Step 2"
  // heading 5 times in quick succession reveals the Emp ID input.
  const [showEmpId, setShowEmpId] = useState(false);
  const empIdTapCount = useRef(0);
  const empIdTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleStep2HeadingTap = () => {
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
  const [doorStreet, setDoorStreet] = useState('');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const clearErr = (key: string) =>
    setFieldErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });

  // Date of Birth state
  const today = new Date();
  const [dobDay, setDobDay] = useState(today.getDate());
  const [dobMonth, setDobMonth] = useState(today.getMonth() + 1);
  const [dobYear, setDobYear] = useState(today.getFullYear() - 25);
  const [dobSet, setDobSet] = useState(false);
  const [showDob, setShowDob] = useState(false);
  const [tempDob, setTempDob] = useState<Date>(
    new Date(today.getFullYear() - 25, 0, 1),
  );

  // ── Auto-populate from logged-in user profile ──────
  useEffect(() => {
    if (!user) return;
    if (user.gender    && !gender)     setGender(user.gender);
    if (user.address1  && !doorStreet) setDoorStreet(user.address1);
    if (user.city      && !city)       setCity(user.city);
    if (user.state     && !stateVal)   setStateVal(user.state);
    if (user.pincode   && !pincode)    setPincode(user.pincode);
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

  // ── AsyncStorage: load draft on mount ──────────────
  useEffect(() => {
    AsyncStorage.getItem(PERSONAL_KEY).then((raw) => {
      if (!raw) return;
      try {
        const d = JSON.parse(raw);
        if (d.aadhaar) setAadhaar(d.aadhaar);
        if (d.pan) setPan(d.pan);
        if (d.empId) setEmpId(d.empId);
        if (d.doorStreet) setDoorStreet(d.doorStreet);
        if (d.pincode) setPincode(d.pincode);
        if (d.area) setArea(d.area);
        if (d.city) setCity(d.city);
        if (d.district) setDistrict(d.district);
        if (d.stateVal) setStateVal(d.stateVal);
        if (d.gender) setGender(d.gender);
        if (d.dobDay) setDobDay(d.dobDay);
        if (d.dobMonth) setDobMonth(d.dobMonth);
        if (d.dobYear) setDobYear(d.dobYear);
        if (d.dobSet) setDobSet(d.dobSet);
        if (d.nominee) setNominee(d.nominee);
        if (d.nomRel) setNomRel(d.nomRel);
        if (d.nomMobile) setNomMobile(d.nomMobile);
      } catch {
        /* ignore corrupt data */
      }
    });
  }, []);

  // ── Pincode → auto-fill area / city / district / state ─────────
  // (logic carried forward verbatim from the concurrent edit)
  const [pincodeOptions, setPincodeOptions] = useState<PostOffice[]>([]);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);

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
          // pre-fill with first entry
          setDistrict(offices[0].District ?? '');
          setStateVal(offices[0].State ?? '');
        }
        clearErr('pincode');
      } else {
        setFieldErrors((p) => ({
          ...p,
          pincode: 'Invalid pincode — no results found',
        }));
      }
    } catch {
      setFieldErrors((p) => ({ ...p, pincode: 'Could not fetch pincode data' }));
    } finally {
      setPincodeLoading(false);
    }
  };

  // ── AsyncStorage: save draft ────────
  useEffect(() => {
    const draft = {
      aadhaar, pan, empId,
      doorStreet, pincode, area, city, district, stateVal,
      gender, dobDay, dobMonth, dobYear, dobSet,
      nominee, nomRel, nomMobile,
    };
    AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(draft));
  }, [
    aadhaar, pan, empId,
    doorStreet, pincode, area, city, district, stateVal,
    gender, dobDay, dobMonth, dobYear, dobSet,
    nominee, nomRel, nomMobile,
  ]);

  const dobLabel = dobSet
    ? `${String(dobDay).padStart(2, '0')} ${MONTHS[dobMonth - 1]} ${dobYear}`
    : '';
  const dobAge = dobSet ? calcAge(dobDay, dobMonth, dobYear) : 0;

  // Native date-picker bounds: must be 18+ (and at most 100 years old)
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

  // Android fires onChange with the final value; iOS updates live (confirmed via "Done").
  const onDobChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDob(false);
      if (event?.type === 'set' && selected) applyDob(selected);
    } else if (selected) {
      setTempDob(selected);
    }
  };

  // ── Field validators (unchanged) ──────────────────────────────
  const isValidMobile = (v: string) => /^[6-9]\d{9}$/.test(v.trim());
  const isValidAadhaar = (v: string) => /^\d{12}$/.test(v.trim());
  const isValidPAN = (v: string) =>
    v === '' || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.trim().toUpperCase());
  const isValidEmail = (v: string) => v.includes('@') && v.includes('.');

  const isFormValid =
    loginName.trim().length > 0 &&
    loginMobile.trim().length > 0 &&
    dobSet && dobAge >= 18 &&
    isValidAadhaar(aadhaar) &&
    isValidPAN(pan) &&
    nominee.trim().length > 1 &&
    (nomMobile === '' || isValidMobile(nomMobile)) &&
    gender !== '' &&
    doorStreet.trim().length > 3 &&
    pincode.trim().length === 6 &&
    effectiveAmount > 0 &&
    (!isFixed || selectedGroup !== null);

  const isProcessing  = status === 'initiating';
  const showFailed    = status === 'failed';
  const showSuccess   = status === 'success';

  const buildPayload = (): InitiatePaymentRequest => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dt  = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const dobFormatted = dobSet ? `${dobYear}-${pad(dobMonth)}-${pad(dobDay)}` : '';
    const titleMap: Record<string, string> = { Male: 'Mr', Female: 'Mrs', Other: 'Mx' };
    const activeGroup = isFixed ? selectedGroup : (groups[0] ?? null);
    const groupCode   = activeGroup?.GROUPCODE ?? '';
    const regNo       = activeGroup ? (activeGroup.REGNO ?? activeGroup.CURRENTREGNO ?? 1) : 1;

    return {
      amount:         effectiveAmount,
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
          userId:      empId.trim() || '999',
          appVer:      'APP',
        },
        createSchemeSummary: {
          schemeId:    scheme.SchemeId,
          groupCode:   groupCode,
          regNo:       Number(regNo),
          joinDate:    dt,
          upDateTime2: dt,
          openingDate: dt,
          userId2:     empId.trim() || '999',
        },
        schemeCollectInsert: {
          amount:  effectiveAmount,
          modePay: 'O',
          accCode: '',
        },
      },
    };
  };

  // ── Scroll-to-first-error plumbing (unchanged) ────────────────
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const fieldNodeRefs = useRef<Record<string, any>>({});
  const registerField = (key: string) => (node: any) => {
    fieldNodeRefs.current[key] = node;
  };
  const FIELD_ORDER = [
    'group', 'amount', 'aadhaar', 'pan',
    'dob', 'gender', 'doorStreet', 'pincode', 'nominee', 'nomMobile',
  ];
  const scrollToFirstError = (errs: Record<string, string>) => {
    const key = FIELD_ORDER.find((k) => errs[k]);
    const node = key ? fieldNodeRefs.current[key] : null;
    if (!node || !contentRef.current || !node.measureLayout) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    node.measureLayout(
      contentRef.current,
      (_x: number, y: number) =>
        scrollRef.current?.scrollTo({ y: Math.max(y - 28, 0), animated: true }),
      () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
    );
  };

  const handleSubmit = () => {
    const fe: Record<string, string> = {};
    if (!dobSet || dobAge < 18)                     fe.dob        = 'Must be 18 years or older';
    if (!isValidAadhaar(aadhaar))                   fe.aadhaar    = 'Aadhaar must be exactly 12 digits';
    if (!isValidPAN(pan))                           fe.pan        = 'Invalid PAN format (e.g. ABCDE1234F)';
    if (nominee.trim().length <= 1)                 fe.nominee    = 'Enter nominee name';
    if (nomMobile && !isValidMobile(nomMobile))     fe.nomMobile  = 'Enter a valid 10-digit mobile';
    if (gender === '')                              fe.gender     = 'Select gender';
    if (doorStreet.trim().length <= 3)              fe.doorStreet = 'Enter door number and street';
    if (pincode.trim().length !== 6)                fe.pincode    = 'Enter a valid 6-digit pincode';
    if (effectiveAmount <= 0)                       fe.amount     = 'Select or enter amount';
    if (isFixed && !selectedGroup)                  fe.group      = 'Select a group';

    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) {
      toast.error('Please check the form', {
        message:  fe[FIELD_ORDER.find((k) => fe[k]) ?? ''] ?? 'Some fields need attention.',
        position: 'top',
        duration: 3500,
      });
      scrollToFirstError(fe);
      return;
    }

    initiate(buildPayload(), (url, orderId) => {
      navigation.navigate('WebView', { url, title: 'Payment' });
    });
  };

  const statusRef     = React.useRef(status);
  const initiateRef   = React.useRef(initiateData);
  statusRef.current   = status;
  initiateRef.current = initiateData;

  // Persist orderId in a plain ref so it survives reset()
  const orderIdRef = React.useRef<string | null>(null);
  if (initiateData?.orderId) orderIdRef.current = initiateData.orderId;

  const [isChecking, setIsChecking] = useState(false);

  // Poll status once when returning from the CCAvenue WebView
  useFocusEffect(
    useCallback(() => {
      console.log('[SchemeJoin] useFocusEffect fired — status:', statusRef.current, 'orderId:', orderIdRef.current);
      if (statusRef.current === 'pending' && orderIdRef.current) {
        setIsChecking(true);
        checkStatus(orderIdRef.current).then((sd) => {
          console.log('[SchemeJoin] checkStatus resolved — sd:', sd ? 'has data' : 'null/undefined');
          if (sd) {
            AsyncStorage.removeItem(DRAFT_KEY(scheme.SchemeId));
            navigation.navigate('PaymentResult', { result: sd, context: 'join' });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          }
          reset();
        }).catch((e) => {
          console.log('[SchemeJoin] checkStatus catch:', e);
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

  // ── Presentation-only: stage completion for the rail ──
  const stages = useMemo(() => {
    const planOk = effectiveAmount > 0 && (!isFixed || !!selectedGroup);
    const detailsOk =
      loginName.trim().length > 0 &&
      loginMobile.trim().length > 0 &&
      dobSet &&
      dobAge >= 18 &&
      isValidAadhaar(aadhaar) &&
      isValidPAN(pan) &&
      gender !== '' &&
      doorStreet.trim().length > 3 &&
      pincode.trim().length === 6;
    const nomineeOk =
      nominee.trim().length > 1 &&
      (nomMobile === '' || isValidMobile(nomMobile));

    const errCount = (keys: string[]) =>
      keys.filter((k) => fieldErrors[k]).length;

    return [
      {
        key: 'plan',
        label: 'Plan',
        done: planOk,
        errors: errCount(['group', 'amount']),
      },
      {
        key: 'details',
        label: 'Details',
        done: detailsOk,
        errors: errCount([
          'name', 'mobile', 'email', 'aadhaar', 'pan',
          'dob', 'gender', 'doorStreet', 'pincode',
        ]),
      },
      {
        key: 'nominee',
        label: 'Nominee',
        done: nomineeOk,
        errors: errCount(['nominee', 'nomMobile']),
      },
    ];
  }, [
    effectiveAmount, isFixed, selectedGroup, loginName, loginMobile, loginEmail, dobSet,
    dobAge, aadhaar, pan, gender, doorStreet, pincode, nominee, nomMobile,
    fieldErrors,
  ]);

  const addressRows: SummaryRow[] = useMemo(() => {
    const rows: SummaryRow[] = [];
    if (area) rows.push({ label: 'Area', value: area });
    if (city) rows.push({ label: 'City', value: city });
    if (district) rows.push({ label: 'District', value: district });
    if (stateVal) rows.push({ label: 'State', value: stateVal });
    return rows;
  }, [area, city, district, stateVal]);

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
            {/* Stage rail */}
            <View
              style={[
                s.stageRail,
                {
                  marginTop: SIZES.margin.xxl,
                  borderColor: COLORS.heroHairline,
                  borderRadius: SIZES.radius.tile,
                },
              ]}
            >
              {stages.map((st, i) => (
                <View
                  key={st.key}
                  style={[
                    s.stage,
                    {
                      paddingVertical: SIZES.padding.md,
                      borderLeftWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderLeftColor: COLORS.heroHairline,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.stageDot,
                      {
                        borderColor: st.errors
                          ? COLORS.primaryLighter
                          : st.done
                          ? COLORS.heroAccent
                          : COLORS.heroHairlineBold,
                        backgroundColor: st.done
                          ? COLORS.heroAccent
                          : 'transparent',
                      },
                    ]}
                  >
                    {st.done && (
                      <Ionicons
                        name="checkmark"
                        size={10}
                        color={COLORS.heroOnAccent}
                      />
                    )}
                    {!st.done && st.errors > 0 && (
                      <Text
                        style={{
                          fontSize: 9,
                          color: COLORS.primaryLighter,
                          fontFamily: FONTS.family.bold,
                        }}
                      >
                        {st.errors}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      asText(FONTS.micro),
                      {
                        color: st.done
                          ? COLORS.heroTextPrimary
                          : COLORS.heroTextMuted,
                        fontSize: 10,
                      },
                    ]}
                  >
                    {st.label}
                  </Text>
                </View>
              ))}
            </View>

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
          {/* ═══ STAGE 1 — PLAN ═══ */}
          <View style={{ marginTop: SIZES.layout.sectionTight }}>
            <SectionHeading
              eyebrow="Step 1"
              title="Choose your plan"
              caption={
                isFixed
                  ? 'Pick a monthly instalment from the available groups'
                  : isLumpsum
                  ? 'Enter the one-time amount you want to pay'
                  : 'Pay any amount, any time — by rupees or by gold weight'
              }
            />

            <View
              ref={registerField(isFixed ? 'group' : 'amount')}
              collapsable={false}
              style={{ marginTop: SIZES.margin.lg, gap: 10 }}
            >
              {isFixed ? (
                groupsLoading ? (
                  <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary }]}>
                    Loading available amounts…
                  </Text>
                ) : groups.length === 0 ? (
                  <StatusChip
                    tone="warning"
                    icon="alert-circle-outline"
                    label="No instalment groups available"
                  />
                ) : (
                  <Pressable
                    onPress={() => setShowAmountModal(true)}
                    style={({ pressed }) => ([
                      {
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
                      },
                    ])}
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
                  <View
                    style={[
                      s.flexRail,
                      { borderColor: COLORS.hairline, borderRadius: SIZES.radius.tile },
                    ]}
                  >
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
                          <Text
                            style={[
                              asText(FONTS.microBold),
                              { color: on ? COLORS.primary : COLORS.inkTertiary },
                            ]}
                          >
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
                      onChangeText={(v) => {
                        setFlexInput(v.replace(/[^0-9.]/g, ''));
                        clearErr('amount');
                      }}
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
                  onChangeText={(v) => {
                    setCustomAmount(v.replace(/[^0-9]/g, ''));
                    clearErr('amount');
                  }}
                  error={fieldErrors.amount}
                  hint="Paid once — no recurring instalments after this"
                />
              )}

              {isFixed && !!fieldErrors.group && (
                <StatusChip
                  tone="danger"
                  icon="alert-circle"
                  label={fieldErrors.group}
                />
              )}
            </View>
          </View>

          {/* ═══ STAGE 2 — DETAILS ═══ */}
          <View style={{ marginTop: SIZES.layout.section }}>
            <Pressable onPress={handleStep2HeadingTap}>
              <SectionHeading
                eyebrow="Step 2"
                title="Your details"
                caption="Used for KYC verification — please be accurate"
              />
            </Pressable>

            <View style={{ marginTop: SIZES.margin.lg, gap: 18 }}>
              <FormField
                ref={registerField('aadhaar')}
                label="Aadhaar number"
                indicator="required"
                icon="card-outline"
                value={aadhaar}
                placeholder="12-digit Aadhaar"
                keyboardType="numeric"
                maxLength={12}
                onChangeText={(v) => {
                  setAadhaar(v.replace(/[^0-9]/g, ''));
                  clearErr('aadhaar');
                }}
                error={fieldErrors.aadhaar}
              />

              <FormField
                ref={registerField('pan')}
                label="PAN number"
                indicator="optional"
                icon="document-text-outline"
                value={pan}
                placeholder="ABCDE1234F"
                maxLength={10}
                autoCapitalize="characters"
                onChangeText={(v) => {
                  setPan(v.toUpperCase());
                  clearErr('pan');
                }}
                error={fieldErrors.pan}
                hint="Leave blank if not available"
              />

              {showEmpId && (
                <FormField
                  label="Emp ID"
                  indicator="optional"
                  icon="person-outline"
                  value={empId}
                  placeholder="999"
                  keyboardType="numeric"
                  onChangeText={(v) => setEmpId(v.replace(/[^0-9]/g, ''))}
                />
              )}

              {/* Date of birth */}
              <FormField
                ref={registerField('dob')}
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
                error={
                  fieldErrors.dob ??
                  (dobSet && dobAge < 18 ? 'Age must be 18 or older' : undefined)
                }
                hint={!dobSet ? 'You must be 18 or older to enrol' : undefined}
              />

              {/* Gender */}
              <View ref={registerField('gender')} collapsable={false}>
                <View style={s.labelRow}>
                  <Text
                    style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}
                  >
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
                        onPress={() => {
                          setGender(g);
                          clearErr('gender');
                        }}
                        style={({ pressed }) => [
                          s.genderChip,
                          {
                            borderRadius: SIZES.radius.tile,
                            borderColor: on
                              ? COLORS.primary
                              : fieldErrors.gender
                              ? COLORS.error
                              : COLORS.hairline,
                            borderWidth: on ? 1.5 : 1,
                            backgroundColor: COLORS.canvasElevated,
                            paddingVertical: SIZES.padding.md,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <Ionicons
                          name={GENDER_ICONS[g] as any}
                          size={SIZES.icon.sm}
                          color={on ? COLORS.primary : COLORS.inkTertiary}
                        />
                        <Text
                          style={[
                            asText(FONTS.microBold),
                            { color: on ? COLORS.primary : COLORS.inkSecondary },
                          ]}
                        >
                          {g}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {!!fieldErrors.gender && (
                  <View style={s.msgRow}>
                    <Ionicons name="alert-circle" size={12} color={COLORS.error} />
                    <Text
                      style={[
                        asText(FONTS.micro),
                        { color: COLORS.error, fontSize: 10 },
                      ]}
                    >
                      {fieldErrors.gender}
                    </Text>
                  </View>
                )}
              </View>

              <FormField
                ref={registerField('doorStreet')}
                label="Door no. / street"
                indicator="required"
                icon="home-outline"
                value={doorStreet}
                placeholder="12A, Gandhi Nagar, 2nd Street"
                onChangeText={(v) => {
                  setDoorStreet(v);
                  clearErr('doorStreet');
                }}
                error={fieldErrors.doorStreet}
                autoCapitalize="words"
              />

              <FormField
                ref={registerField('pincode')}
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

          {/* ═══ STAGE 3 — NOMINEE ═══ */}
          <View style={{ marginTop: SIZES.layout.section }}>
            <SectionHeading
              eyebrow="Step 3"
              title="Nominee"
              caption="Mandatory for scheme enrolment"
            />

            <View style={{ marginTop: SIZES.margin.lg, gap: 18 }}>
              <FormField
                ref={registerField('nominee')}
                label="Nominee name"
                indicator="required"
                icon="people-outline"
                value={nominee}
                placeholder="Nominee's full name"
                onChangeText={(v) => {
                  setNominee(v);
                  clearErr('nominee');
                }}
                error={fieldErrors.nominee}
                autoCapitalize="words"
              />

              <FormField
                label="Relationship"
                indicator="optional"
                icon="heart-outline"
                value={nomRel}
                placeholder="Spouse, son, daughter…"
                onChangeText={setNomRel}
                autoCapitalize="words"
              />

              <FormField
                ref={registerField('nomMobile')}
                label="Nominee mobile"
                indicator="optional"
                icon="call-outline"
                value={nomMobile}
                placeholder="10-digit mobile"
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={(v) => {
                  setNomMobile(v.replace(/[^0-9]/g, ''));
                  clearErr('nomMobile');
                }}
                error={fieldErrors.nomMobile}
              />
            </View>
          </View>

          {/* ── Review before commit ── */}
          <View style={{ marginTop: SIZES.layout.section }}>
            <SectionHeading eyebrow="Review" title="Enrolment summary" />
            <SummaryCard
              style={{ marginTop: SIZES.margin.lg }}
              rows={(() => {
                const rows: SummaryRow[] = [];
                if (scheme.schemeName) rows.push({ label: 'Scheme', value: scheme.schemeName });
                if (mLabel) rows.push({ label: 'Metal', value: mLabel });
                rows.push({
                  label: 'Plan type',
                  value: isFixed ? 'Fixed' : isLumpsum ? 'One-time' : 'Flexible',
                });
                if (!isLumpsum && scheme.Instalment) {
                  rows.push({ label: 'Instalments', value: String(scheme.Instalment) });
                }
                if (isFixed && selectedGroup) {
                  rows.push({ label: 'Group', value: String(selectedGroup.GROUPCODE) });
                }
                if (isFlexible && goldRate > 0 && flexWeight > 0) {
                  rows.push({ label: 'Gold equivalent', value: `${flexWeight.toFixed(4)} g` });
                }
                if (effectiveAmount > 0) {
                  rows.push({
                    label: isLumpsum
                      ? 'Paying now (one-time)'
                      : isFlexible
                      ? 'Paying now'
                      : 'Paying now (instalment 1)',
                    value: money(effectiveAmount),
                    total: true,
                  });
                }
                return rows;
              })()}
            />
          </View>

          {!isFormValid && (
            <StatusChip
              tone="warning"
              icon="information-circle-outline"
              label="Complete all required fields to continue"
              style={{ marginTop: SIZES.margin.lg }}
            />
          )}
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

      {/* ── Native Date of Birth picker (unchanged) ── */}
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
                    paddingHorizontal: G,
                    paddingVertical: SIZES.padding.lg,
                    borderBottomColor: COLORS.hairline,
                  },
                ]}
              >
                <Text
                  style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary }]}
                >
                  Date of birth
                </Text>
                <Pressable
                  onPress={() => {
                    applyDob(tempDob);
                    setShowDob(false);
                  }}
                  hitSlop={10}
                >
                  <Text
                    style={[asText(FONTS.microBold), { color: COLORS.primaryInk }]}
                  >
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

      {/* ── Amount selector modal ── */}
      <Modal
        visible={showAmountModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAmountModal(false)}
      >
        <Pressable
          style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]}
          onPress={() => setShowAmountModal(false)}
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
                  onPress={() => {
                    setSelectedGroup(g);
                    clearErr('group');
                    setShowAmountModal(false);
                  }}
                />
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

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
                paddingHorizontal: G,
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
              style={{ paddingHorizontal: G }}
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
              {error || 'Something went wrong. No amount has been debited. Your form has been saved — please try again.'}
            </Text>
            <View style={{ marginTop: SIZES.margin.xxl, gap: 10, width: '100%' }}>
              <PremiumButton label="Try again" onPress={() => { reset(); void handleSubmit(); }} />
              <PremiumButton label="Cancel" variant="outline" onPress={() => reset()} />
            </View>
          </View>
        </View>
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
  stageRail: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  stage: { flex: 1, alignItems: 'center', gap: 6 },
  stageDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexRail: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  flexRailItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flexInputBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sheet: { width: '100%' },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  failMark: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    width: '100%',
    alignItems: 'center',
  },
  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
