// src/screens/mpin/ResetMpinScreen.tsx

import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetMpin } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import AppPinInput, { AppPinInputRef } from '../../components/ui/appcomponents/AppPinInput';
import { useToast } from '../../components/ui/Toast';
import { AuthShell, PremiumButton } from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ResetMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const toast = useToast();
  const { loading } = useAppSelector((s) => s.mpin);
  const { SIZES } = useTheme();

  const oldRef = useRef<AppPinInputRef>(null);
  const newRef = useRef<AppPinInputRef>(null);

  const [step, setStep]       = useState<'old' | 'new'>('old');
  const [oldMpin, setOldMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [oldError, setOldError] = useState(false);
  const [newError, setNewError] = useState(false);

  const handleVerifyOldMpin = () => {
    if (oldMpin.length < 4) { setOldError(true); return; }
    setStep('new');
  };

  const handleReset = async () => {
    if (oldMpin.length < 4) { setOldError(true); return; }
    if (newMpin.length < 4) { setNewError(true); return; }
    if (oldMpin === newMpin) {
      setNewError(true);
      toast.warning('Same MPIN', { message: 'New MPIN must be different from current MPIN' });
      return;
    }

    const res = await dispatch(resetMpin({ oldMpin, newMpin }));
    if (resetMpin.fulfilled.match(res)) {
      toast.success('MPIN Changed!', { message: 'Your MPIN has been updated successfully' });
      navigation.replace('MpinLogin');
    } else {
      setOldError(true);
      toast.error('Failed', { message: (res.payload as string) || 'Unable to change MPIN' });
      oldRef.current?.clear();
      setOldMpin('');
      setStep('old');
    }
  };

  return (
    <AuthShell
      eyebrow="Rangas DigiGold"
      title={step === 'old' ? 'Verify Current MPIN' : 'Set New MPIN'}
      caption={step === 'old' ? 'Enter your existing 4-digit MPIN' : 'Choose a new secure 4-digit MPIN'}
      onBack={() => navigation.goBack()}
      align="top"
    >
      <View style={{ alignItems: 'center', gap: SIZES.margin.xl }}>
        {step === 'old' ? (
          <>
            <AppPinInput
              ref={oldRef}
              length={4}
              label="Current MPIN"
              hint="Enter your existing 4-digit PIN"
              variant="dots"
              showKeypad
              autoFocus
              error={oldError}
              errorMessage="Incorrect MPIN"
              onChangeText={(v) => { setOldMpin(v); setOldError(false); }}
              onComplete={(v) => {
                setOldMpin(v);
                if (v.length === 4) setTimeout(() => setStep('new'), 200);
              }}
            />
            <PremiumButton
              label="Continue"
              size="lg"
              onPress={handleVerifyOldMpin}
              disabled={oldMpin.length < 4}
              iconRight="arrow-forward"
              style={{ width: '100%' }}
            />
          </>
        ) : (
          <>
            <AppPinInput
              ref={newRef}
              length={4}
              label="New MPIN"
              hint="Set your new 4-digit PIN"
              variant="dots"
              showKeypad
              autoFocus
              error={newError}
              errorMessage="Enter a valid 4-digit MPIN"
              onChangeText={(v) => { setNewMpin(v); setNewError(false); }}
              onComplete={(v) => setNewMpin(v)}
            />
            <PremiumButton
              label="Change MPIN"
              size="lg"
              onPress={handleReset}
              loading={loading}
              disabled={newMpin.length < 4}
              iconRight="arrow-forward"
              style={{ width: '100%' }}
            />
          </>
        )}
      </View>
    </AuthShell>
  );
}
