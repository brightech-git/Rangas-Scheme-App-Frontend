// src/screens/mpin/ResetMpinScreen.tsx

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetMpin } from '../../store/mpinSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';

import AppPinInput, {
  AppPinInputRef,
} from '../../components/ui/appcomponents/AppPinInput';
import AppButton from '../../components/ui/appcomponents/AppButton';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import { useToast } from '../../components/ui/Toast';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ResetMpinScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { loading } = useAppSelector((s) => s.mpin);

  const oldRef = useRef<AppPinInputRef>(null);
  const newRef = useRef<AppPinInputRef>(null);

  const [step, setStep] = useState<'old' | 'new'>('old');

  const [oldMpin, setOldMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');

  const [oldError, setOldError] = useState(false);
  const [newError, setNewError] = useState(false);

  const handleVerifyOldMpin = () => {
    if (oldMpin.length < 4) {
      setOldError(true);
      return;
    }

    setStep('new');
  };

  const handleReset = async () => {
    if (oldMpin.length < 4) {
      setOldError(true);
      return;
    }

    if (newMpin.length < 4) {
      setNewError(true);
      return;
    }

    if (oldMpin === newMpin) {
      setNewError(true);

      toast.warning('Same MPIN', {
        message: 'New MPIN must be different from current MPIN',
      });

      return;
    }

    const res = await dispatch(
      resetMpin({
        oldMpin,
        newMpin,
      })
    );

   if (resetMpin.fulfilled.match(res)) {
  toast.success('MPIN Changed!', {
    message: 'Your MPIN has been updated successfully',
  });

  navigation.replace('MpinLogin');
} else {
      setOldError(true);

      toast.error('Failed', {
        message: (res.payload as string) || 'Unable to change MPIN',
      });

      oldRef.current?.clear();

      setOldMpin('');
      setStep('old');
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      <AppHeader
        title="Change MPIN"
        showBack
        variant="white"
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SIZES.padding.xl,
          paddingTop: SIZES.lg,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'old'
                ? 'Verify Current MPIN'
                : 'Set New MPIN'}
            </Text>

            <Text style={styles.subtitle}>
              {step === 'old'
                ? 'Enter your existing 4-digit MPIN'
                : 'Choose a new secure 4-digit MPIN'}
            </Text>
          </View>

          {step === 'old' && (
            <>
              <View style={styles.card}>
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
                  onChangeText={(v) => {
                    setOldMpin(v);
                    setOldError(false);
                  }}
                  onComplete={(v) => {
                    setOldMpin(v);

                    if (v.length === 4) {
                      setTimeout(() => {
                        setStep('new');
                      }, 200);
                    }
                  }}
                />
              </View>

              <AppButton
                label="Continue"
                onPress={handleVerifyOldMpin}
                disabled={oldMpin.length < 4}
                size="lg"
              />
            </>
          )}

          {step === 'new' && (
            <>
              <View style={styles.card}>
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
                  onChangeText={(v) => {
                    setNewMpin(v);
                    setNewError(false);
                  }}
                  onComplete={(v) => {
                    setNewMpin(v);
                  }}
                />
              </View>

              <AppButton
                label="Change MPIN"
                onPress={handleReset}
                loading={loading}
                disabled={newMpin.length < 4}
                size="lg"
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: SIZES.xl,
    gap: SIZES.xl,
  },

  header: {
    gap: 6,
  },

  title: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.heading.h3,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },

  subtitle: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.font.sm,
    color: COLORS.textSecondary,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.padding.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
});