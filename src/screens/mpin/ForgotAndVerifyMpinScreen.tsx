// src/screens/mpin/ForgotAndVerifyMpinScreen.tsx

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOtpVerify, removeListener } from 'react-native-otp-verify';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { forgotMpinSendOtp, forgotMpinVerify } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppOTPInput, { AppOTPInputRef } from '../../components/ui/appcomponents/AppOTPInput';
import AppPinInput, { AppPinInputRef } from '../../components/ui/appcomponents/AppPinInput';
import { useToast } from '../../components/ui/Toast';
import { AuthShell, PremiumButton, asText } from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ForgotAndVerifyMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.mpin);
  const toast = useToast();
  const { COLORS, FONTS, SIZES } = useTheme();

  const otpRef = useRef<AppOTPInputRef>(null);
  const pinRef = useRef<AppPinInputRef>(null);

  const [step, setStep]               = useState<'send' | 'verify'>('send');
  const [otpCode, setOtpCode]         = useState('');
  const [newMpin, setNewMpin]         = useState('');
  const [otpError, setOtpError]       = useState(false);
  const [otpErrMsg, setOtpErrMsg]     = useState('');
  const [pinError, setPinError]       = useState(false);
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

  useEffect(() => { return () => { removeListener(); }; }, []);

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
    <AuthShell
      eyebrow="Rangas DigiGold"
      title={step === 'send' ? 'Reset Your MPIN' : 'Verify & Set New MPIN'}
      caption={
        step === 'send'
          ? "We'll send an OTP to your registered mobile number."
          : 'Enter the OTP and set your new MPIN.'
      }
      onBack={() => navigation.goBack()}
      align="top"
    >
      <View style={{ gap: 24 }}>
        {step === 'send' ? (
          <PremiumButton
            label="Send OTP to Mobile"
            size="lg"
            onPress={handleSendOtp}
            loading={loading}
            icon="phone-portrait-outline"
            iconRight="arrow-forward"
          />
        ) : (
          <>
            {autoDetecting && (
              <Text style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary, textAlign: 'center' }]}>
                📲 Waiting for SMS auto-detection...
              </Text>
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

            <View style={{ alignItems: 'center' }}>
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

            <PremiumButton
              label="Reset MPIN"
              size="lg"
              onPress={handleVerify}
              loading={loading}
              disabled={otpCode.length < 6 || newMpin.length < 4}
              iconRight="arrow-forward"
              style={{ marginTop: SIZES.margin.md }}
            />
          </>
        )}
      </View>
    </AuthShell>
  );
}
