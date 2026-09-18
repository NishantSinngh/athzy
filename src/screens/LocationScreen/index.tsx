import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { BackgroundGlow } from '../../components/BackgroundGlow';
import { Button } from '../../components/Button';
import { GlassCard } from '../../components/GlassCard';
import { Input } from '../../components/Input';
import { PressableScale } from '../../components/PressableScale';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';

export const LocationScreen = ({ navigation, route }: any) => {
  const editing = Boolean(route.params?.editing);
  const [city, setCity] = useState(route.params?.city ?? '');
  const [state, setState] = useState(route.params?.state ?? '');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    typeof route.params?.latitude === 'number' && typeof route.params?.longitude === 'number'
      ? { latitude: route.params.latitude, longitude: route.params.longitude }
      : null,
  );
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cityError, setCityError] = useState('');

  const useDeviceLocation = async () => {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        if (permission.canAskAgain) {
          showToast({ message: 'Location declined. You can still pick your city below.', tone: 'info' });
        } else {
          // A real choice between two destinations — keep the blocking prompt.
          Alert.alert(
            'Location permission is off',
            'Enable location access in Settings, or choose your city manually.',
            [
              { text: 'Choose manually', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
        }
        return;
      }

      if (!(await Location.hasServicesEnabledAsync())) {
        showToast({ message: 'Device location is off. Turn it on or pick your city below.', tone: 'info' });
        return;
      }

      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000, requiredAccuracy: 5000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const [address] = await Location.reverseGeocodeAsync(position.coords);
      const detectedCity = address?.city || address?.district || address?.subregion;

      if (!detectedCity) {
        showToast({ message: 'Found your device but not its city. Enter it manually.', tone: 'info' });
        return;
      }

      setCity(detectedCity);
      setState(address.region ?? '');
      setCityError('');
      setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      showToast({ message: `Located you in ${detectedCity}.`, tone: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Could not detect your location.', tone: 'error' });
    } finally {
      setLocating(false);
    }
  };

  const saveLocation = async (enabled: boolean) => {
    if (enabled && !city.trim()) {
      setCityError('Enter a city, or use your device location.');
      return;
    }
    setCityError('');
    setSaving(true);
    try {
      await BackendAPI.updateLocation(
        enabled
          ? { locationEnabled: true, city: city.trim(), state: state.trim() || undefined, ...(coordinates ?? {}) }
          : { locationEnabled: false },
      );
      if (editing) {
        showToast({ message: 'Location updated.', tone: 'success' });
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error: any) {
      showToast({ message: error.message || 'Could not save your location.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGlow />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <View style={styles.stepPill}>
              <Text style={styles.stepText}>{editing ? 'YOUR AREA' : 'STEP 4 OF 5'}</Text>
            </View>
            {editing ? (
              <PressableScale
                style={styles.close}
                scaleTo={0.9}
                onPress={() => navigation.goBack()}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={21} color={theme.colors.text} />
              </PressableScale>
            ) : null}
          </View>

          <View style={styles.icon}>
            <Ionicons name="location" size={32} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>{editing ? 'Change your playing area' : 'Find your local arena'}</Text>
          <Text style={styles.subtitle}>
            Choose your city for nearby events and venues. If you use device location, Athzy saves the coordinates to
            improve nearby results.
          </Text>

          <PressableScale
            style={styles.device}
            scaleTo={0.985}
            onPress={useDeviceLocation}
            disabled={locating || saving}
            accessibilityRole="button"
            accessibilityLabel="Use current location"
          >
            <View style={styles.deviceIcon}>
              <Ionicons name="navigate" size={21} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.deviceCopy}>
              <Text style={styles.deviceTitle}>Use current location</Text>
              <Text style={styles.deviceSubtitle}>Detect my city from this device</Text>
            </View>
            {locating ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            )}
          </PressableScale>

          {coordinates ? (
            <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)} style={styles.coordNote}>
              <Ionicons name="checkmark-circle" size={15} color={theme.colors.primary} />
              <Text style={styles.coordText}>
                Precise coordinates saved for better nearby results
              </Text>
            </Animated.View>
          ) : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CHOOSE A CITY</Text>
            <View style={styles.dividerLine} />
          </View>

          <GlassCard style={styles.card}>
            <Input
              label="City"
              placeholder="New Delhi"
              icon="business-outline"
              value={city}
              onChangeText={(value: string) => { setCity(value); setCoordinates(null); setCityError(''); }}
              error={cityError}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <Input
              label="State / region (optional)"
              placeholder="Delhi"
              icon="map-outline"
              value={state}
              onChangeText={(value: string) => { setState(value); setCoordinates(null); }}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => saveLocation(true)}
            />
            <Button
              title={editing ? 'Save location' : 'Use this location'}
              trailingIconName={editing ? undefined : 'arrow-forward'}
              onPress={() => saveLocation(true)}
              loading={saving}
              disabled={locating}
              fullWidth
            />
          </GlassCard>

          {!editing ? (
            <PressableScale
              style={styles.skip}
              haptic="selection"
              onPress={() => saveLocation(false)}
              disabled={saving || locating}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
            >
              <Text style={styles.skipText}>Not now</Text>
            </PressableScale>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.m, paddingBottom: theme.spacing.xl },

  topRow: {
    width: '100%',
    minHeight: theme.hitTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.l,
  },
  stepPill: {
    height: 32,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
  },
  stepText: { ...theme.typography.label, color: theme.colors.primary },
  close: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  icon: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
  },
  title: { ...theme.typography.h1, textAlign: 'center', marginTop: theme.spacing.l },
  subtitle: {
    ...theme.typography.bodyLarge,
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 360,
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.l,
  },

  device: {
    width: '100%',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  deviceCopy: { flex: 1, minWidth: 0 },
  deviceTitle: { ...theme.typography.title, fontSize: 15 },
  deviceSubtitle: { ...theme.typography.caption, marginTop: 3 },

  coordNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.m },
  coordText: { ...theme.typography.caption, color: theme.colors.primary },

  divider: { width: '100%', flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.l },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { ...theme.typography.label, color: theme.colors.textMuted, marginHorizontal: theme.spacing.m },

  card: { width: '100%', borderRadius: theme.borderRadius.xxl, padding: theme.spacing.l },

  skip: { minHeight: theme.hitTarget, justifyContent: 'center', paddingHorizontal: theme.spacing.m, marginTop: theme.spacing.m },
  skipText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, fontFamily: theme.font.semibold },
});
