import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { RefreshBar } from '../../components/RefreshBar';
import { SkeletonRow } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { activeChannels, ChatEvent, DirectConversation } from '../../chat/types';
import { theme } from '../../theme';
import { formatCountdown, formatDayBadge, isListingLive } from '../../utils/format';

type Filter = 'All' | 'Events' | 'Direct';
type InboxItem = { type: 'event'; event: ChatEvent } | { type: 'direct'; direct: DirectConversation };

export function ChatInboxScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [direct, setDirect] = useState<DirectConversation[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'quiet' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else if (mode === 'quiet') setSyncing(true);
    try {
      const result = await BackendAPI.getChatConversations();
      setEvents(result.conversations?.events || []);
      setDirect(result.conversations?.direct || []);
      setError('');
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to load conversations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load('quiet'); }, [load]));

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const eventItems: InboxItem[] = events
      .filter((event) => activeChannels(event.chatChannels).length > 0)
      .filter((event) => (filter === 'All' || filter === 'Events'))
      .filter((event) => event.title.toLowerCase().includes(normalized))
      .map((event) => ({ type: 'event', event }));

    const directItems: InboxItem[] =
      filter === 'All' || filter === 'Direct'
        ? direct
            .filter((item) => (item.user.fullName || 'Player').toLowerCase().includes(normalized))
            .map((item) => ({ type: 'direct', direct: item }))
        : [];

    // Soonest events first — the conversation you need is the one starting next.
    eventItems.sort(
      (a, b) =>
        new Date((a as any).event.startsAt).getTime() - new Date((b as any).event.startsAt).getTime(),
    );

    return [...eventItems, ...directItems];
  }, [direct, events, filter, query]);

  const counts = useMemo(
    () => ({
      All: events.filter((event) => activeChannels(event.chatChannels).length).length + direct.length,
      Events: events.filter((event) => activeChannels(event.chatChannels).length).length,
      Direct: direct.length,
    }),
    [direct, events],
  );

  const openItem = async (item: InboxItem) => {
    if (item.type === 'event') {
      navigation.navigate('EventWorkspace', { eventId: item.event.id });
      return;
    }

    const channel = item.direct.channel;
    if (channel?.status === 'ACTIVE') {
      navigation.navigate('ChatChannel', {
        channel,
        title: item.direct.user.fullName || 'Athzy Player',
        imageUrl: item.direct.user.avatarUrl,
        userId: item.direct.user.id,
      });
      return;
    }

    if (!channel) return;
    try {
      await BackendAPI.retryChatProvisioning(channel.id);
      showToast({ message: 'Preparing this conversation. Pull to refresh in a moment.', tone: 'info' });
    } catch (requestError: any) {
      showToast({ message: requestError.message || 'Unable to prepare this conversation.', tone: 'error' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshBar active={refreshing || syncing} accent={theme.accents.chat} />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title} accessibilityRole="header">Chat</Text>
          <Text style={styles.subtitle}>Your events, teams and direct messages</Text>
        </View>
        <View style={styles.headerActions}>
          <PressableScale
            style={styles.iconButton}
            onPress={() => { setSearching((value) => !value); if (searching) setQuery(''); }}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel={searching ? 'Close search' : 'Search conversations'}
          >
            <Ionicons name={searching ? 'close' : 'search'} size={20} color={theme.colors.text} />
          </PressableScale>
          <PressableScale
            style={styles.createButton}
            onPress={() => navigation.navigate('Connections')}
            accessibilityRole="button"
            accessibilityLabel="Find people to chat with"
          >
            <Ionicons name="person-add" size={19} color={theme.colors.onPrimary} />
          </PressableScale>
        </View>
      </View>

      {searching ? (
        <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)} style={styles.search}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Search events and people"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
            selectionColor={theme.colors.primary}
            accessibilityLabel="Search conversations"
          />
        </Animated.View>
      ) : null}

      <View style={styles.filters}>
        {(['All', 'Events', 'Direct'] as Filter[]).map((item) => (
          <PressableScale
            key={item}
            style={[styles.filter, filter === item && styles.filterActive]}
            onPress={() => { triggerHaptic('selection'); setFilter(item); }}
            haptic="none"
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item }}
            accessibilityLabel={`${item} conversations, ${counts[item]}`}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            {counts[item] > 0 ? (
              <View style={[styles.filterCount, filter === item && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, filter === item && styles.filterCountTextActive]}>
                  {counts[item]}
                </Text>
              </View>
            ) : null}
          </PressableScale>
        ))}
      </View>

      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((key) => (
            <View key={key} style={styles.skeletonCard}><SkeletonRow avatarSize={54} /></View>
          ))}
        </View>
      ) : error && !items.length ? (
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Chat is out of bounds"
          message={error}
          actionLabel="Try again"
          onAction={() => load('initial')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => (item.type === 'event' ? `event-${item.event.id}` : `direct-${item.direct.user.id}`)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={query ? 'search-outline' : 'chatbubbles-outline'}
              title={query ? `Nothing matches "${query}"` : 'No conversations yet'}
              message={
                query
                  ? 'Try another event or player name.'
                  : 'Register for an event and you are added to its channels automatically. Connect with players to start a direct message.'
              }
              actionLabel={query ? 'Clear search' : 'Find events'}
              onAction={() => (query ? setQuery('') : navigation.navigate('Events'))}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index, 8) * theme.motion.stagger).duration(theme.motion.duration.normal)}
            >
              {item.type === 'event' ? (
                <EventConversation event={item.event} onPress={() => openItem(item)} />
              ) : (
                <DirectConversationRow conversation={item.direct} onPress={() => openItem(item)} />
              )}
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

/**
 * An event's channel bundle. Surfaces the channel names inline so you can see
 * there's an announcements room without opening the workspace first.
 */
function EventConversation({ event, onPress }: { event: ChatEvent; onPress: () => void }) {
  const channels = activeChannels(event.chatChannels);
  const live = isListingLive(event);
  const countdown = formatCountdown(event.startsAt);

  const channelLabel = (kind: string) =>
    kind.replace('EVENT_', '').replace('TOURNAMENT_', '').toLowerCase();

  return (
    <PressableScale
      style={styles.card}
      scaleTo={0.985}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${channels.length} channels`}
    >
      <View style={styles.cardTop}>
        <AppImage uri={event.imageUrl} style={styles.eventImage} />
        <View style={styles.cardCopy}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
            {live ? <Badge label="Live" tone="live" /> : null}
          </View>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {countdown ?? formatDayBadge(event.startsAt)} · {event.role.toLowerCase()}
          </Text>
          <View style={styles.channelRow}>
            {channels.slice(0, 3).map((channel) => (
              <View key={channel.id} style={styles.channelPill}>
                <Ionicons name="pricetag-outline" size={10} color={theme.colors.textMuted} />
                <Text style={styles.channelText}>{channelLabel(channel.kind)}</Text>
              </View>
            ))}
            {channels.length > 3 ? <Text style={styles.channelMore}>+{channels.length - 3}</Text> : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
    </PressableScale>
  );
}

function DirectConversationRow({ conversation, onPress }: { conversation: DirectConversation; onPress: () => void }) {
  const ready = conversation.channel?.status === 'ACTIVE';

  return (
    <PressableScale
      style={styles.card}
      scaleTo={0.985}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Direct message with ${conversation.user.fullName || 'player'}${ready ? '' : ', still being prepared'}`}
    >
      <View style={styles.cardTop}>
        <View>
          <Avatar uri={conversation.user.avatarUrl} name={conversation.user.fullName} size={54} circle />
          {ready ? <View style={styles.presence} /> : null}
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {conversation.user.fullName || 'Athzy Player'}
          </Text>
          <Text style={[styles.cardMeta, !ready && styles.cardMetaPending]} numberOfLines={1}>
            {ready ? 'Tap to open your conversation' : 'Setting up — tap to retry'}
          </Text>
        </View>
        <Ionicons
          name={ready ? 'chevron-forward' : 'refresh-outline'}
          size={18}
          color={ready ? theme.colors.textMuted : theme.colors.warning}
        />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.s,
    paddingBottom: theme.spacing.m,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...theme.typography.h1 },
  subtitle: { ...theme.typography.caption, marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  iconButton: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  createButton: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    ...theme.elevation.glow,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    height: 48,
    marginHorizontal: theme.spacing.gutter,
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, color: theme.colors.text, fontFamily: theme.font.regular, fontSize: 15, padding: 0 },

  filters: { flexDirection: 'row', gap: theme.spacing.s, paddingHorizontal: theme.spacing.gutter, paddingBottom: theme.spacing.m },
  filter: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontFamily: theme.font.semibold },
  filterTextActive: { color: theme.colors.onPrimary, fontFamily: theme.font.bold },
  filterCount: {
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceLight,
  },
  filterCountActive: { backgroundColor: 'rgba(0,0,0,0.18)' },
  filterCountText: { ...theme.typography.caption, fontSize: 11, textAlign: 'center', fontFamily: theme.font.bold },
  filterCountTextActive: { color: theme.colors.onPrimary },

  list: { paddingHorizontal: theme.spacing.gutter, gap: theme.spacing.s },
  skeletonCard: {
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  card: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  eventImage: { width: 54, height: 54, borderRadius: theme.borderRadius.l, backgroundColor: theme.colors.surfaceLight },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  cardTitle: { ...theme.typography.title, fontSize: 15, flexShrink: 1 },
  cardMeta: { ...theme.typography.caption, marginTop: 3, textTransform: 'capitalize' },
  cardMetaPending: { color: theme.colors.warning },

  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.s, flexWrap: 'wrap' },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.surfaceRaised,
  },
  channelText: { ...theme.typography.caption, fontSize: 11, textTransform: 'capitalize' },
  channelMore: { ...theme.typography.caption, fontSize: 11 },

  presence: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
});
