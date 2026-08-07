// src/screens/ForgotPassword/VerifyOTPScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOtpVerify, removeListener } from 'react-native-otp-verify';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetPassword } from '../../store/authSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppOTPInput, { AppOTPInputRef } from '../../components/ui/appcomponents/AppOTPInput';
import { useToast } from '../../components/ui/Toast';
import { AuthShell, FormField, PremiumButton, asText } from '../../components/ui/premium';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ForgotVerifyOTP'>;

export default function VerifyOTPScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const toast = useToast();
  const { COLORS, FONTS, SIZES } = useTheme();

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
    if (!newPassword)                e.newPassword     = 'New password is required';
    else if (newPassword.length < 6) e.newPassword     = 'Minimum 6 characters';
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

    const res = await dispatch(resetPassword({ contactNumber, otp: otpCode, newPassword }));

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
    <AuthShell
      eyebrow="Rangas DigiGold"
      title="Reset Password"
      caption={`OTP sent to +91 ${contactNumber}`}
      onBack={() => navigation.goBack()}
      align="top"
    >
      <View style={{ gap: 24 }}>
        {autoDetecting && (
          <Text style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary, textAlign: 'center' }]}>
            📲 Waiting for SMS auto-detection...
          </Text>
        )}

        {/* OTP Input */}
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

        <FormField
          surface="hero"
          label="New Password"
          indicator="required"
          icon="lock-closed-outline"
          isPassword
          value={newPassword}
          placeholder="Enter new password"
          autoCapitalize="none"
          onChangeText={(v) => { setNewPassword(v); setPassErrors((p) => ({ ...p, newPassword: '' })); }}
          error={passErrors.newPassword}
        />

        <FormField
          surface="hero"
          label="Confirm Password"
          indicator="required"
          icon="lock-closed-outline"
          isPassword
          value={confirmPassword}
          placeholder="Re-enter new password"
          autoCapitalize="none"
          onChangeText={(v) => { setConfirmPassword(v); setPassErrors((p) => ({ ...p, confirmPassword: '' })); }}
          error={passErrors.confirmPassword}
        />

        <PremiumButton
          label="Reset Password"
          size="lg"
          onPress={handleReset}
          loading={loading}
          iconRight="arrow-forward"
          style={{ marginTop: SIZES.margin.md }}
        />
      </View>
    </AuthShell>
  );
}
