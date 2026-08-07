// src/screens/register/RegisterOTPVerifyScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOtpVerify, removeListener } from 'react-native-otp-verify';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { verifyOtp } from '../../store/authSlice';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppOTPInput, { AppOTPInputRef } from '../../components/ui/appcomponents/AppOTPInput';
import { useToast } from '../../components/ui/Toast';
import { AuthShell, PremiumButton, asText } from '../../components/ui/premium';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RegisterOTPVerify'>;

export default function RegisterOTPVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const toast = useToast();
  const { COLORS, FONTS, SIZES } = useTheme();

  const { contactNumber } = route.params;
  const otpRef          = useRef<AppOTPInputRef>(null);
  const verifyCalledRef = useRef(false);

  const [otpError, setOtpError]           = useState(false);
  const [otpErrMsg, setOtpErrMsg]         = useState('');
  const [autoDetecting, setAutoDetecting] = useState(Platform.OS === 'android');

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
    <AuthShell
      eyebrow="Rangas DigiGold"
      title="Verify OTP"
      caption={`Enter the 6-digit code sent to +91 ${contactNumber}`}
      onBack={() => navigation.goBack()}
      step={{ current: 2, total: 3 }}
      align="top"
    >
      <View style={{ gap: 24 }}>
        {autoDetecting && (
          <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, textAlign: 'center' }]}>
            📲 Waiting for SMS auto-detection...
          </Text>
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

        <PremiumButton
          label="Verify OTP"
          size="lg"
          onPress={() => {
            const code = otpRef.current?.getValue() ?? '';
            if (code.length < 6 || verifyCalledRef.current) return;
            verifyCalledRef.current = true;
            submitOtp(code);
          }}
          loading={loading}
          iconRight="arrow-forward"
          style={{ marginTop: SIZES.margin.md }}
        />
      </View>
    </AuthShell>
  );
}
