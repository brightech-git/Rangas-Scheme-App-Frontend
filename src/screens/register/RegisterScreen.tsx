// src/screens/register/RegisterScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getHash } from 'react-native-otp-verify';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser, googleLogin } from '../../store/authSlice';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../components/ui/Toast';
import { GOOGLE_IOS_CLIENT_ID } from '@env';
import { Platform } from 'react-native';

import {
  AuthShell,
  FormField,
  PremiumButton,
  asText,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const toast = useToast();
  const { COLORS, FONTS, SIZES } = useTheme();

  const [form, setForm] = useState({
    username:      '',
    email:         '',
    contactNumber: '',
    password:      '',
  });
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [hashKey, setHashKey]         = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '401290584973-93gehg6vq34t5p5arn5h90m22e2ckfkb.apps.googleusercontent.com',
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      scopes: ['profile', 'email'],
      offlineAccess: true,
    });
    (async () => {
      try {
        if (Platform.OS === 'android') {
          const hash = await getHash();
          if (hash?.[0]) setHashKey(hash[0]);
        }
      } catch {}
    })();
  }, []);

  const set = (key: string, val: string) => {
    const value = key === 'contactNumber' ? val.replace(/\D/g, '').slice(0, 10) : val;
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim())                              e.username        = 'Username is required';
    if (!form.email.trim())                                 e.email           = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))             e.email           = 'Invalid email';
    if (!form.contactNumber.trim())                         e.contactNumber   = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(form.contactNumber))      e.contactNumber   = 'Enter valid 10-digit number';
    if (!form.password)                                     e.password        = 'Password is required';
    else if (form.password.length < 6)                      e.password        = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const res = await dispatch(registerUser({
      username:      form.username.trim(),
      email:         form.email.trim(),
      contactNumber: form.contactNumber.trim(),
      password:      form.password,
      hashKey,
    }));
    if (registerUser.fulfilled.match(res)) {
      const user = res.payload;
      if (user?.token) {
        await AsyncStorageHelper.saveUserSession(user);
        toast.success('Welcome!', { message: `Account created for ${user.username}` });
        navigation.replace('CreateMpin');
      } else if (user?.message) {
        toast.warning('Registration Issue', { message: user.message });
      } else {
        toast.success('OTP Sent!', { message: 'Enter the OTP sent to your mobile' });
        navigation.navigate('RegisterOTPVerify', { contactNumber: form.contactNumber.trim() });
      }
    } else {
      toast.error('Registration Failed', { message: res.payload as string });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      console.log('[Google Register] Step 1: Checking Play Services...');
      await GoogleSignin.hasPlayServices();
      console.log('[Google Register] Step 1: Play Services OK');

      console.log('[Google Register] Step 2: Opening Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('[Google Register] Step 2: userInfo:', JSON.stringify(userInfo, null, 2));

      const idToken = userInfo.data?.idToken;
      console.log('[Google Register] Step 3: idToken:', idToken ? `${idToken.substring(0, 30)}...` : 'NULL');

      if (!idToken) {
        console.error('[Google Register] ERROR: No idToken');
        toast.error('Google Sign-In Failed', { message: 'No ID token received' });
        return;
      }

      console.log('[Google Register] Step 4: Sending idToken to backend...');
      const res = await dispatch(googleLogin({ idToken }));
      console.log('[Google Register] Step 4: action type:', res.type);
      console.log('[Google Register] Step 4: payload:', JSON.stringify(res.payload, null, 2));

      if (googleLogin.fulfilled.match(res)) {
        const user = res.payload;
        console.log('[Google Register] Step 5: SUCCESS. user:', JSON.stringify(user, null, 2));
        await AsyncStorageHelper.saveUserSession(user);
        if (!user.contactNumber && user.id) {
          console.log('[Google Register] Step 6: No contactNumber → GoogleContactUpdate');
          toast.info('One more step!', { message: 'Please add your mobile number' });
          navigation.navigate('GoogleContactUpdate', { userId: user.id });
        } else {
          console.log('[Google Register] Step 6: contactNumber exists → checking MPIN...');
          toast.success('Welcome!', { message: `Signed in as ${user.username ?? user.email}` });
          const mpinSet = await AsyncStorageHelper.isMpinSet();
          console.log('[Google Register] Step 6: mpinSet =', mpinSet);
          navigation.replace(mpinSet ? 'MpinLogin' : 'CreateMpin');
        }
      } else {
        console.error('[Google Register] Step 5: Backend REJECTED:', res.payload);
        toast.error('Google Sign-In Failed', { message: res.payload as string });
      }
    } catch (error: any) {
      console.error('[Google Register] CATCH ERROR:', error);
      console.error('[Google Register] Error code:', error.code);
      console.error('[Google Register] Error message:', error.message);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) { console.log('[Google Register] Cancelled'); return; }
      if (error.code === statusCodes.IN_PROGRESS) { console.log('[Google Register] In progress'); return; }
      toast.error('Google Sign-In Failed', { message: error.message ?? 'Something went wrong' });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Rangas DigiGold"
      title="Create account"
      caption="Join thousands building their gold savings."
      step={{ current: 1, total: 3 }}
      footer={
        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={({ pressed }) => [s.footerRow, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary }]}>
            Already have an account?
          </Text>
          <Text style={[asText(FONTS.microBold), { color: COLORS.primaryInk }]}>
            Sign In
          </Text>
        </Pressable>
      }
    >
      <View style={{ gap: 22 }}>
        <FormField
          label="Username"
          indicator="required"
          icon="person-outline"
          value={form.username}
          placeholder="Choose a username"
          autoCapitalize="none"
          onChangeText={(v) => set('username', v)}
          error={errors.username}
        />

        <FormField
          label="Email"
          indicator="required"
          icon="mail-outline"
          value={form.email}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(v) => set('email', v)}
          error={errors.email}
        />

        <FormField
          label="Mobile number"
          indicator="required"
          icon="call-outline"
          value={form.contactNumber}
          placeholder="10-digit mobile"
          keyboardType="phone-pad"
          maxLength={10}
          onChangeText={(v) => set('contactNumber', v)}
          error={errors.contactNumber}
        />

        <FormField
          label="Password"
          indicator="required"
          icon="lock-closed-outline"
          isPassword
          value={form.password}
          placeholder="Minimum 6 characters"
          autoCapitalize="none"
          onChangeText={(v) => set('password', v)}
          error={errors.password}
        />

      </View>

      <PremiumButton
        label="Create account"
        size="lg"
        onPress={handleRegister}
        loading={loading}
        iconRight="arrow-forward"
        style={{ marginTop: SIZES.margin.xxl }}
      />

      {/* Divider */}
      <View style={[s.dividerRow, { marginTop: SIZES.margin.xxl }]}>
        <View style={[s.rule, { backgroundColor: COLORS.hairline }]} />
        <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkMuted, fontSize: 9 }]}>
          or
        </Text>
        <View style={[s.rule, { backgroundColor: COLORS.hairline }]} />
      </View>

      <PremiumButton
        label={googleLoading ? 'Signing in…' : 'Continue with Google'}
        variant="outline"
        size="lg"
        icon="logo-google"
        onPress={handleGoogleSignIn}
        disabled={googleLoading}
        loading={googleLoading}
        style={{ marginTop: SIZES.margin.xl }}
      />
    </AuthShell>
  );
}

const s = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule:       { flex: 1, height: StyleSheet.hairlineWidth },
  footerRow:  {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingVertical: 12,
  },
});
