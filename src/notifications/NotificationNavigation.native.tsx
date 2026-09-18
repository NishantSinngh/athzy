import { useEffect } from 'react';
import { isRunningInExpoGo } from 'expo';

let lastHandledNotificationId = '';
const notifications = isRunningInExpoGo() ? null : require('expo-notifications') as typeof import('expo-notifications');

export function NotificationNavigation({ navigationRef, ready }: { navigationRef: any; ready: boolean }) {
  useEffect(() => {
    if (!ready || !notifications) return;
    const open = (response: import('expo-notifications').NotificationResponse | null) => {
      if (!response) return;
      const notification = response.notification;
      if (notification.request.identifier === lastHandledNotificationId) return;
      lastHandledNotificationId = notification.request.identifier;
      const data: any = notification.request.content.data || {};
      if (data.eventId && data.channelKind) {
        navigationRef.navigate('EventWorkspace', { eventId: data.eventId, tab: data.channelKind === 'EVENT_ANNOUNCEMENTS' ? 'Announcements' : data.channelKind === 'EVENT_WELCOME' ? 'Welcome' : 'General' });
      } else if (data.chatChannelId && data.streamCid) {
        navigationRef.navigate('ChatChannel', { channel: { id: data.chatChannelId, streamCid: data.streamCid, kind: data.channelKind || 'DIRECT', status: 'ACTIVE' }, title: notification.request.content.title || 'Conversation', userId: data.userId });
      } else if (data.postId) {
        navigationRef.navigate('PostDetails', { postId: data.postId });
      } else if (data.connectionId) {
        navigationRef.navigate('Connections');
      } else if (data.eventId) {
        navigationRef.navigate('EventDetails', { eventId: data.eventId });
      } else {
        navigationRef.navigate('Notifications');
      }
    };

    open(notifications.getLastNotificationResponse());
    const subscription = notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [navigationRef, ready]);

  return null;
}
