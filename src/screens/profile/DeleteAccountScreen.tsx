// src/screens/profile/DeleteAccountScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/authSlice';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useUserProfile } from '../../api/hooks/UserProfile/useUserProfile';

import ScreenWrapper from '../../components/ui/appcomponents/ScreenWrapper';
import AppHeader    from '../../components/ui/appcomponents/AppHeader';
import AppText      from '../../components/ui/appcomponents/AppText';
import AppButton    from '../../components/ui/appcomponents/AppButton';
import AppCard      from '../../components/ui/appcomponents/AppCard';
import CustomAlert  from '../../components/ui/CustomAlert';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const INSTRUCTIONS = [
  {
    icon: 'warning-outline',
    title: 'Permanent action',
    body: 'Deleting your account is irreversible. Once confirmed, your account and all associated data will be permanently removed.',
  },
  {
    icon: 'receipt-outline',
    title: 'Transaction history lost',
    body: 'All your payment history, instalment records, and scheme enrolments will be erased and cannot be recovered.',
  },
  {
    icon: 'diamond-outline',
    title: 'Gold & bonus forfeited',
    body: 'Any accrued gold weight, bonus amounts, or pending scheme benefits will be forfeited upon deletion.',
  },
  {
    icon: 'person-remove-outline',
    title: 'Login access revoked',
    body: 'You will be immediately logged out and will no longer be able to sign in with this account.',
  },
  {
    icon: 'call-outline',
    title: 'Contact support first',
    body: 'If you have active schemes or pending payments, please contact Rangas support before deleting your account.',
  },
];

export default function DeleteAccountScreen() {
  const { COLORS, SIZES } = useTheme();
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const reduxUser  = useAppSelector((s) => s.auth.user);
  const { deleteUser } = useUserProfile();

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void }>({
    visible: false, title: '', message: '',
  });

  const showConfirm = () =>
    setAlert({
      visible: true,
      title: 'Delete account?',
      message: 'This permanently deletes your account and all data. This cannot be undone.',
      onConfirm: handleDelete,
    });

  const hideAlert = () => setAlert(a => ({ ...a, visible: false }));

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (reduxUser?.id) await deleteUser(reduxUser.id);
      await dispatch(logoutUser());
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      scroll
      statusBarStyle="light-content"
      statusBarBg={COLORS.primary}
      edges={[]}
      paddingHorizontal={SIZES.padding.md}
      paddingTop={16}
      paddingBottom={40}
      header={<AppHeader title="Delete Account" variant="primary" showBack onBackPress={() => navigation.goBack()} />}
    >
      {/* Warning banner */}
      <View style={[styles.banner, { backgroundColor: COLORS.error + '15', borderColor: COLORS.error + '40' }]}>
        <Ionicons name="alert-circle" size={28} color={COLORS.error} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium" style={{ color: COLORS.error, fontWeight: '700' }}>
            Read before proceeding
          </AppText>
          <AppText variant="caption" color={COLORS.error} style={{ marginTop: 2, opacity: 0.8 }}>
            Account deletion is permanent and cannot be reversed.
          </AppText>
        </View>
      </View>

      {/* Instructions */}
      <AppCard padding="none" style={{ marginTop: 20 }}>
        {INSTRUCTIONS.map((item, i) => (
          <View
            key={item.icon}
            style={[
              styles.row,
              i < INSTRUCTIONS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: COLORS.error + '15' }]}>
              <Ionicons name={item.icon as any} size={18} color={COLORS.error} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium" style={{ fontWeight: '600', color: COLORS.textPrimary }}>
                {item.title}
              </AppText>
              <AppText variant="caption" color={COLORS.textSecondary} style={{ marginTop: 3, lineHeight: 18 }}>
                {item.body}
              </AppText>
            </View>
          </View>
        ))}
      </AppCard>

      {/* Delete button */}
      <View style={{ marginTop: 32, gap: 12 }}>
        <AppButton
          label="Delete My Account"
          variant="danger"
          leftIcon="trash-outline"
          loading={loading}
          onPress={showConfirm}
        />
        <AppButton
          label="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
        />
      </View>

      <CustomAlert
        visible={alert.visible}
        type="confirm"
        title={alert.title}
        message={alert.message}
        buttons={[
          { label: 'Cancel', style: 'secondary', onPress: hideAlert },
          { label: 'Delete', style: 'danger', onPress: () => { hideAlert(); alert.onConfirm?.(); } },
        ]}
        onDismiss={hideAlert}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});
