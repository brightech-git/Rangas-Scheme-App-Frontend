// src/screens/mpin/CreateMpinScreen.tsx
//
// Flow 1+2 -- Create MPIN, then Confirm MPIN, then a real success
// state before continuing. Replaces the old AppPinInput+custom-keypad
// screen with the shared MpinBoxes primitive (native number-pad
// keyboard, no on-screen keys) and a dedicated MpinSuccessState
// instead of a toast-and-redirect.
//
// BUSINESS LOGIC -- UNCHANGED: createMpin dispatch, the "already set"
// redirect branch, initNotifications, and navigation.replace target
// are exactly as before.

import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createMpin } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { initNotifications } from '../../utils/NotificationService';
import {
  AuthShell,
  MpinBoxes,
  MpinBoxesRef,
  MpinStatusLine,
  MpinSecurityHint,
  MpinSuccessState,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CreateMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.mpin);
  const { SIZES } = useTheme();

  const boxesRef = useRef<MpinBoxesRef>(null);
  const [step, setStep] = useState<1 | 2 | 'success'>(1);
  const [firstPin, setFirstPin] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleChange = (v: string) => {
    setValue(v);
    if (error) setError('');
  };

  const handleComplete = async (entered: string) => {
    if (step === 1) {
      setFirstPin(entered);
      setValue('');
      setStep(2);
      return;
    }

    if (entered !== firstPin) {
      setError("MPINs don't match. Please try again.");
      setTimeout(() => {
        setValue('');
        setError('');
        setFirstPin('');
        setStep(1);
      }, 900);
      return;
    }

    const res = await dispatch(createMpin(entered));
    if (createMpin.fulfilled.match(res)) {
      setStep('success');
    } else {
      const msg = res.payload as string;
      if (msg?.toLowerCase().includes('already')) {
        navigation.replace('MpinLogin');
      } else {
        setError(msg || 'Unable to create MPIN. Please try again.');
        setValue('');
        setFirstPin('');
        setStep(1);
      }
    }
  };

  const handleContinue = async () => {
    await initNotifications().catch(() => {});
    navigation.replace('MpinLogin');
  };

  if (step === 'success') {
    return (
      <MpinSuccessState
        title="MPIN Created Successfully"
        description="Your MPIN has been set up securely."
        note="You can now use your MPIN to securely access your account."
        ctaLabel="Continue"
        onContinue={handleContinue}
      />
    );
  }

  const isConfirm = step === 2;

  return (
    <AuthShell
      eyebrow="Rangas DigiGold"
      title={isConfirm ? 'Confirm Your MPIN' : 'Create Your MPIN'}
      caption={
        isConfirm
          ? 'Enter your MPIN again to confirm.'
          : 'Set a 4-digit MPIN to securely access your account.'
      }
      step={{ current: isConfirm ? 2 : 1, total: 2 }}
      align="top"
    >
      <View style={{ alignItems: 'center', marginTop: SIZES.margin.xxl, gap: SIZES.margin.lg }}>
        <MpinBoxes
          ref={boxesRef}
          key={step}
          value={value}
          onChangeText={handleChange}
          onComplete={handleComplete}
          error={!!error}
          disabled={loading}
        />
        <MpinStatusLine
          loading={loading}
          error={error}
          hint={isConfirm ? undefined : 'Use 4 digits'}
        />
      </View>

      <View style={{ marginTop: SIZES.margin.xxxl }}>
        <MpinSecurityHint text="Your MPIN helps keep your account secure." />
      </View>
    </AuthShell>
  );
}
