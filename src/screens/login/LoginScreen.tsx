// src/screens/login/LoginScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   Instagram-style login:
//   - Plain filled pill inputs
//   - Solid full-width brand "Log in" button
//   - Centred "Forgot password?" link
//   - Hairline divider
//   - Outline "Continue with Google" button
//   - Outline "Create new account" button
//
// KEYBOARD HANDLING
//   - KeyboardAvoidingView prevents the keyboard from covering content
//   - ScrollView allows the complete form to scroll when keyboard opens
//   - keyboardShouldPersistTaps keeps buttons/inputs responsive
//   - Extra bottom spacing ensures the last button is comfortably visible
//
// BUSINESS LOGIC
//   - GoogleSignin.configure unchanged
//   - loginUser / googleLogin dispatches unchanged
//   - AsyncStorage session handling unchanged
//   - MPIN navigation unchanged
//   - Existing validation unchanged
//   - Existing Google login logging unchanged
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

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
  WaveAuthShell,
  PillField,
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

  const {
    COLORS,
    FONTS,
    SIZES,
    moderateScale,
  } = useTheme();

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<{
    mobile?: string;
    password?: string;
  }>({});

  const [googleLoading, setGoogleLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  // ─────────────────────────────────────────────────────────────
  // GOOGLE SIGN-IN CONFIGURATION
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '401290584973-93gehg6vq34t5p5arn5h90m22e2ckfkb.apps.googleusercontent.com',
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      scopes: ['profile', 'email'],
      offlineAccess: true,
    });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // INPUT HANDLERS
  // ─────────────────────────────────────────────────────────────

  const onMobileChange = (v: string) => {
    const cleanedValue = v.replace(/[^0-9]/g, '');

    setMobile(cleanedValue);

    if (errors.mobile) {
      setErrors((e) => ({
        ...e,
        mobile: undefined,
      }));
    }
  };

  const onPasswordChange = (v: string) => {
    setPassword(v);

    if (errors.password) {
      setErrors((e) => ({
        ...e,
        password: undefined,
      }));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: {
      mobile?: string;
      password?: string;
    } = {};

    if (!mobile.trim()) {
      e.mobile = 'Mobile number is required';
    } else if (!isValidMobile(mobile)) {
      e.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!password) {
      e.password = 'Password is required';
    } else if (!isValidPassword(password)) {
      e.password = 'Password must be at least 4 characters';
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  // ─────────────────────────────────────────────────────────────
  // NORMAL LOGIN
  // ─────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

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

      navigation.replace(
        user.mpinSet === 'Y'
          ? 'MpinLogin'
          : 'CreateMpin',
      );
    } else {
      const msg =
        (res.payload as string) ??
        'Login failed. Please try again.';

      setErrors({
        mobile: msg,
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // GOOGLE LOGIN
  // ─────────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      // Step 1: Check Play Services
      console.log(
        '[Google Login] Step 1: Checking Play Services...',
      );

      await GoogleSignin.hasPlayServices();

      console.log(
        '[Google Login] Step 1: Play Services OK',
      );

      // Step 2: Google Sign-In popup
      console.log(
        '[Google Login] Step 2: Opening Google Sign-In...',
      );

      const userInfo = await GoogleSignin.signIn();

      console.log(
        '[Google Login] Step 2: Google userInfo received:',
        JSON.stringify(userInfo, null, 2),
      );

      const idToken = userInfo.data?.idToken;

      console.log(
        '[Google Login] Step 3: idToken:',
        idToken
          ? `${idToken.substring(0, 30)}...`
          : 'NULL - NO TOKEN',
      );

      if (!idToken) {
        console.error(
          '[Google Login] ERROR: No idToken in userInfo.data',
        );

        toast.error('Google Sign-In Failed', {
          message: 'No ID token received',
        });

        return;
      }

      // Step 4: Send idToken to backend
      console.log(
        '[Google Login] Step 4: Sending idToken to backend POST /google-login...',
      );

      const res = await dispatch(
        googleLogin({
          idToken,
        }),
      );

      console.log(
        '[Google Login] Step 4: Backend response action:',
        res.type,
      );

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
            message: `Signed in as ${
              user.username ?? user.email
            }`,
          });

          const mpinSet =
            await AsyncStorageHelper.isMpinSet();

          console.log(
            '[Google Login] Step 6: mpinSet =',
            mpinSet,
          );

          navigation.replace(
            mpinSet
              ? 'MpinLogin'
              : 'CreateMpin',
          );
        }
      } else {
        console.error(
          '[Google Login] Step 5: Backend REJECTED. Error:',
          res.payload,
        );

        toast.error('Google Sign-In Failed', {
          message: res.payload as string,
        });
      }
    } catch (error: any) {
      console.error(
        '[Google Login] CATCH ERROR:',
        error,
      );

      console.error(
        '[Google Login] Error code:',
        error.code,
      );

      console.error(
        '[Google Login] Error message:',
        error.message,
      );

      if (
        error.code ===
        statusCodes.SIGN_IN_CANCELLED
      ) {
        console.log(
          '[Google Login] User cancelled sign-in',
        );

        return;
      }

      if (
        error.code ===
        statusCodes.IN_PROGRESS
      ) {
        console.log(
          '[Google Login] Sign-in already in progress',
        );

        return;
      }

      toast.error('Google Sign-In Failed', {
        message:
          error.message ??
          'Something went wrong',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────

  return (
    <WaveAuthShell
      activeTab="signin"
      onTabChange={(tab) => {
        if (tab === 'signup') {
          navigation.navigate('Register');
        }
      }}
      footer={
        <Pressable
          onPress={() => navigation.navigate('Register')}
          style={({ pressed }) => [
            s.footerRow,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text
            style={[
              asText(FONTS.micro),
              { color: COLORS.inkTertiary },
            ]}
          >
            Don&apos;t have an account?
          </Text>
          <Text
            style={[
              asText(FONTS.microBold),
              { color: COLORS.primaryInk },
            ]}
          >
            Sign Up
          </Text>
        </Pressable>
      }
    >
      <KeyboardAvoidingView
        style={s.keyboardContainer}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 10 : 0
        }
      >
        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[
            s.scrollContent,
            {
              paddingBottom: moderateScale(50),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios'
              ? 'interactive'
              : 'on-drag'
          }
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {/* ───────────────────────────────────────────────
              FORM FIELDS
          ─────────────────────────────────────────────── */}

          <View style={s.fieldsContainer}>
            {/* Mobile Number */}
            <PillField
              value={mobile}
              onChangeText={onMobileChange}
              placeholder="Mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.mobile}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              autoComplete="tel"
              textContentType="telephoneNumber"
            />

            {/* Password */}
            <PillField
              ref={passwordRef}
              value={password}
              onChangeText={onPasswordChange}
              placeholder="Password"
              autoCapitalize="none"
              isPassword
              error={errors.password}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              autoComplete="password"
              textContentType="password"
            />
          </View>
             {/* ───────────────────────────────────────────────
              FORGOT PASSWORD
          ─────────────────────────────────────────────── */}

          <Pressable
            onPress={() =>
              navigation.navigate(
                'ForgotPassword',
              )
            }
            style={({ pressed }) => [
              s.forgotRow,
              {
                marginTop:
                  SIZES.margin.lg,
                opacity: pressed
                  ? 0.6
                  : 1,
              },
            ]}
          >
            <Text
              style={[
                asText(FONTS.bodyMedium),
                {
                  color:
                    COLORS.primaryInk,
                  fontWeight: '600',
                },
              ]}
            >
              Forgot password?
            </Text>
          </Pressable>

          {/* ───────────────────────────────────────────────
              LOGIN BUTTON
          ─────────────────────────────────────────────── */}

          <PremiumButton
            label="Log in"
            size="lg"
            onPress={handleLogin}
            loading={loading}
            style={{
              ...s.primaryButton,
              marginTop: SIZES.margin.xl,
              borderRadius: SIZES.radius.pill,
            }}
          />

          {/* ───────────────────────────────────────────────
              DIVIDER
          ─────────────────────────────────────────────── */}

          <View
            style={[
              s.dividerRow,
              {
                marginTop:
                  SIZES.margin.xl,
              },
            ]}
          >
            <View
              style={[
                s.rule,
                {
                  backgroundColor:
                    COLORS.hairline,
                },
              ]}
            />

            <Text
              style={[
                asText(FONTS.eyebrow),
                {
                  color:
                    COLORS.inkMuted,
                  fontSize: 11,
                },
              ]}
            >
              or
            </Text>

            <View
              style={[
                s.rule,
                {
                  backgroundColor:
                    COLORS.hairline,
                },
              ]}
            />
          </View>

          {/* ───────────────────────────────────────────────
              GOOGLE LOGIN
          ─────────────────────────────────────────────── */}

          <PremiumButton
            label={
              googleLoading
                ? 'Signing in…'
                : 'Continue with Google'
            }
            variant="outline"
            size="lg"
            icon="logo-google"
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            loading={googleLoading}
            style={{
              ...s.secondaryButton,
              marginTop:
                SIZES.margin.xl,
              borderRadius:
                SIZES.radius.pill,
            }}
          />

          {/* Extra bottom breathing room.
              Helps the last button remain comfortably
              above the keyboard while scrolling. */}
          <View
            style={{
              height: moderateScale(20),
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </WaveAuthShell>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  /**
   * Allows KeyboardAvoidingView to occupy all available
   * space inside WaveAuthShell.
   */
  keyboardContainer: {
    flex: 1,
    minHeight:0,
  },

  /**
   * ScrollView fills the available content area.
   */
  scrollView: {
    flex: 1,
  },

  /**
   * flexGrow ensures the content can fill the screen,
   * while paddingBottom provides comfortable scrolling
   * space when the keyboard is visible.
   */
  scrollContent: {
    flexGrow: 1,
    paddingBottom:40,
  },

  /**
   * Input group spacing.
   */
  fieldsContainer: {
    gap: 14,
  },

  /**
   * Forgot password link.
   */
  forgotRow: {
    // alignItems: 'end',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    flexDirection: 'row',
  },

  /**
   * Divider.
   */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },

  /**
   * Login button.
   */
  primaryButton: {
    width: '100%',
  },

  /**
   * Outline buttons.
   */
  secondaryButton: {
    width: '100%',
  },

  /**
   * "Create new account" footer link row.
   */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
});