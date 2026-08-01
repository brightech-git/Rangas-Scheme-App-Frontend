// src/screens/mpin/VerifyMpinScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   A true lock screen: full noir, no card, no elevation. Identity sits
//   at the top as an avatar monogram plus name, the four dots sit in
//   the optical centre, and a borderless keypad occupies the lower
//   third with the biometric affordance in the keypad's bottom-left
//   position — where a phone's own lock screen puts it.
//
// WHY THIS IS BETTER UX
//   • The keypad is part of the screen rather than nested inside a
//     white card inside a light page, which removes two layers of
//     visual noise from the most-used screen in the app.
//   • Biometric unlock is a keypad key, not a separate button below
//     the pad, so it's reachable without moving the thumb.
//   • An incorrect PIN shakes the dot row in place instead of only
//     raising a toast, so the failure is felt where it happened.
//
// BUSINESS LOGIC — UNCHANGED
//   verifyMpin dispatch, onVerifiedSuccess (toast, loginCheckService
//   registration, initNotifications, navigation.replace('Main')),
//   handleBiometric's full BiometricHelper sequence, and the mount
//   effect that auto-prompts once are preserved exactly. Only the PIN
//   entry surface changed — AppPinInput is replaced by an inline
//   noir keypad that calls the same handleComplete on the 4th digit.
// ─────────────────────────────────────────────────────────────────

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { verifyMpin } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../components/ui/Toast';
import { initNotifications } from '../../utils/NotificationService';
import { loginCheckService } from '../../api/services/loginCheckService';
import {
  BiometricHelper,
  type BiometricLabel,
} from '../../utils/BiometricHelper';

import { asText, initial } from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PIN_LENGTH = 4;

// ── Keypad key ──────────────────────────────────────────────────
const Key = memo(function Key({
  label,
  icon,
  onPress,
  disabled,
}: {
  label?: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { COLORS, FONTS, moderateScale } = useTheme();
  const press = useRef(new Animated.Value(0)).current;

  const bg = press.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.10)'],
  });

  if (!label && !icon) return <View style={s.key} />;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() =>
        Animated.timing(press, {
          toValue: 1,
          duration: 60,
          useNativeDriver: false,
        }).start()
      }
      onPressOut={() =>
        Animated.timing(press, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false,
        }).start()
      }
      style={s.key}
    >
      <Animated.View
        style={[
          s.keyInner,
          {
            width: moderateScale(66),
            height: moderateScale(66),
            borderRadius: moderateScale(33),
            backgroundColor: bg,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        {label ? (
          <Text
            style={{
              fontFamily: FONTS.family.regular,
              fontSize: moderateScale(28),
              color: COLORS.heroTextPrimary,
              letterSpacing: -0.5,
            }}
          >
            {label}
          </Text>
        ) : (
          <Ionicons
            name={icon as any}
            size={moderateScale(24)}
            color={COLORS.heroTextSecondary}
          />
        )}
      </Animated.View>
    </Pressable>
  );
});

export default function VerifyMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.mpin);
  const user = useAppSelector((s) => s.auth.user);
  const toast = useToast();
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrMsg, setPinErrMsg] = useState('');
  const shake = useRef(new Animated.Value(0)).current;

  // ── Biometric state ───────────────────────────────────────────
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false); // user opted in via Profile
  const [bioLabel, setBioLabel] = useState<BiometricLabel>('Biometrics');
  const [bioBusy, setBioBusy] = useState(false);
  const bioPromptedRef = useRef(false); // auto-prompt only once per mount

  const runShake = useCallback(() => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [shake]);

  // Shared post-verification success path (used by MPIN entry AND biometrics)
  const onVerifiedSuccess = useCallback(async () => {
    toast.success('Welcome back!', {
      message: `Hello, ${user?.username ?? 'User'} 👋`,
      position: 'top',
    });
    // Record login-check entry (fire-and-forget; never blocks login)
    if (user?.username && user?.contactNumber) {
      loginCheckService
        .register({
          username: user.username,
          mobileNumber: user.contactNumber,
        })
        .catch(() => {
          /* ignore — non-critical */
        });
    }
    await initNotifications().catch(() => {
      /* ignore — never blocks navigation */
    });
    navigation.replace('Main');
  }, [navigation, toast, user?.username, user?.contactNumber]);

  const handleComplete = useCallback(
    async (value: string) => {
      const res = await dispatch(verifyMpin(value));
      if (verifyMpin.fulfilled.match(res)) {
        // Biometric unlock is opt-in only (toggled from Profile) — never auto-enabled here.
        await onVerifiedSuccess();
      } else {
        const msg =
          typeof res.payload === 'string' && res.payload.trim()
            ? res.payload
            : 'Incorrect MPIN. Please try again.';
        setPinError(true);
        setPinErrMsg(msg);
        setPin('');
        runShake();
        toast.error('Incorrect MPIN', {
          message: msg,
          position: 'top',
          duration: 3500,
        });
      }
    },
    [dispatch, onVerifiedSuccess, runShake, toast],
  );

  // ── Keypad handlers (UI only) ──
  const pushDigit = useCallback(
    (d: string) => {
      if (loading || bioBusy) return;
      setPinError(false);
      setPinErrMsg('');
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + d;
        if (next.length === PIN_LENGTH) {
          // defer so the 4th dot paints before the request starts
          setTimeout(() => handleComplete(next), 60);
        }
        return next;
      });
    },
    [loading, bioBusy, handleComplete],
  );

  const popDigit = useCallback(() => {
    setPinError(false);
    setPinErrMsg('');
    setPin((p) => p.slice(0, -1));
  }, []);

  // ── Biometric unlock: authenticate → retrieve stored MPIN → normal verify
  const handleBiometric = useCallback(async () => {
    if (bioBusy) return;
    setBioBusy(true);
    try {
      const ok = await BiometricHelper.authenticate(`Unlock with ${bioLabel}`);
      if (!ok) return;
      const storedMpin = await BiometricHelper.getMpin();
      if (!storedMpin) {
        toast.info('Enter your MPIN once', {
          message: 'Biometric unlock will be ready next time',
          position: 'top',
        });
        return;
      }
      const res = await dispatch(verifyMpin(storedMpin));
      if (verifyMpin.fulfilled.match(res)) {
        await onVerifiedSuccess();
      } else {
        // Stored MPIN no longer valid (e.g. changed on another device) → clear + fall back
        await BiometricHelper.clearMpin();
        toast.error('Please enter your MPIN', {
          message: 'Biometric unlock needs to be set up again',
          position: 'top',
        });
      }
    } finally {
      setBioBusy(false);
    }
  }, [bioBusy, bioLabel, dispatch, onVerifiedSuccess, toast]);

  // Detect biometric support on mount; auto-prompt if enabled & an MPIN is stored
  useEffect(() => {
    let active = true;
    (async () => {
      const supported = await BiometricHelper.isSupported();
      if (!active) return;
      setBioSupported(supported);
      if (!supported) return;
      setBioLabel(await BiometricHelper.getLabel());
      const [enabled, hasMpin] = await Promise.all([
        BiometricHelper.isEnabled(),
        BiometricHelper.hasStoredMpin(),
      ]);
      if (!active) return;
      setBioEnabled(enabled);
      if (enabled && hasMpin && !bioPromptedRef.current) {
        bioPromptedRef.current = true;
        handleBiometric();
      }
    })();
    return () => {
      active = false;
    };
  }, [handleBiometric]);

  const showBio = bioSupported && bioEnabled;
  const avatar = moderateScale(64);

  return (
    <View style={[s.root, { backgroundColor: COLORS.heroCanvas }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.heroCanvas} />

      <LinearGradient
        colors={COLORS.gradient.heroNoir as [string, string, ...string[]]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[s.bloom, { backgroundColor: COLORS.heroGoldVeil }]} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* ── Identity ── */}
        <View style={[s.identity, { paddingTop: SIZES.layout.section }]}>
          <View
            style={[
              s.avatar,
              {
                width: avatar,
                height: avatar,
                borderRadius: avatar / 2,
                backgroundColor: COLORS.heroAccentSoft,
                borderColor: COLORS.heroAccent,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: FONTS.family.semiBold,
                fontSize: moderateScale(24),
                color: COLORS.heroAccent,
              }}
            >
              {initial(user?.username)}
            </Text>
          </View>

          <Text
            style={[
              asText(FONTS.displaySm),
              { color: COLORS.heroTextPrimary, marginTop: SIZES.margin.lg },
            ]}
          >
            {user?.username ?? 'User'}
          </Text>
          <Text
            style={[
              asText(FONTS.micro),
              { color: COLORS.heroTextTertiary, marginTop: 2 },
            ]}
          >
            Enter your MPIN to unlock
          </Text>
        </View>

        {/* ── Dots + Keypad + Footer centered ── */}
        <View style={{ flex: 1, justifyContent: 'center' }}>

        {/* ── Dots ── */}
        <View style={s.dotsZone}>
          <Animated.View
            style={[s.dotsRow, { transform: [{ translateX: shake }] }]}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => {
              const filled = i < pin.length;
              return (
                <View
                  key={i}
                  style={[
                    s.dot,
                    {
                      width: moderateScale(14),
                      height: moderateScale(14),
                      borderRadius: moderateScale(7),
                      backgroundColor: pinError
                        ? COLORS.primaryLighter
                        : filled
                        ? COLORS.heroAccent
                        : 'transparent',
                      borderColor: pinError
                        ? COLORS.primaryLighter
                        : filled
                        ? COLORS.heroAccent
                        : COLORS.heroHairlineBold,
                    },
                  ]}
                />
              );
            })}
          </Animated.View>

          <View style={{ height: 22, justifyContent: 'center' }}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.heroAccent} />
            ) : pinError && pinErrMsg ? (
              <Text
                numberOfLines={1}
                style={[
                  asText(FONTS.micro),
                  { color: COLORS.primaryLighter, fontSize: 11 },
                ]}
              >
                {pinErrMsg}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Keypad ── */}
        <View style={[s.keypad, { paddingHorizontal: SIZES.layout.gutter }]}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, ri) => (
            <View key={ri} style={s.keyRow}>
              {row.map((d) => (
                <Key
                  key={d}
                  label={d}
                  onPress={() => pushDigit(d)}
                  disabled={loading || bioBusy}
                />
              ))}
            </View>
          ))}

          <View style={s.keyRow}>
            {showBio ? (
              <Key
                icon={
                  bioLabel === 'Face ID'
                    ? 'scan-outline'
                    : 'finger-print-outline'
                }
                onPress={handleBiometric}
                disabled={bioBusy || loading}
              />
            ) : (
              <View style={s.key} />
            )}
            <Key
              label="0"
              onPress={() => pushDigit('0')}
              disabled={loading || bioBusy}
            />
            <Key
              icon="backspace-outline"
              onPress={popDigit}
              disabled={loading || bioBusy || pin.length === 0}
            />
          </View>
        </View>

        {/* ── Footer links ── */}
        <View
          style={[
            s.footer,
            {
              paddingHorizontal: SIZES.layout.gutter,
              paddingTop: SIZES.padding.lg,
            },
          ]}
        >
          <Pressable
            onPress={() => navigation.navigate('ForgotMpin')}
            hitSlop={10}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text
              style={[asText(FONTS.microBold), { color: COLORS.heroAccent }]}
            >
              Forgot MPIN?
            </Text>
          </Pressable>

          <View
            style={[s.vRule, { backgroundColor: COLORS.heroHairlineBold }]}
          />

          <Pressable
            onPress={() => navigation.replace('Login')}
            hitSlop={10}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text
              style={[
                asText(FONTS.micro),
                { color: COLORS.heroTextTertiary },
              ]}
            >
              Use password
            </Text>
          </Pressable>
        </View>

        </View>{/* end center wrapper */}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bloom: {
    position: 'absolute',
    top: -140,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  identity: { alignItems: 'center' },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dotsZone: { alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 24 },
  dotsRow: { flexDirection: 'row', gap: 20 },
  dot: { borderWidth: 1.5 },
  keypad: { gap: 6 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-around' },
  key: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  keyInner: { alignItems: 'center', justifyContent: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 18,
  },
  vRule: { width: StyleSheet.hairlineWidth, height: 14 },
});
