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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        onLoadStart={() => { setLoading(true); setError(false); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        style={{ flex: 1 }}
      />

      {loading && !error && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#D4AF37" />
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
