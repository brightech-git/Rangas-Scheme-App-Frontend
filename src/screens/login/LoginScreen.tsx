// src/screens/login/LoginScreen.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import type { ThemeContextType } from '../../theme/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, googleLogin } from '../../store/authSlice';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppInput, { AppInputRef } from '../../components/ui/appcomponents/AppInput';
import AppButton from '../../components/ui/appcomponents/AppButton';
import { useToast } from '../../components/ui/Toast';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const isValidMobile  = (v: string) => /^[6-9]\d{9}$/.test(v.trim());
const isValidPassword = (v: string) => v.length >= 4;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const toast = useToast();
  const theme = useTheme();
  const { COLORS, SIZES } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [mobile,   setMobile]   = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState<{ mobile?: string; password?: string }>({});
  const [googleLoading, setGoogleLoading] = useState(false);

  const mobileRef   = useRef<AppInputRef>(null);
  const passwordRef = useRef<AppInputRef>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '401290584973-93gehg6vq34t5p5arn5h90m22e2ckfkb.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      offlineAccess: true,
    });
  }, []);

  const onMobileChange = (v: string) => {
    setMobile(v.replace(/[^0-9]/g, ''));           // numeric only
    if (errors.mobile) setErrors(e => ({ ...e, mobile: undefined }));
  };

  const onPasswordChange = (v: string) => {
    setPassword(v);
    if (errors.password) setErrors(e => ({ ...e, password: undefined }));
  };

  const validate = (): boolean => {
    const e: { mobile?: string; password?: string } = {};

    if (!mobile.trim())          e.mobile = 'Mobile number is required';
    else if (!isValidMobile(mobile)) e.mobile = 'Enter a valid 10-digit mobile number';

    if (!password)                   e.password = 'Password is required';
    else if (!isValidPassword(password)) e.password = 'Password must be at least 4 characters';

    setErrors(e);
    if (e.mobile)   mobileRef.current?.shake();
    if (e.password) passwordRef.current?.shake();
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const res = await dispatch(loginUser({
      contactOrEmailOrUsername: mobile.trim(),
      password,
    }));
    if (loginUser.fulfilled.match(res) && res.payload?.token) {
      const user = res.payload;
      await AsyncStorageHelper.saveUserSession(user);
      toast.success('Welcome back!', { message: `Hello, ${user.username ?? 'User'}` });
      const mpinSet = await AsyncStorageHelper.isMpinSet();
      navigation.replace(mpinSet ? 'MpinLogin' : 'CreateMpin');
    } else {
      const msg = (res.payload as string) ?? 'Login failed. Please try again.';
      setErrors({ mobile: msg });
      mobileRef.current?.shake();
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
      console.log('[Google Login] Step 2: Google userInfo received:', JSON.stringify(userInfo, null, 2));

      const idToken = userInfo.data?.idToken;
      console.log('[Google Login] Step 3: idToken:', idToken ? `${idToken.substring(0, 30)}...` : 'NULL - NO TOKEN');

      if (!idToken) {
        console.error('[Google Login] ERROR: No idToken in userInfo.data');
        toast.error('Google Sign-In Failed', { message: 'No ID token received' });
        return;
      }

      // Step 4: Send idToken to backend
      console.log('[Google Login] Step 4: Sending idToken to backend POST /google-login...');
      const res = await dispatch(googleLogin({ idToken }));
      console.log('[Google Login] Step 4: Backend response action:', res.type);
      console.log('[Google Login] Step 4: Backend response payload:', JSON.stringify(res.payload, null, 2));

      if (googleLogin.fulfilled.match(res)) {
        const user = res.payload;
        console.log('[Google Login] Step 5: Login SUCCESS. User:', JSON.stringify(user, null, 2));
        await AsyncStorageHelper.saveUserSession(user);

        if (!user.contactNumber && user.id) {
          console.log('[Google Login] Step 6: No contactNumber found → navigating to GoogleContactUpdate');
          toast.info('One more step!', { message: 'Please add your mobile number' });
          navigation.navigate('GoogleContactUpdate', { userId: user.id, picture: user.picture });
        } else {
          console.log('[Google Login] Step 6: contactNumber exists → checking MPIN...');
          toast.success('Welcome back!', { message: `Signed in as ${user.username ?? user.email}` });
          const mpinSet = await AsyncStorageHelper.isMpinSet();
          console.log('[Google Login] Step 6: mpinSet =', mpinSet);
          navigation.replace(mpinSet ? 'MpinLogin' : 'CreateMpin');
        }
      } else {
        console.error('[Google Login] Step 5: Backend REJECTED. Error:', res.payload);
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
      toast.error('Google Sign-In Failed', { message: error.message ?? 'Something went wrong' });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Branded Header */}
        <View style={styles.headerBg}>
          {/* Gold top stripe */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.secondary, opacity: 0.9 }} />
          {/* Diagonal decorations */}
          {[0, 1, 2].map((i) => (
            <View key={i} style={{
              position: 'absolute', top: -30, bottom: -30,
              right: 10 + i * 22, width: 14,
              backgroundColor: i % 2 === 0 ? COLORS.whiteOpacity10 : COLORS.goldOpacity10,
              transform: [{ rotate: '18deg' }],
            }} />
          ))}
          <View style={styles.headerInner}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.secondary} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your Rangas account</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: SIZES.padding.xl, paddingTop: SIZES.lg }}>

          {/* Form Card */}
          <View style={styles.card}>
            <AppInput
              ref={mobileRef}
              label="Mobile Number"
              placeholder="Enter your 10-digit mobile number"
              leftIcon="call-outline"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={onMobileChange}
              error={errors.mobile}
              shakeOnError
              required
              indicator="required"
            />

            <AppInput
              ref={passwordRef}
              label="Password"
              placeholder="Enter your password"
              leftIcon="lock-closed-outline"
              isPassword
              value={password}
              onChangeText={onPasswordChange}
              error={errors.password}
              shakeOnError
              required
              indicator="required"
            />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} activeOpacity={0.7} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <AppButton label="Sign In" onPress={handleLogin} loading={loading} size="lg" />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.85} disabled={googleLoading}>
            <Ionicons name="logo-google" size={20} color={COLORS.error} />
            <Text style={styles.googleText}>{googleLoading ? 'Signing in…' : 'Continue with Google'}</Text>
          </TouchableOpacity>

          {/* Register */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7} style={styles.registerBtn}>
            <Text style={styles.registerText}>
              Don't have an account?{'  '}
              <Text style={styles.registerLink}>Create Account</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = ({ COLORS, FONTS, SIZES, SHADOWS }: ThemeContextType) =>
  StyleSheet.create({
    // Header: angled bottom + gold accent stripe at top (branded red — same in both themes)
    headerBg: {
      backgroundColor: COLORS.primary,
      paddingTop: SIZES.md,
      paddingBottom: SIZES.xxl,
      paddingHorizontal: SIZES.padding.xl,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 0,
      ...SHADOWS.orange,
      overflow: 'hidden',
    },
    headerInner: { alignItems: 'center', gap: SIZES.sm },
    logoCircle: {
      width: 68,
      height: 68,
      borderRadius: 20,
      backgroundColor: COLORS.goldOpacity20,
      borderWidth: 2,
      borderColor: COLORS.goldOpacity50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SIZES.xs,
    },
    title:        { fontFamily: FONTS.family.bold, fontSize: SIZES.heading.h3, color: COLORS.white, letterSpacing: -0.3 },
    subtitle:     { fontFamily: FONTS.family.regular, fontSize: SIZES.font.md, color: COLORS.whiteOpacity70, marginBottom: SIZES.xs },
    card: {
      backgroundColor: COLORS.card,
      borderRadius: SIZES.radius.xl,
      padding: SIZES.padding.xl,
      gap: SIZES.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      ...SHADOWS.sm,
    },
    forgotRow:    { alignSelf: 'flex-end', marginTop: -SIZES.xs },
    forgotText:   { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.sm, color: COLORS.primary },
    dividerRow:   { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginVertical: SIZES.sm },
    dividerLine:  { flex: 1, height: 1, backgroundColor: COLORS.border },
    dividerText:  { fontFamily: FONTS.family.regular, fontSize: SIZES.font.sm, color: COLORS.textTertiary },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SIZES.sm,
      backgroundColor: COLORS.card,
      borderRadius: SIZES.radius.lg,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      height: SIZES.button.height.lg,
      ...SHADOWS.sm,
    },
    googleText:   { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.md, color: COLORS.textPrimary },
    registerBtn:  { alignItems: 'center', marginTop: SIZES.md },
    registerText: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.md, color: COLORS.textTertiary },
    registerLink: { fontFamily: FONTS.family.semiBold, color: COLORS.primary },
  });
