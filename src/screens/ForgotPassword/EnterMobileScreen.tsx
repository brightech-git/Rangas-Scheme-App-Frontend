// src/screens/ForgotPassword/EnterMobileScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { forgotPassword } from '../../store/authSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppInput from '../../components/ui/appcomponents/AppInput';
import AppButton from '../../components/ui/appcomponents/AppButton';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import { useToast } from '../../components/ui/Toast';
import { getHash } from 'react-native-otp-verify';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EnterMobileScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const toast = useToast();

  const [mobile, setMobile] = useState('');
  const [error, setError]   = useState('');
  const [hashKey, setHashKey] = useState('');

  useEffect(() => {
    if (Platform.OS === 'android') {
      getHash()
        .then((hash) => { if (hash?.[0]) setHashKey(hash[0]); })
        .catch(() => {});
    }
  }, []);

  const validate = () => {
    if (!mobile.trim())          { setError('Mobile number is required'); return false; }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Forgot Password" showBack />
      <View style={[styles.content, { paddingHorizontal: SIZES.padding.xl }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your registered mobile number.{'\n'}We'll send you an OTP to reset your password.
          </Text>
        </View>

        <View style={styles.card}>
          <AppInput
            label="Mobile Number"
            placeholder="Enter 10-digit mobile"
            leftIcon="call-outline"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={(v) => { setMobile(v); setError(''); }}
            error={error}
            required
            autoFocus
            indicator="required"
          />
          <AppButton
            label="Send OTP"
            onPress={handleSendOtp}
            loading={loading}
            size="lg"
          />
        </View>
      </View>
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
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.padding.xl,
    gap: SIZES.md,
    ...SHADOWS.md,
  },
});
