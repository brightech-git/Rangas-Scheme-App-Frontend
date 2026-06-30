// src/screens/mpin/ForgotAndVerifyMpinScreen.tsx

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOtpVerify, removeListener } from 'react-native-otp-verify';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { forgotMpinSendOtp, forgotMpinVerify } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppOTPInput, { AppOTPInputRef } from '../../components/ui/appcomponents/AppOTPInput';
import AppPinInput, { AppPinInputRef } from '../../components/ui/appcomponents/AppPinInput';
import AppButton from '../../components/ui/appcomponents/AppButton';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import { useToast } from '../../components/ui/Toast';
import { useEffect } from 'react';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ForgotAndVerifyMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.mpin);
  const toast = useToast();

  const otpRef  = useRef<AppOTPInputRef>(null);
  const pinRef  = useRef<AppPinInputRef>(null);

  const [step, setStep]               = useState<'send' | 'verify'>('send');
  const [otpCode, setOtpCode]         = useState('');
  const [newMpin, setNewMpin]         = useState('');
  const [otpError, setOtpError]       = useState(false);
  const [otpErrMsg, setOtpErrMsg]     = useState('');
  const [pinError, setPinError]       = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);

  // ── Auto OTP read ─────────────────────────────────────────────
  const { otp: smsOtp } = useOtpVerify({ numberOfDigits: 6 });

  useEffect(() => {
    if (!smsOtp || step !== 'verify') return;
    const digits = smsOtp.replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      otpRef.current?.clear();
      setOtpCode(digits);
      setOtpError(false);
      setAutoDetecting(false);
    }
  }, [smsOtp, step]);

  useEffect(() => { return () => { removeListener(); }; }, []);

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendOtp = async () => {
    const res = await dispatch(forgotMpinSendOtp());
    if (forgotMpinSendOtp.fulfilled.match(res)) {
      toast.success('OTP Sent!', { message: 'Check your registered mobile' });
      setStep('verify');
      setAutoDetecting(Platform.OS === 'android');
    } else {
      toast.error('Failed', { message: res.payload as string });
    }
  };

  // ── Step 2: Verify OTP + new MPIN ─────────────────────────────
  const handleVerify = async () => {
    if (otpCode.length < 6) { setOtpError(true); setOtpErrMsg('Enter the OTP'); return; }
    if (newMpin.length < 4) { setPinError(true); return; }

    const res = await dispatch(forgotMpinVerify({ otp: otpCode, newMpin }));
    if (forgotMpinVerify.fulfilled.match(res)) {
      toast.success('MPIN Reset!', { message: 'Login with your new MPIN' });
      navigation.replace('MpinLogin');
    } else {
      setOtpError(true);
      setOtpErrMsg(res.payload as string);
      toast.error('Failed', { message: res.payload as string });
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
    handleSendOtp();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Forgot MPIN" showBack variant="white" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SIZES.padding.xl, paddingTop: SIZES.lg, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 'send' ? 'Reset Your MPIN' : 'Verify & Set New MPIN'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'send'
              ? 'We will send an OTP to your registered mobile number.'
              : 'Enter the OTP and set your new MPIN.'}
          </Text>
        </View>

        {step === 'send' ? (
          <View style={styles.card}>
            <AppButton
              label="Send OTP to Mobile"
              onPress={handleSendOtp}
              loading={loading}
              size="lg"
              leftIcon="phone-portrait-outline"
            />
          </View>
        ) : (
          <>
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

            {/* New MPIN Card */}
            <View style={styles.card}>
              <AppPinInput
                ref={pinRef}
                length={4}
                label="New MPIN"
                hint="Set your new 4-digit PIN"
                variant="dots"
                showKeypad
                error={pinError}
                errorMessage="Please enter 4 digits"
                onChangeText={(v) => { setNewMpin(v); setPinError(false); }}
                onComplete={(v) => setNewMpin(v)}
              />
            </View>

            <AppButton
              label="Reset MPIN"
              onPress={handleVerify}
              loading={loading}
              disabled={otpCode.length < 6 || newMpin.length < 4}
              size="lg"
            />
          </>
        )}
      </View>
      </ScrollView>
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
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    SIZES.radius.xl,
    padding:         SIZES.padding.xl,
    alignItems:      'center',
    ...SHADOWS.md,
  },
  autoDetectRow: {
    backgroundColor: COLORS.primaryPale,
    borderRadius:    SIZES.radius.sm,
    paddingHorizontal: SIZES.padding.md,
    paddingVertical:   SIZES.padding.sm,
    alignItems: 'center',
    marginBottom: SIZES.md,
    width: '100%',
  },
  autoDetectText: {
    fontFamily: FONTS.family.regular,
    fontSize:   SIZES.font.xs,
    color:      COLORS.primaryDark,
  },
});
