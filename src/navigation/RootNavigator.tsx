
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
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
import { PPData } from '../types/Account/PhoneDetails';

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
  Rates:                   { metal?: 'Gold' | 'Silver' };
};

type InitialRoute = 'Onboarding' | 'Register' | 'Login' | 'CreateMpin' | 'MpinLogin' | 'Main';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { COLORS, isDark } = useTheme();
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);
  const navigationRef = useRef<any>(null);

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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
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
        <Stack.Screen name="ComponentsUsage"         component={Screens.ComponentsUsageScreen} />
        <Stack.Screen name="Main"                    component={Screens.BottomTabNavigator} />
        <Stack.Screen name="WebView"                 component={Screens.WebViewComponent} />
        <Stack.Screen name="Notifications"            component={Screens.NotificationScreen} />
        <Stack.Screen name="ProfileScreen"            component={Screens.ProfileScreen} />
        <Stack.Screen name="SchemeTerms"      component={Screens.SchemeTermsScreen}      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="SchemeJoin"       component={Screens.SchemeJoinScreen}       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="PayInstallment"   component={Screens.PayInstallmentScreen}   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Rates"            component={Screens.RatesScreen}            options={{ animation: 'slide_from_bottom', headerShown: false }} />
        <Stack.Screen name="LoginLog"            component={Screens.LoginLog} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
