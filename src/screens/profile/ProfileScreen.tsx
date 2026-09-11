// src/screens/profile/ProfileScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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

// ── Gradient icon badge (used by rows & tiles for a richer, "jewel" feel) ──
function GradientBadge({ icon, size = 32, iconSize = 15, colors, style }: {
  icon: string; size?: number; iconSize?: number; colors: string[]; style?: any;
}) {
  return (
    <LinearGradient
      colors={colors as unknown as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ width: size, height: size, borderRadius: size * 0.32, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Ionicons name={icon as any} size={iconSize} color="#FFFFFF" />
    </LinearGradient>
  );
}

// ── Section label ─────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  const { COLORS } = useTheme();
  return (
    <View style={styles.sectionLabelWrap}>
      <View style={[styles.sectionAccent, { backgroundColor: COLORS.secondary }]} />
      <AppText variant="label" color={COLORS.textSecondary} style={{ letterSpacing: 1.1 }}>
        {title.toUpperCase()}
      </AppText>
    </View>
  );
}

// ── Big navigation tile (2-per-row grid) ──────────────────────────
function NavTile({ icon, label, hint, gradient, onPress }: {
  icon: string; label: string; hint?: string; gradient: string[]; onPress: () => void;
}) {
  const { COLORS, SHADOWS } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: COLORS.canvasElevated ?? COLORS.card }, SHADOWS.lift]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <GradientBadge icon={icon} size={42} iconSize={20} colors={gradient} />
      <AppText variant="bodyMedium" style={{ fontWeight: '700', marginTop: 14 }}>{label}</AppText>
      {hint ? (
        <AppText variant="caption" color={COLORS.textTertiary} style={{ marginTop: 2 }}>{hint}</AppText>
      ) : null}
      <View style={[styles.tileArrow, { backgroundColor: COLORS.canvasSunken ?? COLORS.primaryPale }]}>
        <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
}

// ── Compact list row (used inside cards) ──────────────────────────
function ListRow({ icon, label, sublabel, onPress, danger = false, last = false, gradient }: {
  icon: string; label: string; sublabel?: string;
  onPress: () => void; danger?: boolean; last?: boolean; gradient: string[];
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
      <GradientBadge icon={icon} size={36} iconSize={16} colors={gradient} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium" style={{ color: danger ? COLORS.error : COLORS.textPrimary, fontWeight: '600' }}>
          {label}
        </AppText>
        {sublabel ? (
          <AppText variant="caption" color={COLORS.textTertiary} style={{ marginTop: 1 }}>{sublabel}</AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={danger ? COLORS.error : COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, label, sublabel, value, onValueChange, last = false, gradient }: {
  icon: string; label: string; sublabel?: string;
  value: boolean; onValueChange: (v: boolean) => void; last?: boolean; gradient: string[];
}) {
  const { COLORS } = useTheme();
  return (
    <View style={[
      styles.row,
      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
    ]}>
      <GradientBadge icon={icon} size={36} iconSize={16} colors={gradient} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium" style={{ fontWeight: '600' }}>{label}</AppText>
        {sublabel ? (
          <AppText variant="caption" color={COLORS.textTertiary} style={{ marginTop: 1 }}>{sublabel}</AppText>
        ) : null}
      </View>
      <AppSwitch value={value} onValueChange={onValueChange} size="sm" />
    </View>
  );
}

// ── Small identity row inside the hero (phone / email) ────────────
function HeroInfoRow({ icon, text }: { icon: string; text: string }) {
  const { COLORS } = useTheme();
  return (
    <View style={styles.heroInfoRow}>
      <Ionicons name={icon as any} size={12} color={COLORS.heroAccent ?? COLORS.secondary} />
      <AppText variant="bodySmall" color={COLORS.heroTextSecondary ?? COLORS.whiteOpacity80} numberOfLines={1} style={{ flexShrink: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function ProfileScreen() {
  const { COLORS, SIZES, SHADOWS } = useTheme();
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const reduxUser  = useAppSelector((s) => s.auth.user);

  const { fetchUser, deleteUser } = useUserProfile();

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
    >
      {/* ── Header — shared AppHeader (curved + gradient + glass everywhere) ── */}
      <AppHeader
        variant="primary"
        showBack
        onBackPress={() => navigation.navigate('Home' as any)}
        title="My Profile"
        bottomContent={
          <View style={styles.heroTop}>
            <View style={[styles.avatarRing, SHADOWS.goldGlow]}>
              <AppAvatar
                source={reduxUser?.picture ? { uri: reduxUser.picture } : null}
                name={reduxUser?.username ?? ''}
                size="xl"
                style={{ borderColor: COLORS.secondary, borderWidth: 2.5 }}
              />
            </View>
            <View style={styles.heroInfo}>
              <AppText variant="h4" color={COLORS.heroTextPrimary ?? COLORS.textOnPrimary} numberOfLines={1} style={{ fontWeight: '700' }}>
                {reduxUser?.username || 'User'}
              </AppText>

              <View style={[styles.memberChip, { backgroundColor: COLORS.heroGlass ?? COLORS.whiteOpacity10, borderColor: COLORS.heroHairlineBold ?? COLORS.whiteOpacity20 }]}>
                <Ionicons name="sparkles" size={10} color={COLORS.heroAccent ?? COLORS.secondary} />
                <AppText variant="caption" color={COLORS.heroAccent ?? COLORS.secondary} style={{ fontWeight: '700', letterSpacing: 0.4 }}>
                  DigiGold Member
                </AppText>
              </View>

              <View style={{ marginTop: 8, gap: 5 }}>
                <HeroInfoRow icon="call-outline" text={reduxUser?.contactNumber || '—'} />
                <HeroInfoRow icon="mail-outline" text={reduxUser?.email || '—'} />
              </View>
            </View>
          </View>
        }
      />

      <View style={{ paddingHorizontal: SIZES.padding.md, paddingTop: 22 }}>

        {/* ── QUICK ACCESS GRID ────────────────────────────────── */}
        <SectionLabel title="Quick access" />
        <View style={styles.tileGrid}>
          <NavTile icon="pie-chart-outline" label="My Portfolio" hint="Holdings & value"
            gradient={COLORS.gradient?.orangePrimary ?? [COLORS.primary, COLORS.primaryDark]}
            onPress={() => navigation.navigate('Portfolio')} />
          <NavTile icon="receipt-outline" label="Transactions" hint="Buy & sell history"
            gradient={COLORS.gradient?.goldDark ?? [COLORS.secondary, COLORS.secondaryDark]}
            onPress={() => navigation.navigate('Transactions')} />
        </View>

        {/* ── SECURITY ─────────────────────────────────────────── */}
        <SectionLabel title="Security" />
        <AppCard padding="none" radius="xl" style={SHADOWS.lift}>
          <ListRow icon="lock-closed-outline" label="Change MPIN" sublabel="Update your 4-digit PIN"
            gradient={COLORS.gradient?.orangePrimary ?? [COLORS.primary, COLORS.primaryDark]}
            onPress={() => navigation.navigate('ResetMpin')}
            last={!bioSupported} />
          {bioSupported && (
            <ToggleRow
              icon="finger-print-outline"
              label={`${bioLabel} unlock`}
              sublabel={`Use ${bioLabel} to unlock the app`}
              gradient={COLORS.gradient?.orangeDeep ?? [COLORS.primaryDark, COLORS.primary]}
              value={bioEnabled}
              onValueChange={handleToggleBiometric}
              last
            />
          )}
        </AppCard>

        {/* ── ACCOUNT ──────────────────────────────────────────── */}
        <SectionLabel title="Account" />
        <AppCard padding="none" radius="xl" style={SHADOWS.lift}>
          <ListRow icon="log-out-outline" label="Logout" danger
            gradient={[COLORS.error, COLORS.errorDark ?? COLORS.error]}
            onPress={() => showAlert('Logout', 'You will need your MPIN to sign back in.',
              async () => {
                await dispatch(logoutUser());
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              })} />
          <ListRow icon="trash-outline" label="Delete account" danger last
            sublabel="Permanently removes all your data"
            gradient={[COLORS.errorDark ?? COLORS.error, COLORS.error]}
            onPress={() => navigation.navigate('DeleteAccount')} />
        </AppCard>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.versionPill, { backgroundColor: COLORS.canvasSunken ?? COLORS.gray100, borderColor: COLORS.border }]}>
            <AppText variant="caption" color={COLORS.textTertiary} align="center">
              Version {require('expo-constants').default.expoConfig?.version ?? '1.0.0'}
            </AppText>
          </View>
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
  // Hero (rendered as AppHeader's bottomContent, inside its curved gradient)
  heroTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 26 },
  avatarRing:     { borderRadius: 999 },
  heroInfo:       { flex: 1, justifyContent: 'flex-start', gap: 4, paddingTop: 4 },
  heroInfoRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberChip:     {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1, marginTop: 4,
  },

  // Section labels
  sectionLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 12 },
  sectionAccent:    { width: 4, height: 15, borderRadius: 2 },

  // Tile grid
  tileGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile:      { flexGrow: 1, flexBasis: '46%', borderRadius: 20, padding: 16, minHeight: 122, justifyContent: 'flex-start' },
  tileArrow: { position: 'absolute', top: 16, right: 14, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // List rows
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 13 },

  footer:  { paddingTop: 24, paddingBottom: 10, alignItems: 'center' },
  versionPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
});
