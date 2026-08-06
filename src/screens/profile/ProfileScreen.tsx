// src/screens/profile/ProfileScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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

import ScreenWrapper from '../../components/ui/appcomponents/ScreenWrapper';
import AppHeader     from '../../components/ui/appcomponents/AppHeader';
import AppAvatar     from '../../components/ui/appcomponents/AppAvatar';
import AppCard       from '../../components/ui/appcomponents/AppCard';
import AppText       from '../../components/ui/appcomponents/AppText';
import AppSwitch     from '../../components/ui/appcomponents/AppSwitch';
import CustomAlert   from '../../components/ui/CustomAlert';
import { BiometricHelper, type BiometricLabel } from '../../utils/BiometricHelper';
import PoweredByFooter from '../../components/ui/PoweredByFooter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Section label ─────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  const { COLORS } = useTheme();
  return (
    <View style={styles.sectionLabelWrap}>
      <View style={[styles.sectionAccent, { backgroundColor: COLORS.primary }]} />
      <AppText variant="label" color={COLORS.textSecondary} style={{ letterSpacing: 0.8 }}>
        {title.toUpperCase()}
      </AppText>
    </View>
  );
}

// ── Big navigation tile (2-per-row grid) ──────────────────────────
function NavTile({ icon, label, hint, onPress }: {
  icon: string; label: string; hint?: string; onPress: () => void;
}) {
  const { COLORS } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.tileIcon, { backgroundColor: COLORS.primaryPale }]}>
        <Ionicons name={icon as any} size={20} color={COLORS.primary} />
      </View>
      <AppText variant="bodyMedium" style={{ fontWeight: '600', marginTop: 12 }}>{label}</AppText>
      {hint ? (
        <AppText variant="caption" color={COLORS.textTertiary} style={{ marginTop: 2 }}>{hint}</AppText>
      ) : null}
      <Ionicons
        name="arrow-forward"
        size={14}
        color={COLORS.textTertiary}
        style={styles.tileArrow}
      />
    </TouchableOpacity>
  );
}

// ── Compact list row (used inside cards) ──────────────────────────
function ListRow({ icon, label, sublabel, onPress, danger = false, last = false }: {
  icon: string; label: string; sublabel?: string;
  onPress: () => void; danger?: boolean; last?: boolean;
}) {
  const { COLORS } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? COLORS.error + '18' : COLORS.primaryPale }]}>
        <Ionicons name={icon as any} size={15} color={danger ? COLORS.error : COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium" style={{ color: danger ? COLORS.error : COLORS.textPrimary }}>
          {label}
        </AppText>
        {sublabel ? (
          <AppText variant="caption" color={COLORS.textTertiary} style={{ marginTop: 1 }}>{sublabel}</AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={15} color={danger ? COLORS.error : COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, label, sublabel, value, onValueChange, last = false }: {
  icon: string; label: string; sublabel?: string;
  value: boolean; onValueChange: (v: boolean) => void; last?: boolean;
}) {
  const { COLORS } = useTheme();
  return (
    <View style={[
      styles.row,
      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
    ]}>
      <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryPale }]}>
        <Ionicons name={icon as any} size={15} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium">{label}</AppText>
        {sublabel ? (
          <AppText variant="caption" color={COLORS.textTertiary} style={{ marginTop: 1 }}>{sublabel}</AppText>
        ) : null}
      </View>
      <AppSwitch value={value} onValueChange={onValueChange} size="sm" />
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function ProfileScreen() {
  const { COLORS, SIZES } = useTheme();
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const reduxUser  = useAppSelector((s) => s.auth.user);

  const { fetchUser, updatePhoto, deletePhoto, deleteUser } = useUserProfile();

  const [refreshing, setRefreshing] = useState(false);

  // ── Biometric unlock preference ────────────────────────────────
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled, setBioEnabled]     = useState(false);
  const [bioLabel, setBioLabel]         = useState<BiometricLabel>('Biometrics');

  // Alert state
  const [alert, setAlert] = useState<{
    visible: boolean; title: string; message: string;
    onConfirm?: () => void; danger?: boolean;
  }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, onConfirm?: () => void, danger = false) =>
    setAlert({ visible: true, title, message, onConfirm, danger });
  const hideAlert = () => setAlert(a => ({ ...a, visible: false }));

  const userId    = reduxUser?.id;
  const userIdStr = String(userId ?? '');

  useEffect(() => {
    let active = true;
    (async () => {
      const supported = await BiometricHelper.isSupported();
      if (!active) return;
      setBioSupported(supported);
      if (!supported) return;
      const [label, enabled] = await Promise.all([
        BiometricHelper.getLabel(),
        BiometricHelper.isEnabled(),
      ]);
      if (!active) return;
      setBioLabel(label);
      setBioEnabled(enabled);
    })();
    return () => { active = false; };
  }, []);

  const handleToggleBiometric = useCallback(async (next: boolean) => {
    if (!next) {
      await BiometricHelper.setEnabled(false);
      setBioEnabled(false);
      return;
    }
    const hasMpin = await BiometricHelper.hasStoredMpin();
    if (!hasMpin) {
      showAlert('Set up MPIN first', 'Log in with your MPIN once, then enable biometric unlock.');
      return;
    }
    const ok = await BiometricHelper.authenticate(`Enable ${bioLabel} unlock`);
    if (!ok) return;
    await BiometricHelper.setEnabled(true);
    setBioEnabled(true);
  }, [bioLabel]);

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
      <LinearGradient colors={[COLORS.primary, COLORS.primary + 'CC']} style={styles.heroBanner}>
        <View style={styles.heroTop}>
          <AppAvatar
            source={reduxUser?.picture ? { uri: reduxUser.picture } : null}
            name={reduxUser?.username ?? ''}
            size="xl"
            showEdit
            onEditPress={handlePickPhoto}
          />
          <View style={styles.heroInfo}>
            <AppText variant="h4" color={COLORS.textOnPrimary} numberOfLines={1}>
              {reduxUser?.username || 'User'}
            </AppText>
            <AppText variant="bodySmall" color={COLORS.whiteOpacity70} style={{ marginTop: 2 }}>
              {reduxUser?.contactNumber || '—'}
            </AppText>
            <AppText variant="bodySmall" color={COLORS.whiteOpacity70} numberOfLines={1}>
              {reduxUser?.email || '—'}
            </AppText>
          </View>
        </View>

        {!!reduxUser?.picture && (
          <TouchableOpacity
            style={styles.removePhotoBtn}
            onPress={() => showAlert(
              'Remove photo', 'Your profile photo will be removed.',
              async () => {
                await deletePhoto(userIdStr);
                const updated = { ...reduxUser, picture: undefined };
                dispatch(setUser(updated));
                await AsyncStorageHelper.saveUserSession(updated);
              }, true
            )}
          >
            <AppText variant="caption" color={COLORS.whiteOpacity70}>Remove photo</AppText>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={{ paddingHorizontal: SIZES.padding.md, paddingTop: 18 }}>

        {/* ── QUICK ACCESS GRID ────────────────────────────────── */}
        <SectionLabel title="Quick access" />
        <View style={styles.tileGrid}>
          <NavTile icon="pie-chart-outline" label="My Portfolio" hint="Holdings & value"
            onPress={() => navigation.navigate('Portfolio')} />
          <NavTile icon="receipt-outline" label="Transactions" hint="Buy & sell history"
            onPress={() => navigation.navigate('Transactions')} />
        </View>

        {/* ── SECURITY ─────────────────────────────────────────── */}
        <SectionLabel title="Security" />
        <AppCard padding="none">
          <ListRow icon="lock-closed-outline" label="Change MPIN" sublabel="Update your 4-digit PIN"
            onPress={() => navigation.navigate('ResetMpin')}
            last={!bioSupported} />
          {bioSupported && (
            <ToggleRow
              icon="finger-print-outline"
              label={`${bioLabel} unlock`}
              sublabel={`Use ${bioLabel} to unlock the app`}
              value={bioEnabled}
              onValueChange={handleToggleBiometric}
              last
            />
          )}
        </AppCard>

        {/* ── ACCOUNT ──────────────────────────────────────────── */}
        <SectionLabel title="Account" />
        <AppCard padding="none">
          <ListRow icon="log-out-outline" label="Logout" danger
            onPress={() => showAlert('Logout', 'You will need your MPIN to sign back in.',
              async () => {
                await dispatch(logoutUser());
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              })} />
          <ListRow icon="trash-outline" label="Delete account" danger last
            sublabel="Permanently removes all your data"
            onPress={() => navigation.navigate('DeleteAccount')} />
        </AppCard>

        {/* Footer */}
        <View style={styles.footer}>
          <AppText variant="caption" color={COLORS.textTertiary} align="center">
            Version {require('expo-constants').default.expoConfig?.version ?? '1.0.0'}
          </AppText>
        </View>
        <PoweredByFooter />
      </View>

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
  // Hero
  heroBanner:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
  heroTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  heroInfo:       { flex: 1, justifyContent: 'flex-start', gap: 2, paddingTop: 4 },
  removePhotoBtn: { alignSelf: 'flex-end', marginTop: 10 },

  // Section labels
  sectionLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  sectionAccent:    { width: 3, height: 14, borderRadius: 2 },

  // Tile grid
  tileGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile:      { flexGrow: 1, flexBasis: '46%', borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 14, minHeight: 116, justifyContent: 'flex-start' },
  tileIcon:  { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileArrow: { position: 'absolute', top: 16, right: 14 },

  // List rows
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  footer:  { paddingVertical: 22, alignItems: 'center' },
});