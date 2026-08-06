// src/screens/mpin/ResetMpinScreen.tsx

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetMpin } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../components/ui/Toast';
import { AuthShell, PinPad, PremiumButton } from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PIN_LENGTH = 4;

export default function ResetMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { loading } = useAppSelector((s) => s.mpin);
  const { SIZES } = useTheme();

  const [step, setStep] = useState<'old' | 'new'>('old');
  const [oldMpin, setOldMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isOld = step === 'old';

  const handleChange = useCallback(
    (next: string) => {
      setError(null);
      if (isOld) setOldMpin(next);
      else setNewMpin(next);
    },
    [isOld],
  );

  const handleContinue = useCallback(() => {
    if (oldMpin.length < PIN_LENGTH) {
      setError('Enter your current 4-digit MPIN');
      return;
    }
    setError(null);
    setNewMpin('');
    setStep('new');
  }, [oldMpin]);

  const handleBack = useCallback(() => {
    setNewMpin('');
    setError(null);
    setStep('old');
  }, []);

  const handleReset = useCallback(async () => {
    if (newMpin.length < PIN_LENGTH) {
      setError('Enter a new 4-digit MPIN');
      return;
    }
    if (oldMpin === newMpin) {
      setError('New MPIN must be different from current MPIN');
      return;
    }

    const res = await dispatch(resetMpin({ oldMpin, newMpin }));
    if (resetMpin.fulfilled.match(res)) {
      toast.success('MPIN Changed!', { message: 'Your MPIN has been updated successfully' });
      navigation.replace('MpinLogin');
    } else {
      setOldMpin('');
      setNewMpin('');
      setStep('old');
      setError('Incorrect current MPIN. Please try again.');
      toast.error('Failed', { message: (res.payload as string) || 'Unable to change MPIN' });
    }
  }, [oldMpin, newMpin, dispatch, toast, navigation]);

  return (
    <AuthShell
      eyebrow="Rangas DigiGold"
      title={isOld ? 'Current MPIN' : 'New MPIN'}
      caption={
        isOld
          ? 'Enter your existing 4-digit MPIN'
          : 'Enter a new 4-digit MPIN'
      }
      onBack={isOld ? () => navigation.goBack() : handleBack}
      step={{ current: isOld ? 1 : 2, total: 2 }}
      align="top"
    >
      <View style={{ alignItems: 'center' }}>
        <PinPad
          key={step}
          value={isOld ? oldMpin : newMpin}
          onChange={handleChange}
          length={PIN_LENGTH}
          label={isOld ? 'Current MPIN' : 'New MPIN'}
          hint={
            isOld
              ? 'Enter the MPIN you use to unlock the app'
              : 'Avoid sequences like 1234 or repeated digits'
          }
          error={!!error}
          errorMessage={error ?? undefined}
          loading={loading}
        />

        <PremiumButton
          label={isOld ? 'Continue' : 'Change MPIN'}
          size="lg"
          onPress={isOld ? handleContinue : handleReset}
          loading={!isOld && loading}
          disabled={(isOld ? oldMpin : newMpin).length < PIN_LENGTH || loading}
          iconRight="arrow-forward"
          style={{ marginTop: SIZES.margin.xxl }}
        />
      </View>
    </AuthShell>
  );
}
