import { StatusBar } from 'expo-status-bar';
import { isRunningInExpoGo } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Image, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { RootNavigator } from './src/navigation';
import { theme } from './src/theme';
import { ToastHost } from './src/components/Toast';
import { onAuthTokenChange, restoreAuthToken } from './src/api/authToken';

const brandRevealDurationMs = 800;

SplashScreen.preventAutoHideAsync();
if (!isRunningInExpoGo()) SplashScreen.setOptions({ duration: 350, fade: true });

function LaunchScreen() {
  return (
    <View style={styles.launchScreen}>
      <View style={styles.launchGlow} />
      <Image source={require('./assets/splash-icon.png')} style={styles.launchLogo} resizeMode="contain" />
      <Text style={styles.launchWordmark}>ATHZY</Text>
    </View>
  );
}

function AppSession() {
  const [brandRevealComplete, setBrandRevealComplete] = useState(false);
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setBrandRevealComplete(true), brandRevealDurationMs);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    restoreAuthToken().then(setToken);
    return onAuthTokenChange(setToken);
  }, []);

  if (!brandRevealComplete || token === undefined) return <LaunchScreen />;

  return <RootNavigator signedIn={Boolean(token)} />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.app} onLayout={() => SplashScreen.hideAsync()}>
      <SafeAreaProvider>
        <AppSession />
        <ToastHost />
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  launchScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, overflow: 'hidden' },
  launchGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(69,240,106,0.08)' },
  launchLogo: { width: 164, height: 164 },
  launchWordmark: { marginTop: 18, marginLeft: 8, color: theme.colors.text, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 27, letterSpacing: 8 },
});
