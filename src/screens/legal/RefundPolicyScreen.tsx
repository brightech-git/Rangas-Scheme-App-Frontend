// src/screens/legal/RefundPolicyScreen.tsx

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';

import ScreenWrapper from '../../components/ui/appcomponents/ScreenWrapper';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import ContentWebView from '../../components/ui/appcomponents/ContentWebView';
import PoweredByFooter from '../../components/ui/PoweredByFooter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RefundPolicyScreen() {
  const { COLORS, SIZES } = useTheme();
  const navigation = useNavigation<Nav>();

  return (
    <ScreenWrapper
      scroll
      statusBarStyle="light-content"
      statusBarBg={COLORS.primary}
      edges={[]}
      paddingHorizontal={SIZES.padding.md}
      paddingTop={20}
      paddingBottom={40}
      header={<AppHeader title="Refund Policy" variant="primary" showBack onBackPress={() => navigation.goBack()} />}
    >
      <ContentWebView contentId="REFUND" />
      <PoweredByFooter />
    </ScreenWrapper>
  );
}
