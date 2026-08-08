
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking, View, ActivityIndicator } from 'react-native';
import * as Screens from './index';
import { useTheme } from '../theme';
import { AsyncStorageHelper } from '../utils/AsyncStorageHelper';
import { initNotifications } from '../utils/NotificationService';
import {
  registerForegroundHandlers,
  handleInitialNotification,
  handleBackgroundOpenedApp,
} from '../utils/NotificationHandler';
import { ApiScheme } from '../types/Scheme/Scheme';
import { PPData, PaymentHistory } from '../types/Account/PhoneDetails';
import SplashScreen from '../screens/splash/SplashScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import PaymentReceiptScreen from '../screens/PaymentReceipt/PaymentReceipt';
import LOGO from '../assets/company/logo.png';
import CustomAlert from '../components/ui/CustomAlert';
import { useAppVersion } from '../utils/useAppVersion';

// SchemeItem = the real API shape (used as nav param for T&C + Join screens)
export type SchemeItem = ApiScheme;

export type RootStackParamList = {
  Onboarding:              undefined;
  Register:                undefined;
  RegisterOTPVerify:       { contactNumber: string };
  Login:                   undefined;
  ForgotPassword:          undefined;
  ForgotVerifyOTP:         { contactNumber: string };
  GoogleContactUpdate:     { userId: number; picture?: string };
  GoogleContactVerifyOTP:  { newContactNumber: string; picture?: string; userId: number };
  CreateMpin:              undefined;
  MpinLogin:               undefined;
  ForgotMpin:              undefined;
  ResetMpin:               undefined;
  LoginLog:undefined;
  ComponentsUsage:         undefined;
  Main:                    undefined;
  WebView:                 { url: string; title?: string };
  Notifications:           undefined;
  ProfileScreen:           undefined;
  SchemeTerms:             { scheme: SchemeItem };
  SchemeJoin:              { scheme: SchemeItem };
  PayInstallment:          { ppData: PPData };
  ViewInstallment:         { ppData: PPData };
  Rates:                   { metal?: 'Gold' | 'Silver' };
  BuyGold:                 undefined;
  Portfolio:               undefined;
  Transactions:            undefined;
  Wallet:                  undefined;
  PaymentReceipt:          { ppData: PPData; payment: PaymentHistory };
  DeleteAccount:           undefined;
};

type InitialRoute = 'Onboarding' | 'Register' | 'Login' | 'CreateMpin' | 'MpinLogin' | 'Main';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { COLORS, isDark } = useTheme();
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);
  const navigationRef = useRef<any>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const { updateAvailable, latestVersion, storeUrl, isMaintenance, maintenanceMsg } = useAppVersion();
  const showUpdate = updateAvailable && !alertDismissed;

  useEffect(() => {
    (async () => {
      // AsyncStorageHelper.clearAll(); // --- IGNORE --- TEMP: Clear storage on every app start for testing
      const onboarded = await AsyncStorageHelper.isOnboarded();
      const token     = await AsyncStorageHelper.getToken();
      const mpinSet   = await AsyncStorageHelper.isMpinSet();

      if (!onboarded)         setInitialRoute('Onboarding');
      else if (!token)        setInitialRoute('Login');
      else if (!mpinSet)      setInitialRoute('CreateMpin');   // logged in but MPIN not yet created
      else                    setInitialRoute('MpinLogin');

      // Init notifications + in-app messaging only when logged in
      if (token) {
        await initNotifications();
      }
    })();
  }, []);

  const onNavigationReady = () => {
    if (!navigationRef.current) return;
    handleInitialNotification(navigationRef.current);
    handleBackgroundOpenedApp(navigationRef.current);
    const unsub = registerForegroundHandlers(navigationRef.current);
    return unsub;
  };

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary:      COLORS.primary,
      background:   COLORS.background,
      card:         COLORS.card,
      text:         COLORS.textPrimary,
      border:       COLORS.border,
      notification: COLORS.secondary,
    },
  };

  if (!initialRoute) {
    return <SplashScreen logo={LOGO} />;
  }

  return (
    <>
    <CustomAlert
      visible={isMaintenance}
      type="warning"
      title="Under Maintenance"
      message={maintenanceMsg}
      dismissible={false}
      buttons={[]}
    />
    <CustomAlert
      visible={showUpdate}
      type="gold"
      title="Update Available"
      message={`Version ${latestVersion} is available. Update now for the latest features and improvements.`}
      dismissible={false}
      buttons={[
        { label: 'Later', style: 'ghost', onPress: () => setAlertDismissed(true) },
        { label: 'Update Now', style: 'primary', onPress: () => { setAlertDismissed(true); Linking.openURL(storeUrl); } },
      ]}
    />
    <NavigationContainer theme={navigationTheme} ref={navigationRef} onReady={onNavigationReady}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background }, animation: 'fade' }}
      >
        <Stack.Screen name="Onboarding"             component={Screens.OnboardingScreen} />
        <Stack.Screen name="Register"                component={Screens.RegisterScreen} />
        <Stack.Screen name="RegisterOTPVerify"       component={Screens.RegisterOTPVerifyScreen} />
        <Stack.Screen name="Login"                   component={Screens.LoginScreen} />
        <Stack.Screen name="ForgotPassword"          component={Screens.EnterMobileScreen} />
        <Stack.Screen name="ForgotVerifyOTP"         component={Screens.VerifyOTPScreen} />
        <Stack.Screen name="GoogleContactUpdate"     component={Screens.GoogleContactUpdateScreen} />
        <Stack.Screen name="GoogleContactVerifyOTP" component={Screens.GoogleContactVerifyOTPScreen} />
        <Stack.Screen name="CreateMpin"              component={Screens.CreateMpinScreen} />
        <Stack.Screen name="MpinLogin"               component={Screens.VerifyMpinScreen} />
        <Stack.Screen name="ForgotMpin"              component={Screens.ForgotAndVerifyMpinScreen} />
        <Stack.Screen name="ResetMpin"               component={Screens.ResetMpinScreen} />
        {__DEV__ && (
          <Stack.Screen name="ComponentsUsage"         component={Screens.ComponentsUsageScreen} />
        )}
        <Stack.Screen name="Main"                    component={Screens.BottomTabNavigator} />
        <Stack.Screen name="WebView"                 component={Screens.WebViewComponent} />
        <Stack.Screen name="Notifications"            component={Screens.NotificationScreen} />
        <Stack.Screen name="ProfileScreen"            component={Screens.ProfileScreen} />
        <Stack.Screen name="SchemeTerms"      component={Screens.SchemeTermsScreen}      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="SchemeJoin"       component={Screens.SchemeJoinScreen}       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="PayInstallment"   component={Screens.PayInstallmentScreen}   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="ViewInstallment"  component={Screens.ViewInstallmentScreen}  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Rates"            component={Screens.RatesScreen}            options={{ animation: 'slide_from_bottom', headerShown: false }} />
        <Stack.Screen name="LoginLog"            component={Screens.LoginLog} />
        <Stack.Screen name="BuyGold"         component={Screens.BuyGoldScreen}         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Portfolio"       component={Screens.PortfolioScreen}       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Transactions"    component={Screens.TransactionsScreen}    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Wallet"          component={WalletScreen}                  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="PaymentReceipt"  component={PaymentReceiptScreen}          options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="DeleteAccount"   component={Screens.DeleteAccountScreen}   options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}
