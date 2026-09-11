// src/components/WebViewComponent.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Linking } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import AppHeader from './ui/appcomponents/AppHeader';

type WebViewRoute = RouteProp<RootStackParamList, 'WebView'>;

export default function WebViewComponent() {
  const { COLORS } = useTheme();
  const navigation = useNavigation();
  const { params } = useRoute<WebViewRoute>();

  const [pageLoaded, setPageLoaded] = useState(false);
  const [verifying,  setVerifying]  = useState(false);
  const [error,      setError]      = useState(false);

  const didGoBack = React.useRef(false);

  const UPI_SCHEMES = ['upi://', 'phonepe://', 'paytmmp://', 'gpay://', 'tez://', 'bhim://'];

  const handleShouldStartLoadWithRequest = (request: WebViewNavigation): boolean => {
    const url = request.url ?? '';
    if (UPI_SCHEMES.some((s) => url.startsWith(s))) {
      Linking.openURL(url).catch(() => {});
      return false; // block WebView from navigating
    }
    return true;
  };

  const handleNavigationChange = (navState: WebViewNavigation) => {
    const url = navState.url ?? '';
    if (url.includes('/api/v1/payments/callback') && !didGoBack.current) {
      didGoBack.current = true;
      setVerifying(true);
      setTimeout(() => navigation.goBack(), 300);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader
        title={params.title ?? 'Payment'}
        showBack
        onBackPress={() => navigation.goBack()}
        variant="gold"
      />

      <WebView
        source={{ uri: params.url }}
        onLoadStart={() => { setPageLoaded(false); setError(false); }}
        onLoadEnd={() => setPageLoaded(true)}
        onError={() => { setPageLoaded(true); setError(true); }}
        onNavigationStateChange={handleNavigationChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        style={{ flex: 1 }}
        domStorageEnabled
        javaScriptEnabled
        setSupportMultipleWindows={false}
        renderLoading={() => <View />}
      />

      {/* Initial page load — replaces the old % progress */}
      {!pageLoaded && !error && (
        <View style={[s.overlay, { backgroundColor: COLORS.background }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[s.label, { color: COLORS.inkSecondary }]}>
            Loading payment page…
          </Text>
        </View>
      )}

      {/* Post-payment overlay — shown when callback URL detected, stays until goBack completes */}
      {verifying && (
        <View style={[s.overlay, { backgroundColor: COLORS.background }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[s.label, { color: COLORS.inkPrimary, fontWeight: '600' }]}>
            Verifying your payment…
          </Text>
          <Text style={[s.sub, { color: COLORS.inkTertiary }]}>
            Please wait, do not close the app
          </Text>
        </View>
      )}

      {error && (
        <View style={[s.overlay, { backgroundColor: COLORS.background }]}>
          <Ionicons name="wifi-outline" size={40} color={COLORS.inkTertiary} />
          <Text style={[s.label, { color: COLORS.inkSecondary }]}>Failed to load page</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  label: { fontSize: 15, marginTop: 4 },
  sub:   { fontSize: 12, marginTop: 2 },
});
