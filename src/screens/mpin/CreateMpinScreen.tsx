// src/screens/mpin/CreateMpinScreen.tsx

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createMpin } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppPinInput, { AppPinInputRef } from '../../components/ui/appcomponents/AppPinInput';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import AppLoader from '../../components/ui/appcomponents/AppLoader';
import { useToast } from '../../components/ui/Toast';
import { initNotifications } from '../../utils/NotificationService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CreateMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.mpin);
  const toast = useToast();

  const pinRef = useRef<AppPinInputRef>(null);

  // step 1 = enter, step 2 = confirm
  const [step, setStep]       = useState<1 | 2>(1);
  const [pin, setPin]         = useState('');
  const [pinError, setPinError]     = useState(false);
  const [pinErrMsg, setPinErrMsg]   = useState('');

  const handleComplete = async (value: string) => {
    if (step === 1) {
      setPin(value);
      setStep(2);
      pinRef.current?.clear();
      return;
    }

    // step 2 — confirm
    if (value !== pin) {
      setPinError(true);
      setPinErrMsg('PINs do not match. Try again.');
      pinRef.current?.clear();
      // go back to step 1
      setTimeout(() => {
        setPinError(false);
        setPinErrMsg('');
        setPin('');
        setStep(1);
        pinRef.current?.clear();
      }, 1200);
      return;
    }

    const res = await dispatch(createMpin(pin));
    if (createMpin.fulfilled.match(res)) {
      toast.success('MPIN Created!', { message: 'Your MPIN is set successfully' });
      await initNotifications();
      navigation.replace('MpinLogin');
    } else {
      const msg = res.payload as string;
      // 409 = MPIN already exists → flag is saved in thunk, go straight to verify
      if (msg?.toLowerCase().includes('already')) {
        toast.warning('MPIN Already Set', { message: 'Redirecting to MPIN login...' });
        navigation.replace('MpinLogin');
      } else {
        toast.error('Failed', { message: msg });
        pinRef.current?.clear();
        setStep(1);
        setPin('');
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppLoader visible={loading} message="Creating MPIN..." />
      <AppHeader title="Create MPIN"  />

      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 1 ? 'Set Your MPIN' : 'Confirm MPIN'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Choose a 4-digit PIN to secure your account'
              : 'Re-enter your PIN to confirm'}
          </Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
        </View>

        {/* Single PIN input with keypad */}
        <View style={styles.card}>
          <AppPinInput
            ref={pinRef}
            key={step}           // remount on step change to reset animation
            length={4}
            hint={step === 1 ? 'Enter 4-digit PIN' : 'Re-enter your PIN'}
            variant="dots"
            showKeypad
            autoFocus
            error={pinError}
            errorMessage={pinErrMsg}
            disabled={loading}
            onChangeText={() => { setPinError(false); }}
            onComplete={handleComplete}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding.xl,
    paddingTop: SIZES.lg,
    gap: SIZES.lg,
    alignItems: 'center',
  },
  header: { gap: 6, alignItems: 'center' },
  title: {
    fontFamily: FONTS.family.bold,
    fontSize:   SIZES.heading.h3,
    color:      COLORS.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.family.regular,
    fontSize:   SIZES.font.sm,
    color:      COLORS.textSecondary,
    textAlign:  'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gray200,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.gray200,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    SIZES.radius.xl,
    padding:         SIZES.padding.xl,
    alignItems:      'center',
    width:           '100%',
    ...SHADOWS.md,
  },
});
