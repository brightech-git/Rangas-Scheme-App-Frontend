import React, { useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../components/ui/Toast';
import { memberService } from '../../api/services/memberService';
import { useAppSelector } from '../../store/hooks';
import { kycStorage } from '../../utils/kycStorage';
import {
  KycFormData,
  EMPTY_KYC_FORM,
  ID_PROOF_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  NOMINEE_RELATIONSHIP_OPTIONS,
} from '../../types/Kyc/Kyc';
import SelectField from '../../components/ui/appcomponents/SelectField';
import DateField from '../../components/ui/appcomponents/DateField';

import {
  PageHeader,
  BottomActionBar,
  SectionHeading,
  FormField,
  asText,
} from '../../components/ui/premium';

type RouteProps = RouteProp<RootStackParamList, 'KycForm'>;
type NavProps = NativeStackNavigationProp<RootStackParamList, 'KycForm'>;

const maskAadhaar = (idProof: string, idProofNo: string) => {
  if (idProof !== 'Aadhaar') return '';
  const digits = idProofNo.replace(/\D/g, '');
  if (digits.length < 4) return '';
  return `XXXX-XXXX-${digits.slice(-4)}`;
};

const ERROR_ORDER = [
  'dob', 'pinCode', 'city', 'state', 'address1',
  'idProof', 'idProofNo', 'nomeni', 'nomineeRelationship', 'nomineeMobile',
] as const;

export default function KycFormScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteProps>();
  const { ppData } = route.params;
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);

  const pi = ppData.personalInfo;
  const personalId = pi?.personalId ?? '';

  const [form, setForm] = useState<KycFormData>({
    ...EMPTY_KYC_FORM,
    address1: pi?.address1 ?? '',
    area:     pi?.area     ?? '',
    city:     pi?.city     ?? '',
    state:    pi?.state    ?? '',
    country:  pi?.country  || 'India',
    pinCode:  pi?.pinCode  ?? '',
    email:    user?.email  ?? '',
  });
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [postOffices, setPostOffices] = useState<{ Name: string; District: string; State: string; Country: string }[]>([]);
  const [pinModal, setPinModal]   = useState(false);

  const scrollRef        = useRef<ScrollView>(null);
  const dobRef           = useRef<View>(null);
  const pinCodeRef       = useRef<View>(null);
  const cityRef          = useRef<View>(null);
  const stateRef         = useRef<View>(null);
  const address1Ref      = useRef<View>(null);
  const idProofRef       = useRef<View>(null);
  const idProofNoRef     = useRef<View>(null);
  const nomeniRef        = useRef<View>(null);
  const nomineeRelRef    = useRef<View>(null);
  const nomineeMobileRef = useRef<View>(null);

  const fieldRefMap: Record<string, React.RefObject<View | null>> = {
    dob: dobRef, pinCode: pinCodeRef, city: cityRef, state: stateRef,
    address1: address1Ref, idProof: idProofRef, idProofNo: idProofNoRef,
    nomeni: nomeniRef, nomineeRelationship: nomineeRelRef, nomineeMobile: nomineeMobileRef,
  };

  const scrollToFirstError = (e: Record<string, string>) => {
    const firstKey = ERROR_ORDER.find((k) => e[k]);
    if (!firstKey) return;
    fieldRefMap[firstKey]?.current?.measureLayout(
      scrollRef.current as any,
      (_x, y) => scrollRef.current?.scrollTo({ y: y - 24, animated: true }),
      () => {},
    );
  };

  const handlePinCode = async (pin: string) => {
    const cleaned = pin.replace(/[^0-9]/g, '');
    set('pinCode', cleaned);
    if (cleaned.length !== 6) return;
    setPinLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
      const json = await res.json();
      const offices: any[] = json?.[0]?.PostOffice ?? [];
      if (offices.length === 1) {
        const po = offices[0];
        setForm((p) => ({ ...p, area: po.Name, city: po.District, state: po.State, country: po.Country || 'India' }));
      } else if (offices.length > 1) {
        setPostOffices(offices);
        setPinModal(true);
      }
    } catch (_) {}
    finally { setPinLoading(false); }
  };

  const selectPostOffice = (po: { Name: string; District: string; State: string; Country: string }) => {
    setForm((p) => ({ ...p, area: po.Name, city: po.District, state: po.State, country: po.Country || 'India' }));
    setPinModal(false);
  };

  const set = <K extends keyof KycFormData>(key: K, value: KycFormData[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => { const n = { ...p }; delete n[key as string]; return n; });
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.dob)                                         e.dob                 = 'Select date of birth';
    if (!/^\d{6}$/.test(form.pinCode.trim()))             e.pinCode             = 'Enter a valid 6-digit pin code';
    if (!form.city.trim())                                 e.city                = 'Enter city';
    if (!form.state.trim())                                e.state               = 'Enter state';
    if (!form.address1.trim())                             e.address1            = 'Enter address';
    if (!form.idProof)                                     e.idProof             = 'Select an ID proof';
    if (!form.idProofNo.trim())                            e.idProofNo           = 'Enter ID proof number';
    if (!form.nomeni.trim())                               e.nomeni              = 'Enter nominee name';
    if (!form.nomineeRelationship)                         e.nomineeRelationship = 'Select relationship';
    if (!form.nomineeMobile.trim())                        e.nomineeMobile       = 'Enter nominee mobile';
    else if (!/^\d{10}$/.test(form.nomineeMobile.trim())) e.nomineeMobile       = 'Enter a valid 10-digit number';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) { scrollToFirstError(e); return; }
    if (!personalId) {
      toast.error('Could not identify member profile', { position: 'top', duration: 3500 });
      return;
    }
    setSaving(true);
    const payload: KycFormData = {
      ...form,
      aadhaarMasked:          maskAadhaar(form.idProof, form.idProofNo),
      nomineeMobileVerified:  false,
      nomineeAadhaarVerified: false,
    };

    const apiPayload = {
      doorNo:              payload.doorNo,
      address1:            payload.address1,
      area:                payload.area,
      city:                payload.city,
      state:               payload.state,
      country:             payload.country,
      pinCode:             payload.pinCode,
      email:               payload.email,
      dob:                 payload.dob,
      maritalStatus:       payload.maritalStatus,
      anniversaryDate:     payload.anniversaryDate,
      idProof:             payload.idProof,
      idProofNo:           payload.idProofNo,
      aadhaarMasked:       payload.aadhaarMasked,
      nomeni:              payload.nomeni,
      nomineeMobile:       payload.nomineeMobile,
      nomineeRelationship: payload.nomineeRelationship,
    };

    Promise.all([
      kycStorage.saveKycData(personalId, payload),
      memberService.updateMemberDetails(personalId, apiPayload),
    ])
      .then(() => {
        toast.success('KYC details saved', { position: 'top', duration: 2500 });
        navigation.goBack();
      })
      .catch(() => toast.error('Could not save KYC details', { position: 'top', duration: 3500 }))
      .finally(() => setSaving(false));
  };

  const G = SIZES.layout.gutter;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.heroCanvas }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.heroCanvas} />

      {/* Pincode locality picker modal */}
      <Modal visible={pinModal} transparent animationType="fade" onRequestClose={() => setPinModal(false)}>
        <Pressable
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.blackOpacity60 }}
          onPress={() => setPinModal(false)}
        >
          <Pressable style={{ width: '100%', backgroundColor: COLORS.canvasElevated, borderRadius: SIZES.radius.sheet, overflow: 'hidden', maxHeight: '70%' }}>
            <View style={{ paddingHorizontal: G, paddingTop: SIZES.padding.xl, paddingBottom: 4 }}>
              <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary }]}>Select your locality</Text>
            </View>
            <FlatList
              data={postOffices}
              keyExtractor={(_, i) => String(i)}
              style={{ marginTop: SIZES.margin.md }}
              contentContainerStyle={{ paddingHorizontal: G, paddingBottom: SIZES.padding.xl }}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => selectPostOffice(item)}
                  style={({ pressed }) => ({
                    paddingVertical: SIZES.padding.lg,
                    borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                    borderTopColor: COLORS.hairline,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text style={[asText(FONTS.microBold), { color: COLORS.inkPrimary }]}>{item.Name}</Text>
                  <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, marginTop: 2 }]}>{item.District}, {item.State}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Hero header — sits outside KeyboardAvoidingView so it never moves */}
      <PageHeader
        collapsed
        eyebrow="Verification"
        title="Complete your KYC"
        bleedBottom={moderateScale(14)}
        
      />

      {/* KeyboardAvoidingView wraps only the scrollable body + footer */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, backgroundColor: COLORS.canvas }}
            contentContainerStyle={{ paddingHorizontal: G, paddingBottom: moderateScale(120) }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Body card pulled up over hero */}
            <View style={{
              backgroundColor: COLORS.canvas,
              marginTop: -moderateScale(24),
              borderTopLeftRadius: SIZES.radius.sheet,
              borderTopRightRadius: SIZES.radius.sheet,
            }}>

              {/* Personal details */}
              <View style={{ marginTop: 36 }}>
                <SectionHeading eyebrow="Step 1" title="Personal details" />
                <View style={{ marginTop: SIZES.margin.lg, gap: 4 }}>
                  <View ref={dobRef}>
                    <DateField
                      label="Date of birth"
                      indicator="required"
                      value={form.dob}
                      onChange={(v) => set('dob', v)}
                      maximumDate={new Date()}
                      error={errors.dob}
                    />
                  </View>
                  <SelectField
                    label="Marital status"
                    indicator="optional"
                    icon="heart-outline"
                    value={form.maritalStatus}
                    options={MARITAL_STATUS_OPTIONS}
                    onSelect={(v) => set('maritalStatus', v)}
                  />
                  {form.maritalStatus === 'Married' && (
                    <DateField
                      label="Anniversary date"
                      indicator="optional"
                      value={form.anniversaryDate}
                      onChange={(v) => set('anniversaryDate', v)}
                      maximumDate={new Date()}
                    />
                  )}
                  <FormField
                    label="Email"
                    indicator="optional"
                    icon="mail-outline"
                    value={form.email}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={(v) => set('email', v)}
                    error={errors.email}
                  />
                </View>
              </View>

              {/* Address */}
              <View style={{ marginTop: SIZES.layout.section }}>
                <SectionHeading eyebrow="Step 2" title="Address" />
                <View style={{ marginTop: SIZES.margin.lg, gap: 4 }}>
                  <FormField
                    ref={pinCodeRef}
                    label="Pin code"
                    indicator="required"
                    icon="location-outline"
                    value={form.pinCode}
                    placeholder="6-digit pin code"
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={handlePinCode}
                    error={errors.pinCode}
                    badge={pinLoading ? 'Searching…' : undefined}
                  />
                  <FormField label="Area" indicator="optional" value={form.area} placeholder="Auto-filled" onChangeText={(v) => set('area', v)} />
                  <FormField ref={cityRef} label="City" indicator="required" value={form.city} placeholder="Auto-filled" onChangeText={(v) => set('city', v)} error={errors.city} />
                  <FormField ref={stateRef} label="State" indicator="required" value={form.state} placeholder="Auto-filled" onChangeText={(v) => set('state', v)} error={errors.state} />
                  <FormField label="Country" indicator="optional" value={form.country} placeholder="India" onChangeText={(v) => set('country', v)} />
                  <FormField label="Door No." indicator="optional" icon="home-outline" value={form.doorNo} placeholder="e.g. 12A" onChangeText={(v) => set('doorNo', v)} />
                  <FormField ref={address1Ref} label="Address line 1" indicator="required" icon="pencil-outline" value={form.address1} placeholder="Street, area" onChangeText={(v) => set('address1', v)} error={errors.address1} />
                </View>
              </View>

              {/* Identity */}
              <View style={{ marginTop: SIZES.layout.section }}>
                <SectionHeading eyebrow="Step 3" title="Identity proof" />
                <View style={{ marginTop: SIZES.margin.lg, gap: 4 }}>
                  <View ref={idProofRef}>
                    <SelectField
                      label="ID proof"
                      indicator="required"
                      icon="card-outline"
                      value={form.idProof}
                      options={ID_PROOF_OPTIONS}
                      onSelect={(v) => set('idProof', v)}
                      error={errors.idProof}
                    />
                  </View>
                  <FormField
                    ref={idProofNoRef}
                    label="ID proof number"
                    indicator="required"
                    icon="finger-print-outline"
                    value={form.idProofNo}
                    placeholder="Enter ID number"
                    onChangeText={(v) => set('idProofNo', v)}
                    error={errors.idProofNo}
                  />
                </View>
              </View>

              {/* Nominee */}
              <View style={{ marginTop: SIZES.layout.section }}>
                <SectionHeading eyebrow="Step 4" title="Nominee details" caption="Who should receive this scheme in your absence" />
                <View style={{ marginTop: SIZES.margin.lg, gap: 4 }}>
                  <FormField ref={nomeniRef} label="Nominee name" indicator="required" icon="person-outline" value={form.nomeni} placeholder="e.g. Priya Kumar" onChangeText={(v) => set('nomeni', v)} error={errors.nomeni} />
                  <View ref={nomineeRelRef}>
                    <SelectField
                      label="Relationship"
                      indicator="required"
                      icon="people-outline"
                      value={form.nomineeRelationship}
                      options={NOMINEE_RELATIONSHIP_OPTIONS}
                      onSelect={(v) => set('nomineeRelationship', v)}
                      error={errors.nomineeRelationship}
                    />
                  </View>
                  <FormField
                    ref={nomineeMobileRef}
                    label="Nominee mobile"
                    indicator="required"
                    icon="call-outline"
                    value={form.nomineeMobile}
                    placeholder="10-digit mobile number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    onChangeText={(v) => set('nomineeMobile', v.replace(/[^0-9]/g, ''))}
                    error={errors.nomineeMobile}
                  />
                </View>
              </View>

            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Pinned footer */}
        <BottomActionBar
          label="Status"
          value="KYC pending"
          note="Save your details to unlock payments"
          actionLabel={saving ? 'Saving…' : 'Save & continue'}
          onAction={handleSubmit}
          loading={saving}
          disabled={saving}
        />
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: COLORS.canvas }} />
      </KeyboardAvoidingView>
    </View>
  );
}
