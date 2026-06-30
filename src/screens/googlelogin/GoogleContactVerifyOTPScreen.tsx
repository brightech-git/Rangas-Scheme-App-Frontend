// src/screens/googlelogin/GoogleContactVerifyOTPScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOtpVerify, removeListener } from 'react-native-otp-verify';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { authService } from '../../api/services/authService';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import AppOTPInput, { AppOTPInputRef } from '../../components/ui/appcomponents/AppOTPInput';
import AppButton from '../../components/ui/appcomponents/AppButton';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import { useToast } from '../../components/ui/Toast';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'GoogleContactVerifyOTP'>;

export default function GoogleContactVerifyOTPScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const toast      = useToast();

  const { newContactNumber, picture, userId } = route.params;

  const otpRef          = useRef<AppOTPInputRef>(null);
  const verifyCalledRef = useRef(false);

  const [otpCode, setOtpCode]         = useState('');
  const [otpError, setOtpError]       = useState(false);
  const [otpErrMsg, setOtpErrMsg]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(Platform.OS === 'android');

  // ── Auto OTP read ─────────────────────────────────────────────
  const { otp: smsOtp } = useOtpVerify({ numberOfDigits: 6 });

  useEffect(() => {
    if (!smsOtp || verifyCalledRef.current) return;
    const digits = smsOtp.replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      otpRef.current?.clear();
      setOtpCode(digits);
      setOtpError(false);
      setAutoDetecting(false);
    }
  }, [smsOtp]);

  useEffect(() => { return () => { removeListener(); }; }, []);

  useEffect(() => {
    if (!autoDetecting) return;
    const id = setTimeout(() => setAutoDetecting(false), 30000);
    return () => clearTimeout(id);
  }, [autoDetecting]);

  const handleVerify = async () => {
    if (otpCode.length < 6) {
      setOtpError(true);
      setOtpErrMsg('Please enter the OTP');
      return;
    }
    if (verifyCalledRef.current) return;
    verifyCalledRef.current = true;
    setLoading(true);

    try {
      const res = await authService.verifyGoogleContactOtp({
        newContactNumber,
        otp: otpCode,
      });
      // merge picture & id from google login (not returned by OTP verify)
      await AsyncStorageHelper.saveUserSession({
        ...res,
        picture: picture ?? res.picture,
        id:      res.id ?? userId,
      });
      toast.success('Mobile Linked!', { message: 'Your account is ready' });
      navigation.replace('CreateMpin');
    } catch (err: any) {
      verifyCalledRef.current = false;
      setOtpError(true);
      setOtpErrMsg(err.message ?? 'Invalid OTP');
      toast.error('Verification Failed', { message: err.message ?? 'Invalid OTP' });
      otpRef.current?.clear();
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    otpRef.current?.clear();
    setOtpCode('');
    setOtpError(false);
    setOtpErrMsg('');
    setAutoDetecting(Platform.OS === 'android');
    verifyCalledRef.current = false;
    toast.info('OTP Resent', { message: `Code sent to ${newContactNumber}` });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Verify Mobile" showBack variant="white" />
      <View style={[styles.content, { paddingHorizontal: SIZES.padding.xl }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            Code sent to{' '}
            <Text style={styles.phone}>+91 {newContactNumber}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          {autoDetecting && (
            <View style={styles.autoDetectRow}>
              <Text style={styles.autoDetectText}>📲 Waiting for SMS auto-detection...</Text>
            </View>
          )}

          <AppOTPInput
            ref={otpRef}
            length={6}
            autoFocus
            value={otpCode}
            error={otpError}
            errorMessage={otpErrMsg}
            onComplete={(code) => { setOtpCode(code); setOtpError(false); }}
            onResend={handleResend}
            resendCountdown={30}
          />

          <View style={{ marginTop: SIZES.lg }}>
            <AppButton
              label="Verify & Continue"
              onPress={handleVerify}
              loading={loading}
              size="lg"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: SIZES.xl, gap: SIZES.xl },
  header:  { gap: 8 },
  title: {
    fontFamily: FONTS.family.bold,
    fontSize:   SIZES.heading.h3,
    color:      COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FONTS.family.regular,
    fontSize:   SIZES.font.sm,
    color:      COLORS.textSecondary,
  },
  phone: {
    fontFamily: FONTS.family.semiBold,
    color:      COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    SIZES.radius.xl,
    padding:         SIZES.padding.xl,
    gap:             SIZES.md,
    ...SHADOWS.md,
  },
  autoDetectRow: {
    backgroundColor: COLORS.primaryPale,
    borderRadius:    SIZES.radius.sm,
    paddingHorizontal: SIZES.padding.md,
    paddingVertical:   SIZES.padding.sm,
    alignItems: 'center',
  },
  autoDetectText: {
    fontFamily: FONTS.family.regular,
    fontSize:   SIZES.font.xs,
    color:      COLORS.primaryDark,
  },
});
