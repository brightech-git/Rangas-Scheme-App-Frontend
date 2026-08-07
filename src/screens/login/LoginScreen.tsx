// src/screens/login/LoginScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   Full warm-sand, bottom-weighted. The brand mark and headline sit high;
//   the two fields, the primary action and the Google alternative are
//   stacked in the lower half within thumb reach. No red banner, no
//   floating white card, no diagonal stripe decoration.
//
// WHY THIS IS BETTER UX
//   • Inputs start near the bottom of the screen, so the keyboard
//     covers empty space rather than the field being typed into.
//   • "Forgot password" is a full-width row rather than a small
//     right-aligned link, which is a far easier target.
//   • The distinct sand treatment marks auth as outside the app proper, so the
//     transition into the light product reads as "signed in".
//
// BUSINESS LOGIC — UNCHANGED
//   GoogleSignin.configure, loginUser / googleLogin dispatches,
//   AsyncStorageHelper.saveUserSession, the MPIN branch, every console
//   log in the Google flow, and all validation are preserved exactly.
//
// NEW UI COMPONENTS
//   AuthShell, FormField, PremiumButton
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, googleLogin } from '../../store/authSlice';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../components/ui/Toast';
import { GOOGLE_IOS_CLIENT_ID } from '@env';

import {
  AuthShell,
  FormField,
  PremiumButton,
  asText,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const isValidMobile = (v: string) => /^[6-9]\d{9}$/.test(v.trim());
const isValidPassword = (v: string) => v.length >= 4;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const toast = useToast();
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    mobile?: string;
    password?: string;
  }>({});
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '401290584973-93gehg6vq34t5p5arn5h90m22e2ckfkb.apps.googleusercontent.com',
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      scopes: ['profile', 'email'],
      offlineAccess: true,
    });
  }, []);

  const onMobileChange = (v: string) => {
    setMobile(v.replace(/[^0-9]/g, '')); // numeric only
    if (errors.mobile) setErrors((e) => ({ ...e, mobile: undefined }));
  };

  const onPasswordChange = (v: string) => {
    setPassword(v);
    if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
  };

  const validate = (): boolean => {
    const e: { mobile?: string; password?: string } = {};

    if (!mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!isValidMobile(mobile))
      e.mobile = 'Enter a valid 10-digit mobile number';

    if (!password) e.password = 'Password is required';
    else if (!isValidPassword(password))
      e.password = 'Password must be at least 4 characters';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const res = await dispatch(
      loginUser({
        contactOrEmailOrUsername: mobile.trim(),
        password,
      }),
    );
    if (loginUser.fulfilled.match(res) && res.payload?.token) {
      const user = res.payload;
      await AsyncStorageHelper.saveUserSession(user);
      toast.success('Welcome back!', {
        message: `Hello, ${user.username ?? 'User'}`,
      });
      navigation.replace(user.mpinSet === 'Y' ? 'MpinLogin' : 'CreateMpin');
    } else {
      const msg = (res.payload as string) ?? 'Login failed. Please try again.';
      setErrors({ mobile: msg });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      // Step 1: Check Play Services
      console.log('[Google Login] Step 1: Checking Play Services...');
      await GoogleSignin.hasPlayServices();
      console.log('[Google Login] Step 1: Play Services OK');

      // Step 2: Google Sign-In popup
      console.log('[Google Login] Step 2: Opening Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log(
        '[Google Login] Step 2: Google userInfo received:',
        JSON.stringify(userInfo, null, 2),
      );

      const idToken = userInfo.data?.idToken;
      console.log(
        '[Google Login] Step 3: idToken:',
        idToken ? `${idToken.substring(0, 30)}...` : 'NULL - NO TOKEN',
      );

      if (!idToken) {
        console.error('[Google Login] ERROR: No idToken in userInfo.data');
        toast.error('Google Sign-In Failed', {
          message: 'No ID token received',
        });
        return;
      }

      // Step 4: Send idToken to backend
      console.log(
        '[Google Login] Step 4: Sending idToken to backend POST /google-login...',
      );
      const res = await dispatch(googleLogin({ idToken }));
      console.log('[Google Login] Step 4: Backend response action:', res.type);
      console.log(
        '[Google Login] Step 4: Backend response payload:',
        JSON.stringify(res.payload, null, 2),
      );

      if (googleLogin.fulfilled.match(res)) {
        const user = res.payload;
        console.log(
          '[Google Login] Step 5: Login SUCCESS. User:',
          JSON.stringify(user, null, 2),
        );
        await AsyncStorageHelper.saveUserSession(user);

        if (!user.contactNumber && user.id) {
          console.log(
            '[Google Login] Step 6: No contactNumber found → navigating to GoogleContactUpdate',
          );
          toast.info('One more step!', {
            message: 'Please add your mobile number',
          });
          navigation.navigate('GoogleContactUpdate', {
            userId: user.id,
            picture: user.picture,
          });
        } else {
          console.log(
            '[Google Login] Step 6: contactNumber exists → checking MPIN...',
          );
          toast.success('Welcome back!', {
            message: `Signed in as ${user.username ?? user.email}`,
          });
          const mpinSet = await AsyncStorageHelper.isMpinSet();
          console.log('[Google Login] Step 6: mpinSet =', mpinSet);
          navigation.replace(mpinSet ? 'MpinLogin' : 'CreateMpin');
        }
      } else {
        console.error(
          '[Google Login] Step 5: Backend REJECTED. Error:',
          res.payload,
        );
        toast.error('Google Sign-In Failed', { message: res.payload as string });
      }
    } catch (error: any) {
      console.error('[Google Login] CATCH ERROR:', error);
      console.error('[Google Login] Error code:', error.code);
      console.error('[Google Login] Error message:', error.message);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[Google Login] User cancelled sign-in');
        return;
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[Google Login] Sign-in already in progress');
        return;
      }
      toast.error('Google Sign-In Failed', {
        message: error.message ?? 'Something went wrong',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Rangas DigiGold"
      title="Welcome back"
      caption="Sign in to continue building your gold savings."
      align="top"
      style={{ paddingTop: moderateScale(24) }}
      
    >
      <View style={{ gap: 22 }}>
        <FormField
          surface="hero"
          label="Mobile number"
          indicator="required"
          icon="call-outline"
          value={mobile}
          placeholder="10-digit mobile"
          keyboardType="phone-pad"
          maxLength={10}
          onChangeText={onMobileChange}
          error={errors.mobile}
        />

        <FormField
          surface="hero"
          label="Password"
          indicator="required"
          icon="lock-closed-outline"
          isPassword
          value={password}
          placeholder="Your password"
          autoCapitalize="none"
          onChangeText={onPasswordChange}
          error={errors.password}
        />
      </View>

      {/* Forgot password — full-width row, easy target */}
      <Pressable
        onPress={() => navigation.navigate('ForgotPassword')}
        style={({ pressed }) => [
          s.forgotRow,
          {
            marginTop: SIZES.margin.xl,
            paddingVertical: SIZES.padding.md,
            borderTopColor: COLORS.heroHairline,
            borderBottomColor: COLORS.heroHairline,
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[asText(FONTS.micro), { color: COLORS.heroTextSecondary }]}
        >
          Forgot your password?
        </Text>
        <Ionicons
          name="chevron-forward"
          size={SIZES.icon.sm}
          color={COLORS.heroTextMuted}
        />
      </Pressable>

      <PremiumButton
        label="Sign in"
        size="lg"
        onPress={handleLogin}
        loading={loading}
        iconRight="arrow-forward"
        style={{ marginTop: SIZES.margin.xxl }}
      />

      {/* Divider */}
      <View style={[s.dividerRow, { marginTop: SIZES.margin.xxl }]}>
        <View style={[s.rule, { backgroundColor: COLORS.heroHairline }]} />
        <Text
          style={[
            asText(FONTS.eyebrow),
            { color: COLORS.heroTextMuted, fontSize: 9 },
          ]}
        >
          or
        </Text>
        <View style={[s.rule, { backgroundColor: COLORS.heroHairline }]} />
      </View>

      <PremiumButton
        label={googleLoading ? 'Signing in…' : 'Continue with Google'}
        variant="glass"
        size="lg"
        icon="logo-google"
        onPress={handleGoogleSignIn}
        disabled={googleLoading}
        loading={googleLoading}
        style={{ marginTop: SIZES.margin.xl }}
      />
      <Pressable
          onPress={() => navigation.navigate('Register')}
          style={({ pressed }) => [s.footerRow, { opacity: pressed ? 0.6 : 1 ,marginTop: SIZES.margin.xl}]}
        >
          <Text
            style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary }]}
          >
            New to Rangas?
          </Text>
          <Text style={[asText(FONTS.microBold), { color: COLORS.heroAccent }]}>
            Create an account
          </Text>
        </Pressable>
    </AuthShell>
  );
}

const s = StyleSheet.create({
  forgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
});
