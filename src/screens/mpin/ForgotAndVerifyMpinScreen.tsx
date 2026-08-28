// src/screens/mpin/ForgotAndVerifyMpinScreen.tsx
//
// Flow 4 -- Forgot MPIN. Two steps under one WaveAuthShell, matching
// the existing screen's structure: 'send' (request an OTP to the
// registered mobile) and 'verify' (enter the OTP + set a new MPIN).
// A dedicated MpinSuccessState now replaces the old "toast + replace"
// pattern so the reset reads as a clear, calm confirmation.
//
// BUSINESS LOGIC -- UNCHANGED: forgotMpinSendOtp / forgotMpinVerify
// dispatches, SMS auto-detection via react-native-otp-verify, resend
// handling, and navigation.replace('MpinLogin') are all preserved.
// Only the new-MPIN entry surface changed: AppPinInput's own on-screen
// keypad is replaced by the shared MpinBoxes + native keyboard.

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOtpVerify, removeListener } from 'react-native-otp-verify';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { forgotMpinSendOtp, forgotMpinVerify } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppOTPInput, { AppOTPInputRef } from '../../components/ui/appcomponents/AppOTPInput';
import { useToast } from '../../components/ui/Toast';
import {
  WaveAuthShell,
  PremiumButton,
  MpinBoxes,
  MpinBoxesRef,
  MpinStatusLine,
  MpinSecurityHint,
  MpinSuccessState,
  asText,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ForgotAndVerifyMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.mpin);
  const toast = useToast();
  const { COLORS, FONTS, SIZES,fontScale } = useTheme();

  const otpRef = useRef<AppOTPInputRef>(null);
  const boxesRef = useRef<MpinBoxesRef>(null);
  // Guards against a double-tap firing the same dispatch (and its toast)
  // twice before `loading` re-renders the button into a disabled state.
  const submittingRef = useRef(false);

  const [step, setStep] = useState<'send' | 'verify' | 'done'>('send');
  const [otpCode, setOtpCode] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpErrMsg, setOtpErrMsg] = useState('');
  const [pinError, setPinError] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);

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

  useEffect(() => {
    return () => {
      removeListener();
    };
  }, []);

  const handleSendOtp = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const res = await dispatch(forgotMpinSendOtp());
      if (forgotMpinSendOtp.fulfilled.match(res)) {
        toast.success('OTP Sent!', { message: 'Check your registered mobile' });
        setStep('verify');
        setAutoDetecting(Platform.OS === 'android');
      } else {
        toast.error('Failed', { message: res.payload as string });
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const handleVerify = async () => {
    if (submittingRef.current) return;
    if (otpCode.length < 6) {
      setOtpError(true);
      setOtpErrMsg('Enter the OTP');
      return;
    }
    if (newMpin.length < 4) {
      setPinError('Enter a new 4-digit MPIN');
      return;
    }

    submittingRef.current = true;
    try {
      const res = await dispatch(forgotMpinVerify({ otp: otpCode, newMpin }));
      if (forgotMpinVerify.fulfilled.match(res)) {
        setStep('done');
      } else {
        const msg = (res.payload as string) || 'Unable to reset MPIN';
        setOtpError(true);
        setOtpErrMsg(msg);
        toast.error('Failed', { message: msg });
        otpRef.current?.clear();
        setOtpCode('');
        setNewMpin('');
        boxesRef.current?.clear();
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const handleResend = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      otpRef.current?.clear();
      setOtpCode('');
      setOtpError(false);
      setOtpErrMsg('');
      setAutoDetecting(Platform.OS === 'android');
      const res = await dispatch(forgotMpinSendOtp());
      if (forgotMpinSendOtp.fulfilled.match(res)) {
        toast.success('OTP Resent!', { message: 'New code sent to your registered mobile' });
      } else {
        toast.error('Resend Failed', { message: res.payload as string });
      }
    } finally {
      submittingRef.current = false;
    }
  };

  if (step === 'done') {
    return (
      <MpinSuccessState
        title="MPIN reset"
        description="Your MPIN has been changed successfully. Use your new MPIN to unlock the app."
        ctaLabel="Continue to Login"
        onContinue={() => navigation.replace('MpinLogin')}
      />
    );
  }

  return (
    <WaveAuthShell
      title={step === 'send' ? 'Reset your MPIN' : 'Verify & set new MPIN'}
      subtitle={
        step === 'send'
          ? "We'll send an OTP to your registered mobile number."
          : 'Enter the OTP and set your new MPIN.'
      }
      subtitleStyle={{  fontFamily: "Poppins-SemiBold",
    fontSize: fontScale(12),
    lineHeight: fontScale(12) * 1.35,
    letterSpacing: 0.2,
    color: COLORS.whiteOpacity90, }}
      onBack={() => navigation.goBack()}
      step={{ current: step === 'send' ? 1 : 2, total: 2 }}
    >
      <View style={{ gap: SIZES.margin.xxl }}>
        {step === 'send' ? (
          <>
            <View style={{ alignItems: 'center', gap: SIZES.margin.md, paddingTop: SIZES.margin.sm }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: COLORS.primaryPale,
                }}
              >
                <Ionicons name="phone-portrait-outline" size={SIZES.icon.lg} color={COLORS.primary} />
              </View>

              <Text style={[asText(FONTS.h5), { color: COLORS.inkPrimary, textAlign: 'center' }]}>
                Verify it's you
              </Text>
              <Text
                style={[
                  asText(FONTS.micro),
                  { color: COLORS.inkSecondary, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
                ]}
              >
                We'll send a 6-digit OTP to your registered mobile number so we can confirm it's really you before resetting your MPIN.
              </Text>
            </View>

            <PremiumButton
              label="Send OTP to Mobile"
              size="lg"
              onPress={handleSendOtp}
              loading={loading}
              icon="phone-portrait-outline"
              iconRight="arrow-forward"
            />

            <MpinSecurityHint text="The OTP stays valid for a few minutes." />
          </>
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: SIZES.margin.sm }}>
              <Text style={[asText(FONTS.eyebrow), { color: COLORS.primaryInk }]}>Enter OTP</Text>
              {autoDetecting && (
                <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, textAlign: 'center' }]}>
                  Waiting for SMS auto-detection…
                </Text>
              )}

              <AppOTPInput
                ref={otpRef}
                length={6}
                autoFocus
                value={otpCode}
                error={otpError}
                errorMessage={otpErrMsg}
                onComplete={(code) => {
                  setOtpCode(code);
                  setOtpError(false);
                }}
                onResend={handleResend}
                resendCountdown={30}
              />
            </View>

            <View style={{ alignItems: 'center', gap: SIZES.margin.sm }}>
              <Text style={[asText(FONTS.eyebrow), { color: COLORS.primaryInk }]}>New MPIN</Text>
              <MpinBoxes
                ref={boxesRef}
                value={newMpin}
                onChangeText={(v) => {
                  setNewMpin(v);
                  if (pinError) setPinError('');
                }}
                error={!!pinError}
                disabled={loading}
                autoFocus={false}
              />
              <MpinStatusLine error={pinError} hint={pinError ? undefined : 'Avoid sequences like 1234 or repeated digits'} />
              <MpinSecurityHint />
            </View>

            <PremiumButton
              label="Reset MPIN"
              size="lg"
              onPress={handleVerify}
              loading={loading}
              disabled={otpCode.length < 6 || newMpin.length < 4}
              iconRight="arrow-forward"
            />
          </>
        )}
      </View>
    </WaveAuthShell>
  );
}
