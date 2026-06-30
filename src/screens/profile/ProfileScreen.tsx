// src/screens/profile/ProfileScreen.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Modal,
  KeyboardAvoidingView, Platform, ScrollView, TextInput, Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser, setUser } from '../../store/authSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useUserProfile } from '../../api/hooks/UserProfile/useUserProfile';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import { getPincodeDetails } from '../../api/services/pinCodeService';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';

// ── DOB / gender helpers ──────────────────────────────────────────
const GENDER_OPTIONS = [
  { label: 'Male',   value: 'Male'   },
  { label: 'Female', value: 'Female' },
  { label: 'Other',  value: 'Other'  },
];
const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtDobISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseDob = (s?: string): Date | null => {
  if (!s) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const dmy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(s);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

import ScreenWrapper from '../../components/ui/appcomponents/ScreenWrapper';
import AppHeader     from '../../components/ui/appcomponents/AppHeader';
import AppAvatar     from '../../components/ui/appcomponents/AppAvatar';
import AppCard       from '../../components/ui/appcomponents/AppCard';
import AppText       from '../../components/ui/appcomponents/AppText';
import AppButton     from '../../components/ui/appcomponents/AppButton';
import AppDivider    from '../../components/ui/appcomponents/AppDivider';
import AppInput      from '../../components/ui/appcomponents/AppInput';
import CustomAlert   from '../../components/ui/CustomAlert';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Helpers ───────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  const { COLORS } = useTheme();
  return (
    <View style={[styles.sectionHead, { borderBottomColor: COLORS.border }]}>
      <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.primaryPale }]}>
        <Ionicons name={icon as any} size={14} color={COLORS.primary} />
      </View>
      <AppText variant="label" style={{ marginLeft: 10, letterSpacing: 0.4 }}>{title}</AppText>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  const { COLORS } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.iconBox, { backgroundColor: COLORS.primaryPale }]}>
        <Ionicons name={icon as any} size={14} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color={COLORS.textTertiary}>{label}</AppText>
        <AppText variant="bodyMedium" style={{ marginTop: 1 }}>{value || '—'}</AppText>
      </View>
    </View>
  );
}

function InfoRowHalf({ icon, label, value }: { icon: string; label: string; value?: string }) {
  const { COLORS } = useTheme();
  return (
    <View style={[styles.infoRow, { flex: 1 }]}>
      <View style={[styles.iconBox, { backgroundColor: COLORS.primaryPale }]}>
        <Ionicons name={icon as any} size={14} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color={COLORS.textTertiary}>{label}</AppText>
        <AppText variant="bodyMedium" style={{ marginTop: 1 }}>{value || '—'}</AppText>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, badge, onPress, danger = false }: {
  icon: string; label: string; badge?: string; onPress: () => void; danger?: boolean;
}) {
  const { COLORS } = useTheme();
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: danger ? COLORS.error + '18' : COLORS.primaryPale }]}>
        <Ionicons name={icon as any} size={14} color={danger ? COLORS.error : COLORS.primary} />
      </View>
      <AppText variant="bodyMedium" style={{ flex: 1, color: danger ? COLORS.error : COLORS.textPrimary }}>
        {label}
      </AppText>
      {badge && (
        <View style={[styles.actionBadge, { backgroundColor: COLORS.primary + '18' }]}>
          <AppText variant="caption" color={COLORS.primary} style={{ fontWeight: '600' }}>{badge}</AppText>
        </View>
      )}
      <Ionicons name="chevron-forward" size={15} color={COLORS.textTertiary} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────
// Self-contained with own local TextInput state to prevent blink
function EditPersonalModal({ visible, initial, onClose, onSave, saving }: {
  visible: boolean;
  initial: { username: string; email: string; gender: string; dateOfBirth: string };
  onClose: () => void;
  onSave: (data: { username: string; email: string; gender: string; dateOfBirth: string }) => void;
  saving: boolean;
}) {
  const { COLORS, FONTS, SIZES } = useTheme();
  const [username, setUsername]       = useState(initial.username);
  const [email, setEmail]             = useState(initial.email);
  const [gender, setGender]           = useState(initial.gender);
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [showDob, setShowDob]         = useState(false);
  const [tempDob, setTempDob]         = useState<Date>(new Date(2000, 0, 1));

  useEffect(() => {
    if (visible) {
      setUsername(initial.username);
      setEmail(initial.email);
      setGender(initial.gender);
      setDateOfBirth(initial.dateOfBirth);
      setShowDob(false);
    }
  }, [visible]);

  const openDob = () => {
    setTempDob(parseDob(dateOfBirth) ?? new Date(2000, 0, 1));
    setShowDob(true);
  };
  const onDobChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDob(false);
      if (event?.type === 'set' && selected) setDateOfBirth(fmtDobISO(selected));
    } else if (selected) {
      setTempDob(selected);
      setDateOfBirth(fmtDobISO(selected));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKAV}>
          <View style={[styles.modalSheet, { backgroundColor: COLORS.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: COLORS.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
              <AppText variant="h5">Edit Personal Info</AppText>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: SIZES.padding.md, gap: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Field label="Full Name" icon="person-outline" value={username} onChangeText={setUsername} />
              <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" />

              {/* Gender — dropdown */}
              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontFamily: FONTS.family.medium, fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginBottom: 6 }}>
                  Gender
                </Text>
                <View style={[styles.fieldRow, { borderColor: COLORS.border, backgroundColor: COLORS.inputBackground ?? COLORS.card }]}>
                  <Ionicons name="male-female-outline" size={17} color={COLORS.textTertiary} style={{ marginRight: 10 }} />
                  <Dropdown
                    style={{ flex: 1 }}
                    data={GENDER_OPTIONS}
                    labelField="label"
                    valueField="value"
                    placeholder="Select gender"
                    value={gender}
                    onChange={(item) => setGender(item.value)}
                    placeholderStyle={{ color: COLORS.textTertiary, fontFamily: FONTS.family.regular, fontSize: SIZES.font.md }}
                    selectedTextStyle={{ color: COLORS.textPrimary, fontFamily: FONTS.family.regular, fontSize: SIZES.font.md }}
                    itemTextStyle={{ color: COLORS.textPrimary, fontFamily: FONTS.family.regular, fontSize: SIZES.font.md }}
                  />
                </View>
              </View>

              {/* Date of Birth — native picker */}
              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontFamily: FONTS.family.medium, fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginBottom: 6 }}>
                  Date of Birth
                </Text>
                <TouchableOpacity
                  style={[styles.fieldRow, { borderColor: COLORS.border, backgroundColor: COLORS.inputBackground ?? COLORS.card }]}
                  onPress={openDob}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={17} color={COLORS.textTertiary} style={{ marginRight: 10 }} />
                  <Text style={{ flex: 1, fontFamily: FONTS.family.regular, fontSize: SIZES.font.md, color: dateOfBirth ? COLORS.textPrimary : COLORS.textTertiary }}>
                    {dateOfBirth || 'Select date of birth'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>

                {showDob && (
                  <DateTimePicker
                    value={tempDob}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={onDobChange}
                  />
                )}
                {Platform.OS === 'ios' && showDob && (
                  <AppButton label="Done" variant="outline" onPress={() => setShowDob(false)} />
                )}
              </View>

              <View style={{ marginTop: 8, gap: 10 }}>
                <AppButton label="Save Changes" onPress={() => onSave({ username, email, gender, dateOfBirth })} loading={saving} />
                <AppButton label="Cancel" variant="outline" onPress={onClose} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function EditAddressModal({ visible, initial, onClose, onSave, saving }: {
  visible: boolean;
  initial: { address1: string; address2: string; city: string; state: string; pincode: string; country: string };
  onClose: () => void;
  onSave: (data: { address1: string; address2: string; city: string; state: string; pincode: string; country: string }) => void;
  saving: boolean;
}) {
  const { COLORS, FONTS, SIZES } = useTheme();
  const [address1, setAddress1]     = useState(initial.address1);
  const [address2, setAddress2]     = useState(initial.address2);
  const [city, setCity]             = useState(initial.city);
  const [state, setState]           = useState(initial.state);
  const [pincode, setPincode]       = useState(initial.pincode);
  const [country, setCountry]       = useState(initial.country);
  const [areas, setAreas]           = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState('');

  useEffect(() => {
    if (visible) {
      setAddress1(initial.address1);
      setAddress2(initial.address2);
      setCity(initial.city);
      setState(initial.state);
      setPincode(initial.pincode);
      setCountry(initial.country);
      setAreas([]);
      setSelectedArea('');
    }
  }, [visible]);

  const handlePincodeChange = async (value: string) => {
    setPincode(value);
    setAreas([]);
    setSelectedArea('');
    setCity('');
    setState('');
    setCountry('');
    if (value.length === 6) {
      try {
        const data = await getPincodeDetails(value);
        if (data?.Status === 'Success' && data?.PostOffice?.length > 0) {
          setAreas(data.PostOffice);
          // Auto-select first area
          const first = data.PostOffice[0];
          setSelectedArea(first.Name);
          setCity(first.Name);
          setState(first.State);
          setCountry(first.Country);
        }
      } catch (e) { console.warn('[Pincode]', e); }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKAV}>
          <View style={[styles.modalSheet, { backgroundColor: COLORS.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: COLORS.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
              <AppText variant="h5">Edit Address</AppText>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: SIZES.padding.md, gap: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Field label="Address Line 1" icon="home-outline" value={address1} onChangeText={setAddress1} />
              <Field label="Address Line 2" icon="home-outline" value={address2} onChangeText={setAddress2} />
              <Field label="Pincode" icon="mail-outline" value={pincode} onChangeText={handlePincodeChange} keyboardType="numeric" />

              {/* Area dropdown — only shown when pincode returns multiple offices */}
              {areas.length > 1 && (
                <View style={{ marginBottom: 4 }}>
                  <Text style={{ fontFamily: FONTS.family.medium, fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginBottom: 6 }}>
                    Select Area
                  </Text>
                  <Dropdown
                    data={areas}
                    labelField="Name"
                    valueField="Name"
                    value={selectedArea}
                    placeholder="Select area / post office"
                    placeholderStyle={{ fontFamily: FONTS.family.regular, fontSize: SIZES.font.md, color: COLORS.textTertiary }}
                    selectedTextStyle={{ fontFamily: FONTS.family.regular, fontSize: SIZES.font.md, color: COLORS.textPrimary }}
                    style={[styles.fieldRow, { borderColor: COLORS.border, backgroundColor: COLORS.inputBackground ?? COLORS.card }]}
                    containerStyle={{ borderRadius: 12, borderColor: COLORS.border }}
                    itemTextStyle={{ fontFamily: FONTS.family.regular, fontSize: SIZES.font.md, color: COLORS.textPrimary }}
                    onChange={(item) => {
                      setSelectedArea(item.Name);
                      setCity(item.Name);
                      setState(item.State);
                      setCountry(item.Country);
                    }}
                  />
                </View>
              )}

              <Field label="City"    icon="business-outline" value={city}    onChangeText={setCity}    editable={false} />
              <Field label="State"   icon="map-outline"      value={state}   onChangeText={setState}   editable={false} />
              <Field label="Country" icon="globe-outline"    value={country} onChangeText={setCountry} editable={false} />

              <View style={{ marginTop: 8, gap: 10 }}>
                <AppButton label="Save Changes" onPress={() => onSave({ address1, address2, city, state, pincode, country })} loading={saving} />
                <AppButton label="Cancel" variant="outline" onPress={onClose} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Field({ label, icon, value, onChangeText, keyboardType, placeholder, editable = true }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any; placeholder?: string; editable?: boolean;
}) {
  const { COLORS, FONTS, SIZES } = useTheme();
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={{ fontFamily: FONTS.family.medium, fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginBottom: 6 }}>
        {label}
      </Text>
      <View style={[styles.fieldRow, {
        borderColor: COLORS.border,
        backgroundColor: editable ? (COLORS.inputBackground ?? COLORS.card) : COLORS.border + '40',
      }]}>
        <Ionicons name={icon as any} size={17} color={COLORS.textTertiary} style={{ marginRight: 10 }} />
        <TextInput
          value={value}
          editable={editable}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder ?? label}
          placeholderTextColor={COLORS.textTertiary}
          autoCapitalize="none"
          style={{
            flex: 1,
            fontFamily: FONTS.family.regular,
            fontSize: SIZES.font.md,
            color: editable ? COLORS.textPrimary : COLORS.textSecondary,
            paddingVertical: 0,
          }}
        />
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function ProfileScreen() {
  const { COLORS, SIZES } = useTheme();
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const reduxUser  = useAppSelector((s) => s.auth.user);

  const { fetchUser, updateUser, updatePhoto, deletePhoto, deleteUser, loading } = useUserProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editAddress, setEditAddress]   = useState(false);

  // Alert state
  const [alert, setAlert] = useState<{
    visible: boolean; title: string; message: string;
    onConfirm?: () => void; danger?: boolean;
  }>({ visible: false, title: '', message: '' });

  const userId    = reduxUser?.id;
  const userIdStr = String(userId ?? '');

  // ── Load profile ───────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!userId) return;
    const data = await fetchUser(userId);
    if (data) {
      const merged = { ...reduxUser, ...data };
      dispatch(setUser(merged));
      await AsyncStorageHelper.saveUserSession(merged);
    }
  }, [userId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  // ── Save personal info ─────────────────────────────────────────
  const savePersonalInfo = async (data: { username: string; email: string; gender: string; dateOfBirth: string }) => {
    if (!userId) return;
    try {
      await updateUser(userId, data);
      setEditPersonal(false);
      await loadProfile();
      showAlert('Success', 'Personal info updated successfully.', () => {});
    } catch (e: any) {
      showAlert('Update Failed', e?.response?.data?.message ?? e?.message ?? 'Failed to update personal info.', () => {});
    }
  };

  // ── Save address ───────────────────────────────────────────────
  const saveAddress = async (data: { address1: string; address2: string; city: string; state: string; pincode: string; country: string }) => {
    if (!userId) return;
    try {
      await updateUser(userId, data);
      setEditAddress(false);
      await loadProfile();
      showAlert('Success', 'Address updated successfully.', () => {});
    } catch (e: any) {
      showAlert('Update Failed', e?.response?.data?.message ?? e?.message ?? 'Failed to update address.', () => {});
    }
  };

  // ── Photo ──────────────────────────────────────────────────────
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const ext   = asset.uri.split('.').pop() ?? 'jpg';
    try {
      const photoPath = await updatePhoto(userIdStr, {
        uri: asset.uri, name: `photo_${userId}.${ext}`, type: `image/${ext}`,
      });
      if (photoPath && typeof photoPath === 'string') {
        const updated = { ...reduxUser, picture: photoPath };
        dispatch(setUser(updated));
        await AsyncStorageHelper.saveUserSession(updated);
      }
    } catch (e) { console.warn('[ProfileScreen] Upload failed:', e); }
  };

  const showAlert = (title: string, message: string, onConfirm: () => void, danger = false) =>
    setAlert({ visible: true, title, message, onConfirm, danger });
  const hideAlert = () => setAlert(a => ({ ...a, visible: false }));

  const tierMap: Record<string, string> = { Silver: '🥈', Gold: '🥇', Platinum: '💎' };

  return (
    <ScreenWrapper
      scroll
      statusBarStyle="light-content"
      statusBarBg={COLORS.primary}
      edges={[]}
      onRefresh={onRefresh}
      refreshing={refreshing}
      paddingHorizontal={0}
      paddingTop={0}
      paddingBottom={40}
      header={<AppHeader title="My Profile" variant="primary" showBack onBackPress={() => navigation.navigate('Home' as any)} />}
    >
      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primary + 'CC']}
        style={styles.heroBanner}
      >
        <View style={styles.heroTop}>
          <AppAvatar
            source={reduxUser?.picture ? { uri: reduxUser.picture } : null}
            name={reduxUser?.username ?? ''}
            size="xl"
            showEdit
            onEditPress={handlePickPhoto}
          />
          <View style={styles.heroInfo}>
            <AppText variant="h4" color="#fff">
              {reduxUser?.username || 'User'}
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.75)" style={{ marginTop: 2 }}>
              {reduxUser?.contactNumber || '—'}
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.75)">
              {reduxUser?.email || '—'}
            </AppText>
            {/* {reduxUser?.referralCode && (
              <View style={[styles.tierBadge, { backgroundColor: 'rgba(201,177,93,0.25)' }]}>
                <AppText variant="caption" color="#C9B15D" style={{ fontWeight: '700' }}>
                  🎁 {reduxUser.referralCode}
                </AppText>
              </View>
            )} */}
          </View>
        </View>

        {/* Meta strip */}
        {/* <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <AppText variant="caption" color="rgba(255,255,255,0.6)">Wallet</AppText>
            <AppText variant="bodySmall" color="#fff" style={{ fontWeight: '700' }}>
              ₹{reduxUser?.walletBalance ?? '0'}
            </AppText>
          </View>
          <View style={styles.heroMetaDivider} />
          <View style={styles.heroMetaItem}>
            <AppText variant="caption" color="rgba(255,255,255,0.6)">KYC</AppText>
            <AppText variant="bodySmall" color={reduxUser?.kycVerified ? '#7BAE3A' : '#F59E0B'} style={{ fontWeight: '700' }}>
              {reduxUser?.kycVerified ? '✓ Done' : 'Pending'}
            </AppText>
          </View>
          <View style={styles.heroMetaDivider} />
          <View style={styles.heroMetaItem}>
            <AppText variant="caption" color="rgba(255,255,255,0.6)">Aadhaar</AppText>
            <AppText variant="bodySmall" color={reduxUser?.aadhaarVerified ? '#7BAE3A' : '#F59E0B'} style={{ fontWeight: '700' }}>
              {reduxUser?.aadhaarVerified ? '✓ Done' : 'Pending'}
            </AppText>
          </View>
        </View> */}

        {!!reduxUser?.picture && (
          <TouchableOpacity
            style={styles.removePhotoBtn}
            onPress={() => showAlert(
              'Remove Photo', 'Remove your profile photo?',
              async () => {
                await deletePhoto(userIdStr);
                const updated = { ...reduxUser, picture: undefined };
                dispatch(setUser(updated));
                await AsyncStorageHelper.saveUserSession(updated);
              }, true
            )}
          >
            <AppText variant="caption" color="rgba(255,255,255,0.6)">Remove photo</AppText>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={{ paddingHorizontal: SIZES.padding.md }}>

        <AppDivider marginVertical={8} />

        {/* ── PERSONAL INFO ────────────────────────────────────── */}
        <AppCard padding="none">
          <SectionHeader icon="person-outline" title="Personal Information" />
          <InfoRow icon="call-outline"        label="Mobile Number"  value={reduxUser?.contactNumber} />
          <AppDivider marginVertical={0} />
          <InfoRow icon="mail-outline"        label="Email Address"  value={reduxUser?.email} />
          <AppDivider marginVertical={0} />
          <View style={{ flexDirection: 'row' }}>
            <InfoRowHalf icon="male-female-outline" label="Gender"        value={reduxUser?.gender} />
            <View style={[styles.verticalDivider, { backgroundColor: COLORS.border }]} />
            <InfoRowHalf icon="calendar-outline"    label="Date of Birth" value={reduxUser?.dateOfBirth} />
          </View>
          <AppDivider marginVertical={0} />
          <View style={[styles.editRow, { borderTopColor: COLORS.border }]}>
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: COLORS.primary }]}
              onPress={() => setEditPersonal(true)}
            >
              <Ionicons name="pencil-outline" size={13} color={COLORS.primary} />
              <AppText variant="bodySmall" color={COLORS.primary} style={{ marginLeft: 6, fontWeight: '600' }}>
                Edit Personal Info
              </AppText>
            </TouchableOpacity>
          </View>
        </AppCard>

        <AppDivider marginVertical={8} />

        {/* ── ADDRESS ─────────────────────────────────────────── */}
        <AppCard padding="none">
          <SectionHeader icon="location-outline" title="Address" />
          <InfoRow icon="home-outline"     label="Address Line 1" value={reduxUser?.address1} />
          <AppDivider marginVertical={0} />
          <InfoRow icon="home-outline"     label="Address Line 2" value={reduxUser?.address2} />
          <AppDivider marginVertical={0} />
          <View style={{ flexDirection: 'row' }}>
            <InfoRowHalf icon="business-outline" label="City"    value={reduxUser?.city} />
            <View style={[styles.verticalDivider, { backgroundColor: COLORS.border }]} />
            <InfoRowHalf icon="map-outline"      label="State"   value={reduxUser?.state} />
          </View>
          <AppDivider marginVertical={0} />
          <View style={{ flexDirection: 'row' }}>
            <InfoRowHalf icon="mail-outline"  label="Pincode" value={reduxUser?.pincode} />
            <View style={[styles.verticalDivider, { backgroundColor: COLORS.border }]} />
            <InfoRowHalf icon="globe-outline" label="Country" value={reduxUser?.country} />
          </View>
          <AppDivider marginVertical={0} />
          <View style={[styles.editRow, { borderTopColor: COLORS.border }]}>
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: COLORS.primary }]}
              onPress={() => setEditAddress(true)}
            >
              <Ionicons name="pencil-outline" size={13} color={COLORS.primary} />
              <AppText variant="bodySmall" color={COLORS.primary} style={{ marginLeft: 6, fontWeight: '600' }}>
                Edit Address
              </AppText>
            </TouchableOpacity>
          </View>
        </AppCard>

        <AppDivider marginVertical={8} />

        {/* ── ACCOUNT SETTINGS ─────────────────────────────────── */}
        <AppCard padding="none">
          <SectionHeader icon="settings-outline" title="Account & Security" />
          <ActionRow icon="lock-closed-outline" label="Change MPIN"
            onPress={() => navigation.navigate('ResetMpin')} />

            <ActionRow icon="lock-closed-outline" label="Login Logs"
            onPress={() => navigation.navigate('LoginLog')} />


          <AppDivider marginVertical={0} />
          <ActionRow icon="log-out-outline" label="Logout" danger
            onPress={() => showAlert('Logout', 'Are you sure you want to logout?',
              async () => {
                await dispatch(logoutUser());
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }, false)} />
              
          <AppDivider marginVertical={0} />
          <ActionRow icon="trash-outline" label="Delete Account" danger
            onPress={() => showAlert(
              'Delete Account',
              'This will permanently delete your account and all data. This cannot be undone.',
              async () => {
                if (userId) { await deleteUser(userId); }
                await dispatch(logoutUser());
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              },
              true
            )} />
        </AppCard>

        <AppDivider marginVertical={8} />

        {/* Footer */}
        <View style={styles.footer}>
          <AppText variant="caption" color={COLORS.textTertiary} align="center">
            Rangas DigiGold • Version 1.0.0
          </AppText>
        </View>

      </View>

      {/* ── Edit Personal Info Modal ─────────────────────────── */}
      <EditPersonalModal
        visible={editPersonal}
        initial={{
          username:    reduxUser?.username    ?? '',
          email:       reduxUser?.email       ?? '',
          gender:      reduxUser?.gender      ?? '',
          dateOfBirth: reduxUser?.dateOfBirth ?? '',
        }}
        saving={loading}
        onClose={() => setEditPersonal(false)}
        onSave={savePersonalInfo}
      />

      {/* ── Edit Address Modal ───────────────────────────────── */}
      <EditAddressModal
        visible={editAddress}
        initial={{
          address1: reduxUser?.address1 ?? '',
          address2: reduxUser?.address2 ?? '',
          city:     reduxUser?.city     ?? '',
          state:    reduxUser?.state    ?? '',
          pincode:  reduxUser?.pincode  ?? '',
          country:  reduxUser?.country  ?? '',
        }}
        saving={loading}
        onClose={() => setEditAddress(false)}
        onSave={saveAddress}
      />

      {/* ── Alert ───────────────────────────────────────────── */}
      <CustomAlert
        visible={alert.visible}
        type={alert.onConfirm ? 'confirm' : 'info'}
        title={alert.title}
        message={alert.message}
        buttons={
          alert.onConfirm
            ? [
                { label: 'Cancel', style: 'secondary', onPress: hideAlert },
                {
                  label: alert.danger ? 'Delete' : 'Confirm',
                  style: alert.danger ? 'danger' : 'primary',
                  onPress: () => { hideAlert(); alert.onConfirm?.(); },
                },
              ]
            : [{ label: 'OK', style: 'primary', onPress: hideAlert }]
        }
        onDismiss={hideAlert}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  heroBanner:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  heroTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  heroInfo:       { flex: 1, justifyContent: 'flex-start', gap: 2, paddingTop: 4 },
  heroMeta:       { flexDirection: 'row', marginTop: 18, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 6 },
  heroMetaItem:   { flex: 1, alignItems: 'center', gap: 3 },
  heroMetaDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  removePhotoBtn: { alignSelf: 'flex-end', marginTop: 10 },
  tierBadge:      { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 6 },
  sectionHead:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionIconWrap:{ width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  infoRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  iconBox:        { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  verticalDivider:{ width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 8 },
  actionRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  actionBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  editRow:        { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'flex-end' },
  editBtn:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  footer:         { paddingVertical: 16, alignItems: 'center' },
  // Modal
  modalOverlay:   { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalKAV:       { width: '100%',height: '100%', justifyContent: 'center' },
  modalSheet:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  fieldRow:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 50 },
});
