// src/screens/ForgotPassword/VerifyOTPScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOtpVerify, removeListener } from 'react-native-otp-verify';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetPassword } from '../../store/authSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppOTPInput, { AppOTPInputRef } from '../../components/ui/appcomponents/AppOTPInput';
import AppInput from '../../components/ui/appcomponents/AppInput';
import AppButton from '../../components/ui/appcomponents/AppButton';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import { useToast } from '../../components/ui/Toast';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ForgotVerifyOTP'>;

export default function VerifyOTPScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const toast = useToast();

  const { contactNumber } = route.params;
  const otpRef          = useRef<AppOTPInputRef>(null);
  const verifyCalledRef = useRef(false);

  const [otpError, setOtpError]     = useState(false);
  const [otpErrMsg, setOtpErrMsg]   = useState('');
  const [otpCode, setOtpCode]       = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passErrors, setPassErrors]           = useState<Record<string, string>>({});
  const [autoDetecting, setAutoDetecting]     = useState(Platform.OS === 'android');

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

  const validatePass = () => {
    const e: Record<string, string> = {};
    if (!newPassword)              e.newPassword     = 'New password is required';
    else if (newPassword.length < 6) e.newPassword   = 'Minimum 6 characters';
    if (confirmPassword !== newPassword) e.confirmPassword = 'Passwords do not match';
    setPassErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (otpCode.length < 6) {
      setOtpError(true);
      setOtpErrMsg('Please enter the OTP');
      return;
    }
    if (!validatePass()) return;
    if (verifyCalledRef.current) return;
    verifyCalledRef.current = true;

    const res = await dispatch(resetPassword({
      contactNumber,
      otp:         otpCode,
      newPassword,
    }));

    if (resetPassword.fulfilled.match(res)) {
      toast.success('Password Reset!', { message: 'Login with your new password' });
      navigation.replace('Login');
    } else {
      verifyCalledRef.current = false;
      setOtpError(true);
      setOtpErrMsg(res.payload as string);
      toast.error('Reset Failed', { message: res.payload as string });
      otpRef.current?.clear();
      setOtpCode('');
    }
  };

  const handleResend = () => {
    otpRef.current?.clear();
    setOtpCode('');
    setOtpError(false);
    setOtpErrMsg('');
    setAutoDetecting(Platform.OS === 'android');
    verifyCalledRef.current = false;
    toast.info('OTP Resent', { message: `Code sent to ${contactNumber}` });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Reset Password" showBack  />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SIZES.padding.xl, paddingTop: SIZES.lg, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Info */}
        <View style={styles.header}>
          <Text style={styles.title}>Enter OTP & New Password</Text>
          <Text style={styles.subtitle}>
            OTP sent to{' '}
            <Text style={styles.phone}>+91 {contactNumber}</Text>
          </Text>
        </View>

        {/* OTP Card */}
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
        </View>

        {/* New Password Card */}
        <View style={styles.card}>
          <AppInput
            label="New Password"
            placeholder="Enter new password"
            leftIcon="lock-closed-outline"
            isPassword
            value={newPassword}
            onChangeText={(v) => { setNewPassword(v); setPassErrors((p) => ({ ...p, newPassword: '' })); }}
            error={passErrors.newPassword}
            required
            indicator="required"
          />
          <AppInput
            label="Confirm Password"
            placeholder="Re-enter new password"
            leftIcon="lock-closed-outline"
            isPassword
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setPassErrors((p) => ({ ...p, confirmPassword: '' })); }}
            error={passErrors.confirmPassword}
            required
            indicator="required"
          />

          <AppButton
            label="Reset Password"
            onPress={handleReset}
            loading={loading}
            size="lg"
          />
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: SIZES.xl,
    gap: SIZES.xl,
  },
  header: { gap: 8 },
  title: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.heading.h3,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.font.sm,
    color: COLORS.textSecondary,
  },
  phone: {
    fontFamily: FONTS.family.semiBold,
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.padding.xl,
    gap: SIZES.md,
    ...SHADOWS.md,
  },
  autoDetectRow: {
    backgroundColor: COLORS.primaryPale,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.sm,
    alignItems: 'center',
  },
  autoDetectText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.font.xs,
    color: COLORS.primaryDark,
  },
});
