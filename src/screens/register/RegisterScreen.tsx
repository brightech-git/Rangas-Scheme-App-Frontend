// src/screens/register/RegisterScreen.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { getHash } from 'react-native-otp-verify';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser, googleLogin, appleLogin } from '../../store/authSlice';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../components/ui/Toast';
import { GOOGLE_IOS_CLIENT_ID } from '@env';
import { Platform } from 'react-native';

import {
  WaveAuthShell,
  PillField,
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

  const [hashKey, setHashKey]         = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading]   = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const emailRef    = useRef<TextInput>(null);
  const mobileRef   = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

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

  };

  const validate = () => {
    if (!form.username.trim())                         { toast.error('Validation Error', { message: 'Username is required' }); return false; }
    if (!form.email.trim())                            { toast.error('Validation Error', { message: 'Email is required' }); return false; }
    if (!/\S+@\S+\.\S+/.test(form.email))             { toast.error('Validation Error', { message: 'Invalid email' }); return false; }
    if (!form.contactNumber.trim())                    { toast.error('Validation Error', { message: 'Mobile number is required' }); return false; }
    if (!/^[0-9]{10}$/.test(form.contactNumber))      { toast.error('Validation Error', { message: 'Enter valid 10-digit number' }); return false; }
    if (!form.password)                                { toast.error('Validation Error', { message: 'Password is required' }); return false; }
    if (form.password.length < 6)                      { toast.error('Validation Error', { message: 'Minimum 6 characters' }); return false; }
    return true;
  };

  const handleRegister = async () => {
    if (!agreedToTerms) {
      toast.warning('Terms Required', {
        message: 'Please agree to the Terms & Conditions to continue',
      });
      return;
    }
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
        navigation.navigate('RegisterOTPVerify', {
          contactNumber: form.contactNumber.trim(),
          username:      form.username.trim(),
          email:         form.email.trim(),
          password:      form.password,
          hashKey,
        });
      }
    } else {
      toast.error('Registration Failed', { message: res.payload as string });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn();

      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        toast.error('Google Sign-In Failed', { message: 'No ID token received' });
        return;
      }

      const res = await dispatch(googleLogin({ idToken }));

      if (googleLogin.fulfilled.match(res)) {
        const user = res.payload;
        await AsyncStorageHelper.saveUserSession(user);
        if (!user.contactNumber && user.id) {
          toast.info('One more step!', { message: 'Please add your mobile number' });
          navigation.navigate('GoogleContactUpdate', { userId: user.id });
        } else {
          toast.success('Welcome!', { message: `Signed in as ${user.username ?? user.email}` });
          const mpinSet = await AsyncStorageHelper.isMpinSet();
          navigation.replace(mpinSet ? 'MpinLogin' : 'CreateMpin');
        }
      } else {
        toast.error('Google Sign-In Failed', { message: res.payload as string });
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) { return; }
      if (error.code === statusCodes.IN_PROGRESS) { return; }
      toast.error('Google Sign-In Failed', { message: error.message ?? 'Something went wrong' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      const { default: appleAuth } = await import('@invertase/react-native-apple-authentication');
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      const { identityToken } = appleAuthResponse;
      if (!identityToken) {
        toast.error('Apple Sign-In Failed', { message: 'No identity token received' });
        return;
      }
      const res = await dispatch(appleLogin({ idToken: identityToken }));
      if (appleLogin.fulfilled.match(res)) {
        const user = res.payload;
        await AsyncStorageHelper.saveUserSession(user);
        if (!user.contactNumber && user.id) {
          toast.info('One more step!', { message: 'Please add your mobile number' });
          navigation.navigate('GoogleContactUpdate', { userId: user.id, picture: user.picture });
        } else {
          toast.success('Welcome!', { message: `Signed in as ${user.username ?? user.email}` });
          const mpinSet = await AsyncStorageHelper.isMpinSet();
          navigation.replace(mpinSet ? 'MpinLogin' : 'CreateMpin');
        }
      } else {
        toast.error('Apple Sign-In Failed', { message: res.payload as string });
      }
    } catch (error: any) {
      if (error.code === '1001') return; // user cancelled
      toast.error('Apple Sign-In Failed', { message: error.message ?? 'Something went wrong' });
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <WaveAuthShell
      activeTab="signup"
      onTabChange={(tab) => {
        if (tab === 'signin') navigation.navigate('Login');
      }}
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
      <View style={{ gap: 14 }}>
        <PillField
          value={form.username}
          placeholder="Username"
          autoCapitalize="none"
          onChangeText={(v) => set('username', v)}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          autoComplete="username"
          textContentType="username"
        />

        <PillField
          ref={emailRef}
          value={form.email}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(v) => set('email', v)}
          returnKeyType="next"
          onSubmitEditing={() => mobileRef.current?.focus()}
          autoComplete="email"
          textContentType="emailAddress"
        />

        <PillField
          ref={mobileRef}
          value={form.contactNumber}
          placeholder="Mobile number"
          keyboardType="phone-pad"
          maxLength={10}
          onChangeText={(v) => set('contactNumber', v)}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          autoComplete="tel"
          textContentType="telephoneNumber"
        />

        <PillField
          ref={passwordRef}
          value={form.password}
          placeholder="Password (minimum 6 characters)"
          isPassword
          autoCapitalize="none"
          onChangeText={(v) => set('password', v)}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
          autoComplete="new-password"
          textContentType="newPassword"
        />
      </View>

      {/* Terms & Conditions agreement */}
      <Pressable
        onPress={() => setAgreedToTerms((p) => !p)}
        style={({ pressed }) => [
          s.termsRow,
          { marginTop: SIZES.margin.xl, opacity: pressed ? 0.7 : 1 },
        ]}
        hitSlop={6}
      >
        <View
          style={[
            s.checkbox,
            {
              borderColor: agreedToTerms ? COLORS.primary : COLORS.hairlineBold,
              backgroundColor: agreedToTerms ? COLORS.primary : 'transparent',
            },
          ]}
        >
          {agreedToTerms && (
            <Ionicons name="checkmark" size={14} color={COLORS.textOnPrimary} />
          )}
        </View>
        <Text style={[asText(FONTS.micro), { color: COLORS.inkSecondary, flex: 1 }]}>
          Agree with{' '}
          <Text style={{ color: COLORS.primaryInk, fontFamily: FONTS.family.semiBold }}>
            Terms &amp; Conditions
          </Text>
        </Text>
      </Pressable>

      <PremiumButton
        label="Create account"
        size="lg"
        onPress={handleRegister}
        loading={loading}
        style={{ marginTop: SIZES.margin.xxl, borderRadius: SIZES.radius.pill }}
      />

      {/* Divider */}
      {/* <View style={[s.dividerRow, { marginTop: SIZES.margin.xxl }]}>
        <View style={[s.rule, { backgroundColor: COLORS.hairline }]} />
        <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkMuted, fontSize: 9 }]}>
          or
        </Text>
        <View style={[s.rule, { backgroundColor: COLORS.hairline }]} />
      </View> */}

      {Platform.OS === 'android' && (
        <PremiumButton
          label={googleLoading ? 'Signing in…' : 'Continue with Google'}
          variant="outline"
          size="lg"
          icon="logo-google"
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          loading={googleLoading}
          style={{ marginTop: SIZES.margin.xl, borderRadius: SIZES.radius.pill }}
        />
      )}

      {/* {Platform.OS === 'ios' && (
        <PremiumButton
          label={appleLoading ? 'Signing in…' : 'Continue with Apple'}
          variant="outline"
          size="lg"
          icon="logo-apple"
          onPress={handleAppleSignIn}
          disabled={appleLoading}
          loading={appleLoading}
          style={{ marginTop: SIZES.margin.xl, borderRadius: SIZES.radius.pill }}
        />
      )} */}
    </WaveAuthShell>
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
