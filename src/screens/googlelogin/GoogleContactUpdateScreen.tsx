// src/screens/googlelogin/GoogleContactUpdateScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getHash } from 'react-native-otp-verify';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { authService } from '../../api/services/authService';
import AppInput from '../../components/ui/appcomponents/AppInput';
import AppButton from '../../components/ui/appcomponents/AppButton';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import { useToast } from '../../components/ui/Toast';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'GoogleContactUpdate'>;

export default function GoogleContactUpdateScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const toast      = useToast();

  const { userId, picture } = route.params;

  const [mobile, setMobile]             = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [hashKey, setHashKey]           = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => { initAppHash(); }, []);

  const initAppHash = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const hash = await getHash();
        if (hash?.[0]) setHashKey(hash[0]);
      }
    } catch {}
  }, []);

  const validate = () => {
    if (!mobile.trim())            { setError('Mobile number is required'); return false; }
    if (mobile.trim().length < 10) { setError('Enter valid 10-digit number'); return false; }
    setError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.requestGoogleContactUpdate({
        userId,
        newContactNumber: mobile.trim(),
        usedReferralCode: referralCode.trim() || undefined,
        hashKey:          hashKey || undefined,
      });
      toast.success('OTP Sent!', { message: `Code sent to ${mobile.trim()}` });
      navigation.navigate('GoogleContactVerifyOTP', {
        newContactNumber: mobile.trim(),
        picture,
        userId,
      });
    } catch (err: any) {
      toast.error('Failed', { message: err.message ?? 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Add Mobile Number" showBack variant="white" />
      <View style={[styles.content, { paddingHorizontal: SIZES.padding.xl }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Link Your Mobile</Text>
          <Text style={styles.subtitle}>
            Your Google account needs a mobile number to complete setup.
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
          <AppInput
            label="Referral Code (Optional)"
            placeholder="Enter referral code"
            leftIcon="gift-outline"
            autoCapitalize="characters"
            value={referralCode}
            onChangeText={setReferralCode}
            indicator="optional"
          />
          <AppButton label="Send OTP" onPress={handleSendOtp} loading={loading} size="lg" />
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
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    SIZES.radius.xl,
    padding:         SIZES.padding.xl,
    gap:             SIZES.md,
    ...SHADOWS.md,
  },
});
