// src/screens/scheme/SchemeJoinScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   The enrolment form, restructured from one long scroll into three
//   labelled stages with a step rail in the dark hero: Plan → Details
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
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RazorpayWebCheckout, {
  RazorpayWebCheckoutRef,
} from '../../components/ui/RazorpayWebCheckout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { METAL_LABEL } from '../../types/Scheme/Scheme';
import { useRazorpay } from '../../api/hooks/Razorpay/useRazorpay';
import {
  UserDetails,
  RazorpaySuccessPayment,
} from '../../types/Razorpay/Razorpay';
import { useMemberScheme } from '../../api/hooks/Member/useMemberScheme';
import { MemberSchemeGroup } from '../../types/Member/MemberScheme';
import { memberService } from '../../api/services/memberService';
import { NMData } from '../../types/Member/NMData';
import { useToast } from '../../components/ui/Toast';
import { useAppSelector } from '../../store/hooks';

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

const DRAFT_KEY = 'SCHEME_JOIN_DRAFT';

export default function SchemeJoinScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteProps>();
  const { scheme } = route.params;

  const { status, error, pay, reset } = useRazorpay();
  const rzpWebRef = useRef<RazorpayWebCheckoutRef>(null);
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);

  // API: fetch groups for this scheme (gives AMOUNT, GROUPCODE, CURRENTREGNO)
  const { groups, loading: groupsLoading } = useMemberScheme(scheme.SchemeId);

  const mLabel = METAL_LABEL[scheme.MetalType] ?? scheme.MetalType;
  const isFixed = scheme.FixedIns === 'Y';

  // Metal-specific accent, used to tint the Razorpay checkout exactly as
  // before. Sourced from AppTheme's metal tokens rather than the legacy
  // hardcoded METAL_COLOR map.
  const mColor =
    (
      {
        G: COLORS.metalGold,
        S: COLORS.metalSilver,
        P: COLORS.metalPlatinum,
        D: COLORS.metalDiamond,
      } as Record<string, string>
    )[scheme.MetalType] ?? COLORS.primary;

  // Selected group (FixedIns=Y)
  const [selectedGroup, setSelectedGroup] =
    useState<MemberSchemeGroup | null>(null);
  // Custom amount (FixedIns=N)
  const [customAmount, setCustomAmount] = useState('');

  // Auto-select first group when data loads
  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) setSelectedGroup(groups[0]);
  }, [groups]);

  const effectiveAmount = isFixed
    ? selectedGroup?.AMOUNT ?? 0
    : parseInt(customAmount) || 0;

  // Customer details
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [nominee, setNominee] = useState('');
  const [nomRel, setNomRel] = useState('');
  const [nomMobile, setNomMobile] = useState('');
  const [gender, setGender] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
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

  // ── Auto-populate from logged-in user profile (unchanged) ──────
  useEffect(() => {
    if (!user) return;
    if (user.username && !name) setName(user.username);
    if (user.contactNumber && !mobile) setMobile(user.contactNumber);
    if (user.email && !email) setEmail(user.email);
    if (user.gender && !gender) setGender(user.gender);
    if (user.address1 && !doorStreet) setDoorStreet(user.address1);
    if (user.city && !city) setCity(user.city);
    if (user.state && !stateVal) setStateVal(user.state);
    if (user.pincode && !pincode) setPincode(user.pincode);
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

  // ── AsyncStorage: load draft on mount (unchanged) ──────────────
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return;
      try {
        const d = JSON.parse(raw);
        if (d.name) setName(d.name);
        if (d.mobile) setMobile(d.mobile);
        if (d.email) setEmail(d.email);
        if (d.aadhaar) setAadhaar(d.aadhaar);
        if (d.pan) setPan(d.pan);
        if (d.doorStreet) setDoorStreet(d.doorStreet);
        if (d.pincode) setPincode(d.pincode);
        if (d.area) setArea(d.area);
        if (d.city) setCity(d.city);
        if (d.district) setDistrict(d.district);
        if (d.stateVal) setStateVal(d.stateVal);
        if (d.nominee) setNominee(d.nominee);
        if (d.nomRel) setNomRel(d.nomRel);
        if (d.nomMobile) setNomMobile(d.nomMobile);
        if (d.gender) setGender(d.gender);
        if (d.dobDay) setDobDay(d.dobDay);
        if (d.dobMonth) setDobMonth(d.dobMonth);
        if (d.dobYear) setDobYear(d.dobYear);
        if (d.dobSet) setDobSet(d.dobSet);
      } catch {
        /* ignore corrupt data */
      }
    });
  }, []);

  // ── Pincode → auto-fill area / city / district / state ─────────
  // (logic carried forward verbatim from the concurrent edit)
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

  // ── AsyncStorage: save draft whenever any field changes ────────
  useEffect(() => {
    const draft = {
      name, mobile, email, aadhaar, pan,
      doorStreet, pincode, area, city, district, stateVal,
      nominee, nomRel, nomMobile, gender,
      dobDay, dobMonth, dobYear, dobSet,
    };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    name, mobile, email, aadhaar, pan,
    doorStreet, pincode, area, city, district, stateVal,
    nominee, nomRel, nomMobile, gender,
    dobDay, dobMonth, dobYear, dobSet,
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
    name.trim().length > 1 &&
    isValidMobile(mobile) &&
    isValidEmail(email) &&
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

  const isProcessing = ['creating_order', 'checkout_open', 'verifying'].includes(
    status,
  );
  const showFailed = status === 'failed';

  // ── Build userDetails payload for /verify_payment (unchanged) ──
  const buildUserDetails = (): UserDetails => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // yyyy-MM-dd
    const todayDT = `${todayStr} 00:00:00`;
    const dobFormatted = dobSet
      ? `${String(dobDay).padStart(2, '0')}/${String(dobMonth).padStart(
          2,
          '0',
        )}/${dobYear}`
      : undefined;
    const titleMap: Record<string, string> = {
      Male: 'Mr',
      Female: 'Mrs',
      Other: 'Mx',
    };
    const activeGroup = isFixed ? selectedGroup : (groups[0] ?? null);
    const groupCode = activeGroup?.GROUPCODE ?? '';
    const regNo = activeGroup ? String(activeGroup.REGNO ?? activeGroup.CURRENTREGNO ?? '') : '';

    return {
      newMember: {
        title: titleMap[gender] ?? undefined,
        pName: name.trim() || undefined,
        dob: dobFormatted,
        email: email.trim() || undefined,
        address1: doorStreet.trim() || undefined,
        mobile: mobile.trim() || undefined,
        pinCode: pincode.trim() || undefined,
        city: city.trim() || undefined,
        state: stateVal.trim() || undefined,
        area: area.trim() || undefined,
        nomeni: nominee.trim() || undefined,
        nomineeRelationship: nomRel.trim() || undefined,
        nomineeMobile: nomMobile.trim() || undefined,
        panno: pan.trim().toUpperCase() || undefined,
      },
      createSchemeSummary: {
        schemeId: String(scheme.SchemeId),
        groupCode: groupCode || undefined,
        regNo: regNo || undefined,
        joinDate: todayStr,
        updateTime: todayDT,
        totalIns: String(scheme.Instalment),
      },
      schemeCollectInsert: {
        groupCode: groupCode || undefined,
        regNo: regNo || undefined,
        rDate: todayDT,
        amount: String(effectiveAmount),
        modePay: 'ONLINE',
        installment: '1',
        SchemeId: scheme.SchemeId,
        chqBankCode: 'RAZORPAY',
        // chqCardNo filled by useRazorpay hook with razorpay_payment_id
      },
    };
  };

  // ── Build NMData payload for /api/v1/member/create (unchanged) ──
  // Called only after the Razorpay payment succeeds & signature is verified.
  const buildMemberPayload = (payment: RazorpaySuccessPayment): NMData => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )}`;
    const nowDateTime = `${dateStr} ${pad(now.getHours())}:${pad(
      now.getMinutes(),
    )}:${pad(now.getSeconds())}`;
    // LocalDateTime format (yyyy-MM-ddTHH:mm:ss) — unambiguous for SQL Server.
    const dobFormatted = dobSet
      ? `${dobYear}-${pad(dobMonth)}-${pad(dobDay)}T00:00:00`
      : '';
    const titleMap: Record<string, string> = {
      Male: 'Mr',
      Female: 'Mrs',
      Other: 'Mx',
    };
    const activeGroup = isFixed ? selectedGroup : (groups[0] ?? null);
    const groupCode = activeGroup?.GROUPCODE ?? '';
    const regNo = activeGroup ? String(activeGroup.REGNO ?? activeGroup.CURRENTREGNO ?? '1') : '1';

    return {
      newMember: {
        title: titleMap[gender] || 'Mr',
        initial: (name.trim()[0] || 'K').toUpperCase(),
        pName: name.trim() || 'NA',
        sName: 'NA',
        doorNo: doorStreet.trim() || '',
        address1: doorStreet.trim() || '',
        address2: area.trim() || '',
        area: area.trim() || '',
        city: city.trim() || '',
        state: stateVal.trim() || 'Tamil Nadu',
        country: 'India',
        pinCode: pincode.trim() || '',
        mobile: mobile.trim() || '',
        mobile2: '',
        nomeni: nominee.trim() || 'NA',
        nomineeMobile: nomMobile.trim() || '',
        nomineeRelationship: nomRel.trim() || 'Spouse',
        nomAddr1: doorStreet.trim() || '',
        nomAddr2: '',
        nomCity: city.trim() || '',
        nomState: stateVal.trim() || 'Tamil Nadu',
        nomPincode: pincode.trim() || '',
        nomCountry: 'India',
        idProof: 'Aadhaar',
        idProofNo: aadhaar.trim(),
        aadhaarMasked: aadhaar.trim(),
        panno: pan.trim().toUpperCase(),
        dob: dobFormatted,
        email: email.trim() || '',
        nomineeMobileVerified: false,
        nomineeAadhaarVerified: false,
        upDateTime: nowDateTime,
        userId: '999', // FIXED
        appVer: 'WEB',
        // Omit when empty: '' breaks an insert into a DATE column.
        anniversaryDate: undefined,
      },
      createSchemeSummary: {
        schemeId: String(scheme.SchemeId),
        groupCode,
        regNo,
        joinDate: nowDateTime,
        updateTime: nowDateTime,
        openingDate: nowDateTime,
        userId: '999', // FIXED
        totalIns: String(scheme.Instalment),
      },
      schemeCollectInsert: {
        amount: String(effectiveAmount),
        modePay: '4',
        accCode: '00001', // FIXED
        chqBankCode: '4',
        chqCardNo: payment.razorpay_payment_id, // paymentId
        chqBranch: 'Online',
        chkBank: 'Razorpay',
        chqRtnReason: payment.razorpay_order_id, // orderId
      },
      referralCode: '',
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
    'group', 'amount', 'name', 'mobile', 'email', 'aadhaar', 'pan',
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

  const handleSubmit = async () => {
    // Collect per-field errors
    const fe: Record<string, string> = {};
    if (name.trim().length <= 1) fe.name = 'Enter your full name';
    if (!isValidMobile(mobile)) fe.mobile = 'Enter a valid 10-digit mobile number';
    if (!isValidEmail(email)) fe.email = 'Enter a valid email address';
    if (!dobSet || dobAge < 18) fe.dob = 'Must be 18 years or older';
    if (!isValidAadhaar(aadhaar)) fe.aadhaar = 'Aadhaar must be exactly 12 digits';
    if (!isValidPAN(pan)) fe.pan = 'Invalid PAN format (e.g. ABCDE1234F)';
    if (nominee.trim().length <= 1) fe.nominee = 'Enter nominee name';
    if (nomMobile && !isValidMobile(nomMobile))
      fe.nomMobile = 'Enter a valid 10-digit mobile';
    if (gender === '') fe.gender = 'Select gender';
    if (doorStreet.trim().length <= 3)
      fe.doorStreet = 'Enter door number and street';
    if (pincode.trim().length !== 6) fe.pincode = 'Enter a valid 6-digit pincode';
    if (effectiveAmount <= 0) fe.amount = 'Select or enter amount';
    if (isFixed && !selectedGroup) fe.group = 'Select a group';

    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) {
      toast.error('Please check the form', {
        message:
          fe[FIELD_ORDER.find((k) => fe[k]) ?? ''] ??
          'Some fields need attention.',
        position: 'top',
        duration: 3500,
      });
      scrollToFirstError(fe);
      return;
    }

    const activeGroup = isFixed ? selectedGroup : (groups[0] ?? null);
    const groupCode = activeGroup?.GROUPCODE ?? '';
    const regno = activeGroup ? String(activeGroup.REGNO ?? activeGroup.CURRENTREGNO ?? '') : '';
    const receipt = `join_${scheme.SchemeId}_${mobile}_${Date.now()}`;

    pay(
      {
        AMOUNT: effectiveAmount, // paise
        CURRENCY: 'INR',
        RECEIPT: receipt,
        SCHEMEID: String(scheme.SchemeId),
        GROUPCODE: groupCode,
        REGNO: regno,
        INSTALLMENTNUMBER: 1,
      },
      {
        _checkoutFn: (opts: any) => rzpWebRef.current!.open(opts),
        name: 'Rangas DigiGold',
        description: `Join ${scheme.schemeName} – Instalment 1`,
        image: 'https://scheme.rangasjewellery.com/logo.png',
        prefill: { name, email, contact: mobile },
        theme: { color: mColor },
      },
      buildUserDetails(),
      // After the payment is verified, create the member via /api/v1/member/create.
      async (payment) => {
        const payload = buildMemberPayload(payment);
        console.log('=== /api/v1/member/create REQUEST BODY ===');
        console.log(JSON.stringify(payload, null, 2));
        console.log('==========================================');
        await memberService.createMember(payload);
      },
    );
  };

  // On payment success: clear draft, redirect straight to Home, and show an
  // auto-dismissing popup there (no button needed).
  useEffect(() => {
    if (status !== 'success') return;
    AsyncStorage.removeItem(DRAFT_KEY);
    toast.success('Successfully Joined! 🎉', {
      message: `You enrolled in ${scheme.schemeName}.`,
      position: 'top',
      duration: 4000,
      closable: false,
    });
    reset();
    navigation.navigate('Main');
  }, [status]);

  // ── Presentation-only: stage completion for the rail ──
  const stages = useMemo(() => {
    const planOk = effectiveAmount > 0 && (!isFixed || !!selectedGroup);
    const detailsOk =
      name.trim().length > 1 &&
      isValidMobile(mobile) &&
      isValidEmail(email) &&
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
    effectiveAmount, isFixed, selectedGroup, name, mobile, email, dobSet,
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

  const submitLabel = isProcessing
    ? status === 'creating_order'
      ? 'Creating order…'
      : status === 'checkout_open'
      ? 'Processing…'
      : 'Verifying…'
    : 'Confirm & pay';

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
            caption={`${scheme.schemeName} · ${scheme.Instalment} instalments · ${mLabel}`}
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
                        color={COLORS.heroCanvas}
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
            label="Monthly instalment"
            value={effectiveAmount > 0 ? money(effectiveAmount) : '—'}
            note={`${scheme.Instalment} instalments · ${mLabel}`}
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
                  : 'Enter the amount you want to save each month'
              }
            />

            <View
              ref={registerField(isFixed ? 'group' : 'amount')}
              collapsable={false}
              style={{ marginTop: SIZES.margin.lg, gap: 10 }}
            >
              {isFixed ? (
                groupsLoading ? (
                  <Text
                    style={[asText(FONTS.micro), { color: COLORS.inkTertiary }]}
                  >
                    Loading available amounts…
                  </Text>
                ) : groups.length === 0 ? (
                  <StatusChip
                    tone="warning"
                    icon="alert-circle-outline"
                    label="No instalment groups available"
                  />
                ) : (
                  groups.map((g, i) => (
                    <PaymentTile
                      key={`${g.GROUPCODE}-${i}`}
                      icon="cash-outline"
                      title={`${money(g.AMOUNT)} / month`}
                      subtitle={`Group ${g.GROUPCODE} · Reg no. ${g.REGNO ?? g.CURRENTREGNO}`}
                      selected={selectedGroup?.GROUPCODE === g.GROUPCODE}
                      tag={i === 0 ? 'POPULAR' : undefined}
                      onPress={() => {
                        setSelectedGroup(g);
                        clearErr('group');
                      }}
                    />
                  ))
                )
              ) : (
                <FormField
                  label="Monthly amount (₹)"
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
            <SectionHeading
              eyebrow="Step 2"
              title="Your details"
              caption="Used for KYC verification — please be accurate"
            />

            <View style={{ marginTop: SIZES.margin.lg, gap: 18 }}>
              <FormField
                ref={registerField('name')}
                label="Full name"
                indicator="required"
                icon="person-outline"
                value={name}
                placeholder="As printed on your ID"
                onChangeText={(v) => {
                  setName(v);
                  clearErr('name');
                }}
                error={fieldErrors.name}
                autoCapitalize="words"
              />

              <FormField
                ref={registerField('mobile')}
                label="Mobile number"
                indicator="required"
                icon="call-outline"
                value={mobile}
                placeholder="10-digit mobile"
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={(v) => {
                  setMobile(v.replace(/[^0-9]/g, ''));
                  clearErr('mobile');
                }}
                error={fieldErrors.mobile}
              />

              <FormField
                ref={registerField('email')}
                label="Email address"
                indicator="required"
                icon="mail-outline"
                value={email}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(v) => {
                  setEmail(v);
                  clearErr('email');
                }}
                error={fieldErrors.email}
              />

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
              rows={[
                { label: 'Scheme', value: scheme.schemeName },
                { label: 'Metal', value: mLabel },
                { label: 'Instalments', value: String(scheme.Instalment) },
                ...(isFixed && selectedGroup
                  ? [
                      {
                        label: 'Group',
                        value: String(selectedGroup.GROUPCODE),
                      },
                    ]
                  : []),
                {
                  label: 'Paying now (instalment 1)',
                  value: effectiveAmount > 0 ? money(effectiveAmount) : '—',
                  total: true,
                },
              ]}
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
          animationType="slide"
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
                  borderTopLeftRadius: SIZES.radius.sheet,
                  borderTopRightRadius: SIZES.radius.sheet,
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
                    style={[asText(FONTS.microBold), { color: COLORS.primary }]}
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

      {/* ── Pincode area selector ── */}
      <Modal
        visible={showPincodeModal}
        transparent
        animationType="slide"
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
                borderTopLeftRadius: SIZES.radius.sheet,
                borderTopRightRadius: SIZES.radius.sheet,
                maxHeight: '65%',
                paddingBottom: SIZES.padding.xxl,
              },
            ]}
          >
            <View
              style={[s.grabber, { backgroundColor: COLORS.hairlineBold, marginTop: 10 }]}
            />

            <View
              style={{
                paddingHorizontal: G,
                paddingTop: SIZES.padding.xl,
                paddingBottom: SIZES.padding.md,
              }}
            >
              <Text style={[asText(FONTS.eyebrow), { color: COLORS.primary }]}>
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

      <RazorpayWebCheckout ref={rzpWebRef} />

      {/* ── Failure sheet ── */}
      <Modal visible={showFailed} transparent animationType="fade">
        <View style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]}>
          <View
            style={[
              s.sheet,
              {
                backgroundColor: COLORS.canvasElevated,
                borderTopLeftRadius: SIZES.radius.sheet,
                borderTopRightRadius: SIZES.radius.sheet,
                paddingHorizontal: G,
                paddingTop: SIZES.padding.xxl,
                paddingBottom: SIZES.padding.xxxl,
              },
            ]}
          >
            <View style={[s.grabber, { backgroundColor: COLORS.hairlineBold }]} />

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
              <Ionicons name="close" size={SIZES.icon.xl} color={COLORS.error} />
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
                'Something went wrong. No amount has been debited. Your form has been saved — please try again.'}
            </Text>

            <View style={{ marginTop: SIZES.margin.xxl, gap: 10 }}>
              <PremiumButton
                label="Try again"
                onPress={() => {
                  reset();
                  void handleSubmit();
                }}
              />
              <PremiumButton
                label="Cancel"
                variant="outline"
                onPress={() => reset()}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
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
  poRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
