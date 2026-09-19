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
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { RootNavigator } from './src/navigation';
import { theme } from './src/theme';
import { ToastHost } from './src/components/Toast';
import { onAuthTokenChange, restoreAuthToken } from './src/api/authToken';
import imagePath from './src/assets/imagePath';

const brandRevealDurationMs = 3000;

SplashScreen.preventAutoHideAsync();
if (!isRunningInExpoGo())
  SplashScreen.setOptions({ duration: 350, fade: true });

function LaunchScreen() {
  return (
    <View style={styles.launchScreen}>
      <Image
        source={imagePath.athzySplash}
        style={styles.launchLogo}
        contentFit="cover"
      />
    </View>
  );
}

function AppSession() {
  const [brandRevealComplete, setBrandRevealComplete] = useState(false);
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(
      () => setBrandRevealComplete(true),
      brandRevealDurationMs,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    restoreAuthToken().then(setToken);
    return onAuthTokenChange(setToken);
  }, []);

  // Fixed: Removed `if (true)`. Now waits for both the GIF timer and token to resolve.
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
    <GestureHandlerRootView
      style={styles.app}
      onLayout={() => SplashScreen.hideAsync()}
    >
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
  launchScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  launchGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(69,240,106,0.08)',
  },
  launchLogo: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  launchWordmark: {
    marginTop: 18,
    marginLeft: 8,
    color: theme.colors.text,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 27,
    letterSpacing: 8,
  },
});
