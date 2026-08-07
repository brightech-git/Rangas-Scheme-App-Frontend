// src/screens/mpin/CreateMpinScreen.tsx

import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createMpin } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppPinInput, { AppPinInputRef } from '../../components/ui/appcomponents/AppPinInput';
import AppLoader from '../../components/ui/appcomponents/AppLoader';
import { useToast } from '../../components/ui/Toast';
import { initNotifications } from '../../utils/NotificationService';
import { AuthShell } from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CreateMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const { loading } = useAppSelector((s) => s.mpin);
  const toast = useToast();
  const { SIZES } = useTheme();

  const pinRef = useRef<AppPinInputRef>(null);
  const [step, setStep]         = useState<1 | 2>(1);
  const [pin, setPin]           = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrMsg, setPinErrMsg] = useState('');

  const handleComplete = async (value: string) => {
    if (step === 1) {
      setPin(value);
      setStep(2);
      pinRef.current?.clear();
      return;
    }

    if (value !== pin) {
      setPinError(true);
      setPinErrMsg('PINs do not match. Try again.');
      pinRef.current?.clear();
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
      await initNotifications().catch(() => {});
      navigation.replace('MpinLogin');
    } else {
      const msg = res.payload as string;
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
    <AuthShell
      eyebrow="Rangas DigiGold"
      title={step === 1 ? 'Set Your MPIN' : 'Confirm MPIN'}
      caption={step === 1 ? 'Choose a 4-digit PIN to secure your account' : 'Re-enter your PIN to confirm'}
      step={{ current: step, total: 2 }}
      align="top"
    >
      <AppLoader visible={loading} message="Creating MPIN..." />
      <View style={{ alignItems: 'center', marginTop: SIZES.margin.lg }}>
        <AppPinInput
          ref={pinRef}
          key={step}
          length={4}
          hint={step === 1 ? 'Enter 4-digit PIN' : 'Re-enter your PIN'}
          variant="dots"
          showKeypad
          autoFocus
          error={pinError}
          errorMessage={pinErrMsg}
          disabled={loading}
          onChangeText={() => setPinError(false)}
          onComplete={handleComplete}
        />
      </View>
    </AuthShell>
  );
}
