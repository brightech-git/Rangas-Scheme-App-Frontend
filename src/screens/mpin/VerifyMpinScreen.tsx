// src/screens/mpin/VerifyMpinScreen.tsx

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import type { ThemeContextType } from '../../theme/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { verifyMpin } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppPinInput, { AppPinInputRef } from '../../components/ui/appcomponents/AppPinInput';
import AppLoader from '../../components/ui/appcomponents/AppLoader';
import { useToast } from '../../components/ui/Toast';
import { initNotifications } from '../../utils/NotificationService';
import { loginCheckService } from '../../api/services/loginCheckService';
import { BiometricHelper, type BiometricLabel } from '../../utils/BiometricHelper';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function VerifyMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.mpin);
  const user        = useAppSelector((s) => s.auth.user);
  const toast       = useToast();
  const theme = useTheme();
  const { COLORS } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const pinRef = useRef<AppPinInputRef>(null);
  const [pinError, setPinError]   = useState(false);
  const [pinErrMsg, setPinErrMsg] = useState('');

  // ── Biometric state ───────────────────────────────────────────
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled, setBioEnabled]     = useState(false); // user opted in via Profile
  const [bioLabel, setBioLabel]         = useState<BiometricLabel>('Biometrics');
  const [bioBusy, setBioBusy]           = useState(false);
  const bioPromptedRef = useRef(false); // auto-prompt only once per mount

  // Shared post-verification success path (used by MPIN entry AND biometrics)
  const onVerifiedSuccess = useCallback(async () => {
    toast.success('Welcome back!', { message: `Hello, ${user?.username ?? 'User'} 👋`, position: 'top' });
    // Record login-check entry (fire-and-forget; never blocks login)
    if (user?.username && user?.contactNumber) {
      loginCheckService
        .register({ username: user.username, mobileNumber: user.contactNumber })
        .catch(() => { /* ignore — non-critical */ });
    }
    await initNotifications().catch(() => { /* ignore — never blocks navigation */ });
    navigation.replace('Main');
  }, [navigation, toast, user?.username, user?.contactNumber]);

  const handleComplete = async (value: string) => {
    const res = await dispatch(verifyMpin(value));
    if (verifyMpin.fulfilled.match(res)) {
      // Biometric unlock is opt-in only (toggled from Profile) — never auto-enabled here.
      await onVerifiedSuccess();
    } else {
      const msg = (typeof res.payload === 'string' && res.payload.trim())
        ? res.payload
        : 'Incorrect MPIN. Please try again.';
      setPinError(true);
      setPinErrMsg(msg);
      pinRef.current?.clear();
      toast.error('Incorrect MPIN', { message: msg, position: 'top', duration: 3500 });
    }
  };

  // ── Biometric unlock: authenticate → retrieve stored MPIN → normal verify
  const handleBiometric = useCallback(async () => {
    if (bioBusy) return;
    setBioBusy(true);
    try {
      const ok = await BiometricHelper.authenticate(`Unlock with ${bioLabel}`);
      if (!ok) return;
      const storedMpin = await BiometricHelper.getMpin();
      if (!storedMpin) {
        toast.info('Enter your MPIN once', { message: 'Biometric unlock will be ready next time', position: 'top' });
        return;
      }
      const res = await dispatch(verifyMpin(storedMpin));
      if (verifyMpin.fulfilled.match(res)) {
        await onVerifiedSuccess();
      } else {
        // Stored MPIN no longer valid (e.g. changed on another device) → clear + fall back
        await BiometricHelper.clearMpin();
        toast.error('Please enter your MPIN', { message: 'Biometric unlock needs to be set up again', position: 'top' });
      }
    } finally {
      setBioBusy(false);
    }
  }, [bioBusy, bioLabel, dispatch, onVerifiedSuccess, toast]);

  // Detect biometric support on mount; auto-prompt if enabled & an MPIN is stored
  useEffect(() => {
    let active = true;
    (async () => {
      const supported = await BiometricHelper.isSupported();
      if (!active) return;
      setBioSupported(supported);
      if (!supported) return;
      setBioLabel(await BiometricHelper.getLabel());
      const [enabled, hasMpin] = await Promise.all([
        BiometricHelper.isEnabled(),
        BiometricHelper.hasStoredMpin(),
      ]);
      if (!active) return;
      setBioEnabled(enabled);
      if (enabled && hasMpin && !bioPromptedRef.current) {
        bioPromptedRef.current = true;
        handleBiometric();
      }
    })();
    return () => { active = false; };
  }, [handleBiometric]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <AppLoader visible={loading} message="Verifying..." />
      <View style={styles.content}>

        {/* Brand + greeting */}
        <View style={styles.header}>
          <Text style={styles.brand}>✦ DigiGold</Text>
          <Text style={styles.title}>Enter MPIN</Text>
          <Text style={styles.subtitle}>
            Welcome back,{' '}
            <Text style={styles.name}>{user?.username ?? 'User'}</Text>
          </Text>
        </View>

        {/* PIN input with keypad */}
        <View style={styles.card}>
          <AppPinInput
            ref={pinRef}
            length={4}
            hint="Enter your 4-digit MPIN"
            variant="dots"
            showKeypad
            autoFocus
            error={pinError}
            errorMessage={pinErrMsg}
            disabled={loading}
            onChangeText={() => { setPinError(false); setPinErrMsg(''); }}
            onComplete={handleComplete}
          />
        </View>

        {/* Biometric unlock — only when the user has opted in from Profile */}
        {bioSupported && bioEnabled && (
          <TouchableOpacity
            style={styles.bioBtn}
            onPress={handleBiometric}
            activeOpacity={0.85}
            disabled={bioBusy || loading}
          >
            <Ionicons
              name={bioLabel === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
              size={22}
              color={COLORS.primary}
            />
            <Text style={styles.bioBtnText}>Unlock with {bioLabel}</Text>
          </TouchableOpacity>
        )}

        {/* Footer links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotMpin')} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot MPIN?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.replace('Login')} activeOpacity={0.7}>
            <Text style={styles.loginText}>Use Password / Switch Account</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const makeStyles = ({ COLORS, FONTS, SIZES, SHADOWS }: ThemeContextType) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: SIZES.padding.xl,
      paddingTop:        SIZES.xl,
      paddingBottom:     SIZES.lg,
      justifyContent:    'flex-start',
      alignItems:        'center',
      gap:               SIZES.xl,
    },
    header: { alignItems: 'center', gap: 2 },
    brand: {
      fontFamily:    FONTS.family.bold,
      fontSize:      SIZES.font.xl,
      color:         COLORS.secondary,
      letterSpacing: 1,
      marginBottom:  SIZES.xs,
    },
    title: {
      fontFamily:    FONTS.family.bold,
      fontSize:      SIZES.heading.h3,
      color:         COLORS.textPrimary,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontFamily: FONTS.family.regular,
      fontSize:   SIZES.font.sm,
      color:      COLORS.textSecondary,
    },
    name: {
      fontFamily: FONTS.family.semiBold,
      color:      COLORS.textPrimary,
    },
    card: {
      backgroundColor: COLORS.card,
      borderRadius:    SIZES.radius.xl,
      padding:         SIZES.padding.xl,
      width:           '100%',
      alignItems:      'center',
      ...SHADOWS.md,
    },
    bioBtn: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             SIZES.sm,
      backgroundColor: COLORS.primaryPale,
      borderWidth:     1.5,
      borderColor:     COLORS.primary,
      borderRadius:    SIZES.radius.lg,
      paddingVertical:   SIZES.padding.md,
      paddingHorizontal: SIZES.padding.xl,
    },
    bioBtnText: {
      fontFamily: FONTS.family.semiBold,
      fontSize:   SIZES.font.md,
      color:      COLORS.primary,
    },
    footer: {
      alignItems: 'center',
      gap:        SIZES.md,
    },
    forgotText: {
      fontFamily: FONTS.family.semiBold,
      fontSize:   SIZES.font.md,
      color:      COLORS.primary,
    },
    loginText: {
      fontFamily:         FONTS.family.regular,
      fontSize:           SIZES.font.sm,
      color:              COLORS.textTertiary,
      textDecorationLine: 'underline',
    },
  });
