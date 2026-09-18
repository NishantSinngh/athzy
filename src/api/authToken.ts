import * as SecureStore from 'expo-secure-store';

const tokenKey = 'athzy.session.token';
let token: string | null = null;
const listeners = new Set<(value: string | null) => void>();

export async function restoreAuthToken() {
  token = await SecureStore.getItemAsync(tokenKey);
  return token;
}

export function getAuthToken() { return token; }
export async function saveAuthToken(value: string) { token = value; await SecureStore.setItemAsync(tokenKey, value); listeners.forEach((listener) => listener(token)); }
export async function clearAuthToken() { token = null; await SecureStore.deleteItemAsync(tokenKey); listeners.forEach((listener) => listener(null)); }
export function onAuthTokenChange(listener: (value: string | null) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
