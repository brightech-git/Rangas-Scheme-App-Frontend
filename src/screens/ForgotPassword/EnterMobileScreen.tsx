// src/screens/ForgotPassword/EnterMobileScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { forgotPassword } from '../../store/authSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../components/ui/Toast';
import { getHash } from 'react-native-otp-verify';
import { AuthShell, FormField, PremiumButton } from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EnterMobileScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const toast = useToast();
  const { SIZES } = useTheme();

  const [mobile, setMobile]   = useState('');
  const [error, setError]     = useState('');
  const [hashKey, setHashKey] = useState('');

  useEffect(() => {
    if (Platform.OS === 'android') {
      getHash()
        .then((hash) => { if (hash?.[0]) setHashKey(hash[0]); })
        .catch(() => {});
    }
  }, []);

  const validate = () => {
    if (!mobile.trim())            { setError('Mobile number is required'); return false; }
    if (mobile.trim().length < 10) { setError('Enter valid 10-digit number'); return false; }
    setError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;
    const res = await dispatch(forgotPassword({ contactNumber: mobile.trim(), hashKey }));
    if (forgotPassword.fulfilled.match(res)) {
      toast.success('OTP Sent!', { message: `Code sent to ${mobile.trim()}` });
      navigation.navigate('ForgotVerifyOTP', { contactNumber: mobile.trim() });
    } else {
      toast.error('Failed', { message: res.payload as string });
    }
  };

  return (
    <AuthShell
      eyebrow="Rangas DigiGold"
      title="Forgot Password"
      caption={"Enter your registered mobile number.\nWe'll send you an OTP to reset your password."}
      onBack={() => navigation.goBack()}
      align="top"
    >
      <View style={{ gap: 24 }}>
        <FormField
          surface="hero"
          label="Mobile Number"
          indicator="required"
          icon="call-outline"
          keyboardType="phone-pad"
          maxLength={10}
          value={mobile}
          placeholder="Enter 10-digit mobile"
          autoFocus
          onChangeText={(v) => { setMobile(v.replace(/[^0-9]/g, '')); setError(''); }}
          error={error}
        />

        <PremiumButton
          label="Send OTP"
          size="lg"
          onPress={handleSendOtp}
          loading={loading}
          iconRight="arrow-forward"
          style={{ marginTop: SIZES.margin.md }}
        />
      </View>
    </AuthShell>
  );
}
