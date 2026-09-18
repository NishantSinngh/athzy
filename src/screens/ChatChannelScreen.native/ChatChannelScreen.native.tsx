import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isRunningInExpoGo } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { PressableScale } from '../components/PressableScale';
import { useAthzyStream } from '../chat/StreamContext';
import { ChatChannelMapping, parseStreamCid } from '../chat/types';
import { theme } from '../theme';
import { ChatChannelFallback } from './ChatChannelFallback';

const streamChat = isRunningInExpoGo() ? null : (require('stream-chat-expo') as typeof import('stream-chat-expo'));

function NativeChatChannelScreen({ navigation, route }: any) {
  const { Channel, MessageComposer, MessageList } = streamChat!;
  const { client, error } = useAthzyStream();
  const mapping = route.params?.channel as ChatChannelMapping | undefined;
  const cid = mapping?.status === 'ACTIVE' ? parseStreamCid(mapping.streamCid) : null;
  const channel = useMemo(() => (client && cid ? client.channel(cid.type, cid.id) : null), [cid?.id, cid?.type, client]);

  const title = route.params?.title || 'Conversation';
  const userId = route.params?.userId;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <PressableScale
          style={styles.back}
          scaleTo={0.9}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </PressableScale>

        <PressableScale
          style={styles.identity}
          haptic="selection"
          disabled={!userId}
          onPress={() => userId && navigation.navigate('PublicProfile', { userId })}
          accessibilityRole="button"
          accessibilityLabel={userId ? `View ${title}'s profile` : title}
        >
          <Avatar uri={route.params?.imageUrl} name={title} size={40} circle />
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, !channel && styles.dotOffline]} />
              <Text style={[styles.status, !channel && styles.statusOffline]}>
                {channel ? 'Connected' : 'Unavailable'}
              </Text>
            </View>
          </View>
        </PressableScale>
      </View>

      {channel ? (
        <Channel channel={channel} audioRecordingEnabled={false} disableAttachmentPicker>
          <MessageList />
          <MessageComposer />
        </Channel>
      ) : (
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Conversation unavailable"
          message={error || 'This channel is still being provisioned. Only active channels can be opened.'}
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      )}
    </SafeAreaView>
  );
}

export function ChatChannelScreen(props: any) {
  return streamChat ? <NativeChatChannelScreen {...props} /> : <ChatChannelFallback {...props} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  back: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, minWidth: 0 },
  copy: { flex: 1, minWidth: 0 },
  title: { ...theme.typography.title, fontSize: 15 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
  dotOffline: { backgroundColor: theme.colors.textMuted },
  status: { ...theme.typography.caption, color: theme.colors.primary, fontSize: 11 },
  statusOffline: { color: theme.colors.textMuted },
});
