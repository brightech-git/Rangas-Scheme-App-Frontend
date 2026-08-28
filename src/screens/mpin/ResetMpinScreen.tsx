// src/screens/mpin/ResetMpinScreen.tsx
//
// Change MPIN (entered from Profile). Two steps under one AuthShell:
// confirm the current MPIN, then set + confirm-free a new one. Replaces
// PinPad's own on-screen keypad with the shared MpinBoxes primitive
// (native number-pad keyboard) and a proper MpinSuccessState instead
// of a toast + immediate replace.
//
// BUSINESS LOGIC -- UNCHANGED: resetMpin({ oldMpin, newMpin }) dispatch,
// the old->new 2-step flow, and the "new MPIN must differ from current"
// validation are all preserved exactly.

import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetMpin } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../components/ui/Toast';
import {
  AuthShell,
  MpinBoxes,
  MpinBoxesRef,
  MpinStatusLine,
  MpinSecurityHint,
  MpinSuccessState,
  PremiumButton,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PIN_LENGTH = 4;

export default function ResetMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { loading } = useAppSelector((s) => s.mpin);

  const boxesRef = useRef<MpinBoxesRef>(null);

  const [step, setStep] = useState<'old' | 'new' | 'done'>('old');
  const [oldMpin, setOldMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [error, setError] = useState('');

  const isOld = step === 'old';

  const handleChange = useCallback(
    (next: string) => {
      if (error) setError('');
      if (isOld) setOldMpin(next);
      else setNewMpin(next);
    },
    [isOld, error],
  );

  const handleContinue = useCallback((value: string) => {
    if (value.length < PIN_LENGTH) return;
    setError('');
    setNewMpin('');
    setStep('new');
  }, []);

  const handleBack = useCallback(() => {
    setNewMpin('');
    setError('');
    setStep('old');
  }, []);

  const handleReset = useCallback(
    async (value: string) => {
      if (value.length < PIN_LENGTH) return;
      if (oldMpin === value) {
        setError('New MPIN must be different from current MPIN');
        setNewMpin('');
        boxesRef.current?.clear();
        return;
      }

      const res = await dispatch(resetMpin({ oldMpin, newMpin: value }));
      if (resetMpin.fulfilled.match(res)) {
        setStep('done');
      } else {
        setOldMpin('');
        setNewMpin('');
        setStep('old');
        setError('Incorrect current MPIN. Please try again.');
        toast.error('Failed', { message: (res.payload as string) || 'Unable to change MPIN' });
      }
    },
    [oldMpin, dispatch, toast],
  );

  if (step === 'done') {
    return (
      <MpinSuccessState
        title="MPIN changed"
        description="Your MPIN has been updated successfully. Use your new MPIN the next time you unlock the app."
        ctaLabel="Done"
        onContinue={() => navigation.goBack()}
      />
    );
  }

  return (
    <AuthShell
      eyebrow="Rangas DigiGold"
      title={isOld ? 'Current MPIN' : 'New MPIN'}
      caption={isOld ? 'Enter your existing 4-digit MPIN' : 'Enter a new 4-digit MPIN'}
      onBack={isOld ? () => navigation.goBack() : handleBack}
      step={{ current: isOld ? 1 : 2, total: 2 }}
      align="top"
    >
      <View style={{ alignItems: 'center', gap: 16 }}>
        <MpinBoxes
          key={step}
          ref={boxesRef}
          value={isOld ? oldMpin : newMpin}
          onChangeText={handleChange}
          onComplete={isOld ? handleContinue : handleReset}
          error={!!error}
          disabled={loading}
        />
        <MpinStatusLine
          loading={!isOld && loading}
          error={error}
          hint={
            !error
              ? isOld
                ? 'Enter the MPIN you use to unlock the app'
                : 'Avoid sequences like 1234 or repeated digits'
              : undefined
          }
        />
        <MpinSecurityHint />

        <PremiumButton
          label={isOld ? 'Continue' : 'Change MPIN'}
          size="lg"
          onPress={() => (isOld ? handleContinue(oldMpin) : handleReset(newMpin))}
          loading={!isOld && loading}
          disabled={(isOld ? oldMpin : newMpin).length < PIN_LENGTH || loading}
          iconRight="arrow-forward"
          style={{ marginTop: 8, width: '100%' }}
        />
      </View>
    </AuthShell>
  );
}
