import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { RefreshBar } from '../../components/RefreshBar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SkeletonRow } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import { formatRelative } from '../../utils/format';

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  CHAT: 'chatbubble-ellipses-outline',
  COMMUNITY: 'people-outline',
  EVENT: 'calendar-outline',
  SOCIAL: 'person-add-outline',
  MODERATION: 'shield-checkmark-outline',
};

export function NotificationsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const loadingMoreRef = useRef(false);

  const load = useCallback(async (refresh = false) => {
    const version = ++requestVersion.current;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const result = await BackendAPI.getNotifications({ take: 30 });
      if (version !== requestVersion.current) return;
      setItems(result.notifications || []);
      setNextCursor(result.nextCursor || null);
    } catch (requestError: any) {
      if (version === requestVersion.current) setError(requestError.message);
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const loadMore = async () => {
    if (!nextCursor || loadingMoreRef.current) return;
    const version = requestVersion.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const result = await BackendAPI.getNotifications({ cursor: nextCursor, take: 30 });
      if (version !== requestVersion.current) return;
      setItems((current) => [
        ...current,
        ...(result.notifications || []).filter((item: any) => !current.some((existing) => existing.id === item.id)),
      ]);
      setNextCursor(result.nextCursor || null);
    } catch (requestError: any) {
      if (version === requestVersion.current) setError(requestError.message);
    } finally {
      if (version === requestVersion.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  };

  const unread = useMemo(() => items.filter((item) => !item.readAt), [items]);

  /** Mark every unread as read locally first, then fire the calls in parallel. */
  const markAllRead = async () => {
    if (!unread.length) return;
    triggerHaptic('medium');
    const targets = unread.map((item) => item.id);
    const now = new Date().toISOString();
    setItems((current) => current.map((item) => (item.readAt ? item : { ...item, readAt: now })));
    try {
      await Promise.all(targets.map((id) => BackendAPI.markNotificationRead(id)));
      showToast({ message: 'All caught up.', tone: 'success' });
    } catch {
      showToast({ message: 'Some notifications could not be marked as read.', tone: 'error' });
    }
  };

  const open = async (item: any) => {
    if (!item.readAt) {
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry)),
      );
      BackendAPI.markNotificationRead(item.id).catch(() => undefined);
    }

    if (item.data?.eventId && item.data?.channelKind) {
      navigation.navigate('EventWorkspace', {
        eventId: item.data.eventId,
        tab:
          item.data.channelKind === 'EVENT_ANNOUNCEMENTS'
            ? 'Announcements'
            : item.data.channelKind === 'EVENT_WELCOME'
              ? 'Welcome'
              : 'General',
      });
    } else if (item.data?.chatChannelId && item.data?.streamCid) {
      navigation.navigate('ChatChannel', {
        channel: {
          id: item.data.chatChannelId,
          streamCid: item.data.streamCid,
          kind: item.data.channelKind || 'DIRECT',
          status: 'ACTIVE',
        },
        title: item.title,
        userId: item.actor?.id,
        imageUrl: item.actor?.avatarUrl,
      });
    } else if (item.data?.postId) {
      navigation.navigate('PostDetails', { postId: item.data.postId });
    } else if (item.data?.connectionId || item.category === 'SOCIAL') {
      navigation.navigate('Connections');
    } else if (item.data?.eventId) {
      navigation.navigate('EventDetails', { eventId: item.data.eventId });
    } else if (item.actor?.id) {
      navigation.navigate('PublicProfile', { userId: item.actor.id });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshBar active={refreshing} />
      <ScreenHeader
        navigation={navigation}
        title="Notifications"
        subtitle={unread.length ? `${unread.length} unread` : 'All caught up'}
        right={
          unread.length ? (
            <PressableScale
              style={styles.markAll}
              onPress={markAllRead}
              haptic="none"
              accessibilityRole="button"
              accessibilityLabel={`Mark all ${unread.length} notifications as read`}
            >
              <Ionicons name="checkmark-done" size={15} color={theme.colors.primary} />
              <Text style={styles.markAllText}>Read all</Text>
            </PressableScale>
          ) : null
        }
      />

      {loading && !items.length ? (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.skeletonCard}><SkeletonRow avatarSize={48} /></View>
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, !items.length && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListHeaderComponent={
            error && items.length ? (
              <PressableScale
                style={styles.errorBanner}
                onPress={() => load()}
                accessibilityRole="button"
                accessibilityLabel="Retry loading notifications"
              >
                <Ionicons name="cloud-offline-outline" size={16} color={theme.colors.warning} />
                <Text style={styles.errorBannerText} numberOfLines={2}>{error}</Text>
                <Text style={styles.errorRetry}>RETRY</Text>
              </PressableScale>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.moreLoader} color={theme.colors.primary} /> : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={error ? 'cloud-offline-outline' : 'notifications-outline'}
              tone={error ? 'error' : 'neutral'}
              title={error ? 'Unable to load notifications' : 'All caught up'}
              message={error || 'Connection requests, event updates and community activity will appear here.'}
              actionLabel={error ? 'Try again' : undefined}
              onAction={error ? () => load() : undefined}
            />
          }
          renderItem={({ item, index }) => {
            const isUnread = !item.readAt;
            return (
              <Animated.View
                entering={FadeInDown.delay(Math.min(index, 8) * theme.motion.stagger).duration(theme.motion.duration.normal)}
              >
                <PressableScale
                  style={[styles.item, isUnread && styles.itemUnread]}
                  scaleTo={0.985}
                  onPress={() => open(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${isUnread ? 'Unread. ' : ''}${item.title}. ${item.body}`}
                >
                  {item.actor?.avatarUrl ? (
                    <Avatar uri={item.actor.avatarUrl} name={item.actor.fullName} size={48} />
                  ) : (
                    <View style={[styles.iconTile, isUnread && styles.iconTileUnread]}>
                      <Ionicons
                        name={categoryIcons[item.category] || 'notifications-outline'}
                        size={21}
                        color={isUnread ? theme.colors.primary : theme.colors.textSecondary}
                      />
                    </View>
                  )}

                  <View style={styles.copy}>
                    <View style={styles.titleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      {isUnread ? <View style={styles.dot} /> : null}
                    </View>
                    <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                    <Text style={[styles.time, isUnread && styles.timeUnread]}>{formatRelative(item.createdAt)}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={17} color={theme.colors.textMuted} />
                </PressableScale>
              </Animated.View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primaryMuted,
  },
  markAllText: { ...theme.typography.caption, color: theme.colors.primary, fontFamily: theme.font.bold },

  list: { paddingHorizontal: theme.spacing.gutter, paddingTop: theme.spacing.s, paddingBottom: theme.spacing.xxl, gap: theme.spacing.s },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  skeletonCard: {
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    minHeight: 52,
    marginBottom: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.warningMuted,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.24)',
  },
  errorBannerText: { ...theme.typography.caption, color: theme.colors.textSecondary, flex: 1 },
  errorRetry: { ...theme.typography.caption, color: theme.colors.warning, fontFamily: theme.font.bold },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemUnread: { borderColor: theme.colors.primarySoft, backgroundColor: 'rgba(69,240,106,0.055)' },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  iconTileUnread: { backgroundColor: theme.colors.primaryMuted },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  itemTitle: { ...theme.typography.title, fontSize: 14, flexShrink: 1 },
  body: { ...theme.typography.bodySmall, marginTop: 4 },
  time: { ...theme.typography.caption, fontSize: 11, marginTop: theme.spacing.s },
  timeUnread: { color: theme.colors.primary, fontFamily: theme.font.semibold },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.primary },

  moreLoader: { marginVertical: theme.spacing.m },
});
