// src/components/WebViewComponent.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
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
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  const loading = progress < 1;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>

      <AppHeader
        title={'Rangas Jewellery'}
        showBack
        onBackPress={() => navigation.goBack()}
        variant="gold"
      />

      <WebView
        source={{ uri: params.url }}
        onLoadStart={() => { setProgress(0); setError(false); }}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        onLoadEnd={() => setProgress(1)}
        onError={() => { setProgress(1); setError(true); }}
        style={{ flex: 1 }}
        cacheEnabled
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        domStorageEnabled
        javaScriptEnabled
        setSupportMultipleWindows={false}
        renderLoading={() => <View />}
      />

      {loading && !error && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#D8C3AF" />
          <Text style={{ color: COLORS.textSecondary, marginTop: 8, fontSize: 12 }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.overlay}>
          <Ionicons name="wifi-outline" size={40} color={COLORS.textTertiary} />
          <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>Failed to load page</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
