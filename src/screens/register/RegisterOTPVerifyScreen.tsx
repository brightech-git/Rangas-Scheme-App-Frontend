// src/screens/register/RegisterOTPVerifyScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOtpVerify, removeListener } from 'react-native-otp-verify';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { verifyOtp } from '../../store/authSlice';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppButton from '../../components/ui/appcomponents/AppButton';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import AppOTPInput, { AppOTPInputRef } from '../../components/ui/appcomponents/AppOTPInput';
import { useToast } from '../../components/ui/Toast';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RegisterOTPVerify'>;

export default function RegisterOTPVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const toast = useToast();

  const { contactNumber } = route.params;
  const otpRef          = useRef<AppOTPInputRef>(null);
  const [otpError, setOtpError]   = useState(false);
  const [otpErrMsg, setOtpErrMsg] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(Platform.OS === 'android');
  const verifyCalledRef = useRef(false);

  // ── Auto OTP read (Android only) ──────────────────────────────
  const { otp: smsOtp } = useOtpVerify({ numberOfDigits: 6 });

  useEffect(() => {
    if (!smsOtp || verifyCalledRef.current) return;
    const digits = smsOtp.replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      otpRef.current?.clear();
      setAutoDetecting(false);
      verifyCalledRef.current = true;
      submitOtp(digits);
    }
  }, [smsOtp]);

  useEffect(() => { return () => { removeListener(); }; }, []);

  useEffect(() => {
    if (!autoDetecting) return;
    const id = setTimeout(() => setAutoDetecting(false), 30000);
    return () => clearTimeout(id);
  }, [autoDetecting]);

  const submitOtp = async (code: string) => {
    const res = await dispatch(verifyOtp({ contactNumber, otp: code }));
    if (verifyOtp.fulfilled.match(res)) {
      await AsyncStorageHelper.saveUserSession(res.payload);
      toast.success('Verified!', { message: 'Account created successfully' });
      navigation.replace('CreateMpin');
    } else {
      verifyCalledRef.current = false;
      setOtpError(true);
      setOtpErrMsg(res.payload as string);
      toast.error('Invalid OTP', { message: res.payload as string });
      otpRef.current?.clear();
    }
  };

  const handleResend = () => {
    otpRef.current?.clear();
    setOtpError(false);
    setOtpErrMsg('');
    setAutoDetecting(Platform.OS === 'android');
    verifyCalledRef.current = false;
    toast.info('OTP Resent', { message: `Code sent to ${contactNumber}` });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Verify OTP" showBack  />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {/* <Text style={styles.title}>Verify OTP</Text> */}
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phone}>+91 {contactNumber}</Text>
          </Text>
        </View>

        {/* OTP Boxes */}
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
            error={otpError}
            errorMessage={otpErrMsg}
            onComplete={(code) => {
              if (verifyCalledRef.current) return;
              verifyCalledRef.current = true;
              submitOtp(code);
            }}
            onResend={handleResend}
            resendCountdown={30}
          />

          <View style={{ marginTop: SIZES.lg }}>
            <AppButton
              label="Verify OTP"
              onPress={() => {
                const code = otpRef.current?.getValue() ?? '';
                if (code.length < 6 || verifyCalledRef.current) return;
                verifyCalledRef.current = true;
                submitOtp(code);
              }}
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
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding.xl,
    paddingTop: SIZES.xl,
    gap: SIZES.xl,
  },
  header: { gap: 8 },
  subtitle: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.font.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  phone: {
    fontFamily: FONTS.family.semiBold,
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.padding.xl,
    ...SHADOWS.md,
  },
  autoDetectRow: {
    backgroundColor: COLORS.primaryPale,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.sm,
    marginBottom: SIZES.md,
    alignItems: 'center',
  },
  autoDetectText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.font.xs,
    color: COLORS.primaryDark,
  },
});
