import React from "react";
import { View, Text } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import { ThemeProvider } from "./src/providers/ThemeProvider";
import { LanguageProvider } from "./src/providers/LanguageProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import useFonts from "./src/utils/Fonts";
import { ToastProvider } from "./src/components/ui/Toast";

SplashScreen.preventAutoHideAsync();

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { SplashScreen.hideAsync(); }
  render() {
    if (this.state.hasError)
      return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Something went wrong.</Text></View>;
    return this.props.children;
  }
}

function AppContent() {
  const fontsLoaded = useFonts();

  React.useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Fallback: force hide splash after 5s in case fonts hang in production
  React.useEffect(() => {
    const timer = setTimeout(() => SplashScreen.hideAsync(), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1 }} />;

  return <RootNavigator />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <ThemeProvider>
              <LanguageProvider>
                <ToastProvider>
                  <AppContent />
                </ToastProvider>
              </LanguageProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}