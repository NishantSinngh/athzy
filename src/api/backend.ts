import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getAuthToken, saveAuthToken } from './authToken';
import type { BookingKind, CreateTournamentEntryInput, Tournament, TournamentEntry, TournamentListParams } from '../types/tournament';
import { PUBLIC_API_BASE_URL } from '@env';

function getLocalApiHost() {
  if (Platform.OS === 'web') return 'localhost';

  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  if (hostUri) {
    try {
      return new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
    } catch {}
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

const API_BASE_URL = PUBLIC_API_BASE_URL
  ? PUBLIC_API_BASE_URL.replace(/\/$/, '')
  : __DEV__
    ? `http://${getLocalApiHost()}:4000/api/v1`
    : '';

if (__DEV__) {
  console.log('[API Configuration] BASE_URL:', API_BASE_URL);
}

async function request<T = any>(endpoint: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Athzy API is not configured for this build. Set EXPO_PUBLIC_API_BASE_URL to the production HTTPS API.');
  }
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  let response: Response;
  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    if (__DEV__) {
      console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`);
      if (options.body) console.log('[API Body]', options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[API Timeout] Aborting ${endpoint} after 15s`);
      controller.abort();
    }, 15000);

    response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (__DEV__) {
      console.log(`[API Response] ${response.status} ${endpoint}`);
    }
  } catch (error: any) {
    if (__DEV__) console.error(`[API Error] ${endpoint}:`, error);
    const detail = error?.message ? ` (${error.message})` : '';
    const connectionHelp = API_BASE_URL.startsWith('https://')
      ? 'Check your internet connection and try again.'
      : 'Check that the phone and development computer are on the same Wi-Fi.';
    throw new Error(`Unable to reach the Athzy API. ${connectionHelp}${detail}`);
  }

  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try { message = JSON.parse(raw).message || raw; } catch {}
    throw new Error(message || `API Error: ${response.status}`);
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

const fetchWithAuth = <T = any>(endpoint: string, options: RequestInit = {}) => request<T>(endpoint, options, true);

export const BackendAPI = {
  login: async (identifier: string, password: string) => { const result = await request<{ token: string; profile: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }, false); await saveAuthToken(result.token); return result; },
  signup: async (data: { email: string; password: string; fullName: string; username?: string }) => { const result = await request<{ token: string; profile: any }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }, false); await saveAuthToken(result.token); return result; },
  getMe: () => fetchWithAuth('/me'),
  updateProfile: (data: any) => fetchWithAuth('/me', { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAccount: () => fetchWithAuth('/me', { method: 'DELETE' }),
  getSports: () => fetchWithAuth('/sports'),
  updateUserSports: (sportIds: string[]) => fetchWithAuth('/sports/me', { method: 'PUT', body: JSON.stringify({ sportIds }) }),
  updateLocation: (location: any) => fetchWithAuth('/me/location', { method: 'PUT', body: JSON.stringify(location) }),
  getHomeFeed: () => fetchWithAuth('/feed/home'),

  getEvents: (params?: { sportId?: string; city?: string }) => {
    const search = new URLSearchParams();
    if (params?.sportId) search.set('sportId', params.sportId);
    if (params?.city) search.set('city', params.city);
    const qs = search.toString();
    return fetchWithAuth(`/events${qs ? `?${qs}` : ''}`);
  },
  getEvent: (id: string) => fetchWithAuth(`/events/${id}`),
  registerForEvent: (eventId: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/events/${eventId}/register`, { method: 'POST', body: JSON.stringify(data) }),

  getTournaments: (params?: TournamentListParams) => {
    const search = new URLSearchParams();
    if (params?.sportId) search.set('sportId', params.sportId);
    if (params?.city) search.set('city', params.city);
    if (params?.status) search.set('status', params.status);
    if (params?.format) search.set('format', params.format);
    if (params?.registrationMode) search.set('registrationMode', params.registrationMode);
    if (params?.take) search.set('take', String(params.take));
    const qs = search.toString();
    return fetchWithAuth<{ tournaments: Tournament[] }>(`/tournaments${qs ? `?${qs}` : ''}`);
  },
  getTournament: (id: string) => fetchWithAuth<{ tournament: Tournament }>(`/tournaments/${id}`),
  createTournamentEntry: (id: string, data: CreateTournamentEntryInput) =>
    fetchWithAuth<{ entry: TournamentEntry }>(`/tournaments/${id}/entries`, { method: 'POST', body: JSON.stringify(data) }),
  withdrawTournamentEntry: (tournamentId: string, entryId: string) =>
    fetchWithAuth<{ entry: TournamentEntry }>(`/tournaments/${tournamentId}/entries/${entryId}`, { method: 'DELETE' }),

  getVenues: (city?: string) => fetchWithAuth(`/venues${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  getVenue: (id: string) => fetchWithAuth(`/venues/${id}`),
  getVenueAvailability: (id: string, data: { date?: string; durationMinutes: number; sportId: string }) => {
    const search = new URLSearchParams({ durationMinutes: String(data.durationMinutes), sportId: data.sportId });
    if (data.date) search.set('date', data.date);
    return fetchWithAuth(`/venues/${id}/availability?${search.toString()}`);
  },
  bookVenue: (id: string, data: { startsAt: string; durationMinutes: number; sportId: string }) =>
    fetchWithAuth(`/venues/${id}/bookings`, { method: 'POST', body: JSON.stringify(data) }),
  cancelVenueBooking: (venueId: string, bookingId: string) =>
    fetchWithAuth(`/venues/${venueId}/bookings/${bookingId}`, { method: 'DELETE' }),

  createImageUpload: (data: { fileName: string; contentType: 'image/jpeg' | 'image/png' | 'image/webp'; purpose: 'avatar' | 'community' }) =>
    fetchWithAuth('/uploads/presign', { method: 'POST', body: JSON.stringify(data) }),

  getMyBookings: () => fetchWithAuth('/me/bookings'),
  getMyBooking: (kind: BookingKind, id: string) => fetchWithAuth(`/me/bookings/${kind}/${id}`),

  getCommunityPosts: (sportSlug?: string) =>
    fetchWithAuth(`/community/posts${sportSlug ? `?sportSlug=${encodeURIComponent(sportSlug)}` : ''}`),
  createCommunityPost: (data: { content: string; sportSlug?: string; imageUrl?: string }) =>
    fetchWithAuth('/community/posts', { method: 'POST', body: JSON.stringify(data) }),
  getCommunityPost: (postId: string) => fetchWithAuth(`/community/posts/${postId}`),
  toggleCommunityReaction: (postId: string) => fetchWithAuth(`/community/posts/${postId}/reactions`, { method: 'POST' }),
  createCommunityComment: (postId: string, content: string) => fetchWithAuth(`/community/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  getFixtures: () => fetchWithAuth('/fixtures'),

  getChatToken: () => fetchWithAuth('/chat/token', { method: 'POST' }),
  getChatConversations: () => fetchWithAuth('/chat/conversations'),
  getEventWorkspace: (eventId: string) => fetchWithAuth(`/events/${eventId}/workspace`),
  postEventAnnouncement: (eventId: string, text: string) =>
    fetchWithAuth(`/events/${eventId}/announcements`, { method: 'POST', body: JSON.stringify({ text }) }),
  retryChatProvisioning: (channelId: string) =>
    fetchWithAuth(`/chat/channels/${channelId}/retry-provisioning`, { method: 'POST' }),

  searchUsers: (query: string, take = 20) =>
    fetchWithAuth(`/users/search?q=${encodeURIComponent(query)}&take=${take}`),
  getUser: (userId: string) => fetchWithAuth(`/users/${userId}`),
  requestConnection: (userId: string) =>
    fetchWithAuth('/connections/requests', { method: 'POST', body: JSON.stringify({ userId }) }),
  getConnections: () => fetchWithAuth('/connections'),
  getFriendsGoing: () => fetchWithAuth('/connections/friends-going'),
  getFriendsGoingToEvent: (eventId: string) => fetchWithAuth(`/connections/friends-going/${eventId}`),
  acceptConnection: (connectionId: string) => fetchWithAuth(`/connections/${connectionId}/accept`, { method: 'POST' }),
  declineConnection: (connectionId: string) => fetchWithAuth(`/connections/${connectionId}/decline`, { method: 'POST' }),
  removeConnection: (connectionId: string) => fetchWithAuth(`/connections/${connectionId}`, { method: 'DELETE' }),
  blockUser: (userId: string) => fetchWithAuth(`/users/${userId}/block`, { method: 'POST' }),
  unblockUser: (userId: string) => fetchWithAuth(`/users/${userId}/block`, { method: 'DELETE' }),
  report: (data: { targetType: 'USER' | 'COMMUNITY_POST' | 'CHAT_MESSAGE'; targetId: string; reason: string; details?: string }) =>
    fetchWithAuth('/reports', { method: 'POST', body: JSON.stringify(data) }),

  registerCurrentDevice: (data: Record<string, unknown>) =>
    fetchWithAuth('/devices/current', { method: 'PUT', body: JSON.stringify(data) }),
  markCurrentDeviceSignedOut: (installationId: string) =>
    fetchWithAuth('/devices/current/sign-out', { method: 'POST', body: JSON.stringify({ installationId }) }),
  registerPushToken: (data: { token: string; platform: 'IOS' | 'ANDROID'; installationId?: string }) =>
    fetchWithAuth('/devices/push-tokens', { method: 'POST', body: JSON.stringify(data) }),
  removePushToken: (tokenId: string) => fetchWithAuth(`/devices/push-tokens/${tokenId}`, { method: 'DELETE' }),
  getNotifications: (params?: { cursor?: string; take?: number }) => {
    const search = new URLSearchParams();
    if (params?.cursor) search.set('cursor', params.cursor);
    if (params?.take) search.set('take', String(params.take));
    const qs = search.toString();
    return fetchWithAuth(`/notifications${qs ? `?${qs}` : ''}`);
  },
  markNotificationRead: (notificationId: string) => fetchWithAuth(`/notifications/${notificationId}/read`, { method: 'POST' }),
};
