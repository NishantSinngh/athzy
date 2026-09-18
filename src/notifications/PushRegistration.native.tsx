import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { isRunningInExpoGo } from 'expo';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { BackendAPI } from '../api/backend';

let registeredTokenId: string | null = null;
const installationIdKey = 'athzy-device-installation-id';
const notifications = isRunningInExpoGo() ? null : require('expo-notifications') as typeof import('expo-notifications');

async function getInstallationId() {
  const existing = await SecureStore.getItemAsync(installationIdKey);
  if (existing) return existing;
  const created = `${Date.now().toString(36)}-${Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('-')}`;
  await SecureStore.setItemAsync(installationIdKey, created);
  return created;
}

export async function unregisterPushToken() {
  const tokenId = registeredTokenId;
  registeredTokenId = null;
  const installationId = await getInstallationId();
  await Promise.all([
    tokenId ? BackendAPI.removePushToken(tokenId).catch(() => undefined) : Promise.resolve(),
    BackendAPI.markCurrentDeviceSignedOut(installationId).catch(() => undefined),
  ]);
}

notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function PushRegistration() {
  useEffect(() => {
    let active = true;
    const register = async () => {
      const installationId = await getInstallationId();
      const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
      await BackendAPI.registerCurrentDevice({
        installationId,
        platform,
        isPhysicalDevice: Device.isDevice,
        deviceType: Device.deviceType == null ? null : Device.DeviceType[Device.deviceType],
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelId: Device.modelId == null ? null : String(Device.modelId),
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        osBuildId: Device.osBuildId,
        platformApiLevel: Device.platformApiLevel,
        appName: Constants.expoConfig?.name ?? null,
        appVersion: Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? null,
        appBuildVersion: Constants.nativeBuildVersion ?? null,
        expoRuntimeVersion: typeof Constants.expoConfig?.runtimeVersion === 'string' ? Constants.expoConfig.runtimeVersion : null,
      });
      if (!notifications || !Device.isDevice || !active) return;
      if (Platform.OS === 'android') {
        await notifications.setNotificationChannelAsync('athzy-updates', {
          name: 'Athzy updates',
          importance: notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 150, 250],
          lightColor: '#45F06A',
        });
      }
      const current = await notifications.getPermissionsAsync();
      const permission = current.status === 'granted' ? current : await notifications.requestPermissionsAsync();
      if (permission.status !== 'granted' || !active) return;

      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;
      const result = await notifications.getExpoPushTokenAsync({ projectId });
      if (!active) return;
      const registration = await BackendAPI.registerPushToken({ token: result.data, platform, installationId });
      registeredTokenId = registration.deviceToken.id;
    };
    register().catch((error) => console.warn('Push registration failed', error));
    return () => { active = false; };
  }, []);

  return null;
}
