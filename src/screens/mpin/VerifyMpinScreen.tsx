// src/screens/mpin/VerifyMpinScreen.tsx
//
// Flow 3 -- Verify MPIN (normal login/unlock). Now rendered inside the
// shared WaveAuthShell (curved brand-colour header + white card) so it
// reads as the same auth surface as Login/Register/Forgot-MPIN, instead
// of its own bespoke full-bleed canvas. Keeps the shared MpinBoxes
// primitive (native number-pad keyboard) plus a proper biometric CTA
// button rendered above the dots, not hidden inside a keypad corner.
//
// BUSINESS LOGIC -- UNCHANGED: verifyMpin dispatch, onVerifiedSuccess
// (toast, loginCheckService registration, initNotifications,
// navigation.replace('Main')), handleBiometric's full BiometricHelper
// sequence, and the mount-effect auto-prompt are preserved exactly.
// Only the PIN entry surface and biometric affordance changed.

import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, Pressable, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTheme } from "../../theme";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { verifyMpin } from "../../store/mpinSlice";
import { logoutUser } from "../../store/authSlice";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useToast } from "../../components/ui/Toast";
import { initNotifications } from "../../utils/NotificationService";
import { loginCheckService } from "../../api/services/loginCheckService";
import {
  BiometricHelper,
  type BiometricLabel,
} from "../../utils/BiometricHelper";

import {
  WaveAuthShell,
  MpinBoxes,
  MpinBoxesRef,
  MpinStatusLine,
  PremiumButton,
  asText,
} from "../../components/ui/premium";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 60;

export default function VerifyMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.mpin);
  const user = useAppSelector((s) => s.auth.user);
  const toast = useToast();
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const boxesRef = useRef<MpinBoxesRef>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  // ── Attempt lockout ────────────────────────────────────────────
  const [failCount, setFailCount] = useState(0);
  const [lockSeconds, setLockSeconds] = useState<number | null>(null);
  const isLocked = lockSeconds !== null;

  // ── Biometric state ───────────────────────────────────────────
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioLabel, setBioLabel] = useState<BiometricLabel>("Biometrics");
  const [bioBusy, setBioBusy] = useState(false);
  const bioPromptedRef = useRef(false);
  const bioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Manual entry and biometric auto-prompt can race (e.g. the auto-prompt
  // fires while the user is also typing their PIN) -- this makes sure only
  // the first one to succeed shows the toast / navigates.
  const verifiedRef = useRef(false);

  // Shared post-verification success path (used by MPIN entry AND biometrics)
  const onVerifiedSuccess = useCallback(async () => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    toast.success("Welcome back!", {
      message: `Hello, ${user?.username ?? "User"} 👋`,
      position: "top",
    });
    if (user?.username && user?.contactNumber) {
      loginCheckService
        .register({ username: user.username, mobileNumber: user.contactNumber })
        .catch(() => {});
    }
    await initNotifications().catch(() => {});
    navigation.replace("Main");
  }, [navigation, toast, user?.username, user?.contactNumber]);

  const handleComplete = useCallback(
    async (value: string) => {
      if (isLocked || verifiedRef.current) return;
      const res = await dispatch(verifyMpin(value));
      if (verifyMpin.fulfilled.match(res)) {
        setFailCount(0);
        await BiometricHelper.saveMpin(value);
        await onVerifiedSuccess();
      } else {
        const msg =
          typeof res.payload === "string" && res.payload.trim()
            ? res.payload
            : "Incorrect MPIN. Please try again.";
        setPin("");
        setFailCount((prev) => {
          const next = prev + 1;
          if (next >= MAX_ATTEMPTS) {
            setError("");
            setLockSeconds(LOCKOUT_SECONDS);
            return 0;
          }
          setError(msg);
          return next;
        });
      }
    },
    [dispatch, isLocked, onVerifiedSuccess],
  );

  const handleChange = (v: string) => {
    setPin(v);
    if (error) setError("");
  };

  // ── Lockout countdown: after MAX_ATTEMPTS wrong PINs, wait LOCKOUT_SECONDS
  useEffect(() => {
    if (lockSeconds === null) return;
    if (lockSeconds <= 0) {
      setLockSeconds(null);
      setPin("");
      setError("");
      return;
    }
    const t = setTimeout(() => setLockSeconds((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [lockSeconds]);

  // ── Biometric unlock: authenticate -> retrieve stored MPIN -> normal verify
  const handleBiometric = useCallback(async () => {
    if (bioBusy || isLocked || verifiedRef.current) return;
    setBioBusy(true);
    try {
      const ok = await BiometricHelper.authenticate(`Unlock with ${bioLabel}`);
      if (!ok) return;
      const storedMpin = await BiometricHelper.getMpin();
      if (!storedMpin) {
        toast.info("Enter your MPIN once", {
          message: "Biometric unlock will be ready next time",
          position: "top",
        });
        return;
      }
      const res = await dispatch(verifyMpin(storedMpin));
      if (verifyMpin.fulfilled.match(res)) {
        await onVerifiedSuccess();
      } else {
        await BiometricHelper.clearMpin();
        toast.error("Please enter your MPIN", {
          message: "Biometric unlock needs to be set up again",
          position: "top",
        });
      }
    } finally {
      setBioBusy(false);
    }
  }, [bioBusy, bioLabel, dispatch, isLocked, onVerifiedSuccess, toast]);

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
      if (hasMpin && !bioPromptedRef.current) {
        bioPromptedRef.current = true;
        bioTimeoutRef.current = setTimeout(() => handleBiometric(), 600);
      }
    })();
    return () => {
      active = false;
      if (bioTimeoutRef.current) clearTimeout(bioTimeoutRef.current);
    };
  }, [handleBiometric]);

  return (
    <WaveAuthShell
      title="Welcome back"
      footer={
        <Pressable
          onPress={async () => { await dispatch(logoutUser()); navigation.replace('Login'); }}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 })}
        >
          <Ionicons name="log-out-outline" size={14} color={COLORS.inkTertiary} />
          <Text style={[asText(FONTS.microBold), { color: COLORS.inkTertiary }]}>Logout & switch account</Text>
        </Pressable>
      }
    >
      <View style={{ alignItems: "center", gap: moderateScale(4) }}>
        <Text
          style={{
            fontFamily: "Poppins-Medium",
            fontSize: SIZES.heading.h5,
            lineHeight: SIZES.heading.h5 * 1.4,
            color: COLORS.textPrimary,
            paddingBottom: SIZES.margin.sm,
          }}
        >
          {user?.username ? `Hi ${user.username}` : ""}
        </Text>
        <Text
          style={[
            asText(FONTS.microBold),
            {
              color: COLORS.inkSecondary,
              textAlign: "center",
              marginBottom: SIZES.margin.lg,
              lineHeight: 19,
              maxWidth: 280,
            },
          ]}
        >
          Enter your 4-digit MPIN to continue
        </Text>

        <MpinBoxes
          ref={boxesRef}
          value={pin}
          onChangeText={handleChange}
          onComplete={handleComplete}
          error={!!error}
          disabled={loading || bioBusy || isLocked}
        />
        <MpinStatusLine
          loading={loading}
          error={isLocked ? `Too many attempts. Try again in ${lockSeconds}s` : error}
        />

        <Pressable
          onPress={() => navigation.navigate("ForgotMpin")}
          hitSlop={10}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[asText(FONTS.microBold), { color: COLORS.primaryInk }]}>
            Forgot MPIN?
          </Text>
        </Pressable>
      </View>

      {bioSupported && (
        <PremiumButton
          label={`Use ${bioLabel}`}
          variant="outline"
          size="md"
          icon="finger-print-outline"
          onPress={handleBiometric}
          disabled={bioBusy || loading || isLocked}
          loading={bioBusy}
          style={{
            marginTop: SIZES.margin.xxl,
            alignSelf: "center",
            width: "70%",
          }}
        />
      )}

    </WaveAuthShell>
  );
}
