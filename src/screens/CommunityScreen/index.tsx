import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { BottomSheet } from '../../components/BottomSheet';
import { EmptyState } from '../../components/EmptyState';
import { FilterChip } from '../../components/FilterChip';
import { LikeButton } from '../../components/LikeButton';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { RefreshBar } from '../../components/RefreshBar';
import { Skeleton, SkeletonText } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';

/** Community owns violet — social and expressive, distinct from Discover. */
const ACCENT = theme.accents.community;
import { formatRelative } from '../../utils/format';

const reportReasons = [
  { label: 'Harassment', detail: 'Bullying, abuse, or targeted attacks', icon: 'person-remove-outline' },
  { label: 'Spam', detail: 'Misleading or repetitive promotion', icon: 'megaphone-outline' },
  { label: 'Unsafe content', detail: 'Threats or harmful material', icon: 'warning-outline' },
  { label: 'Off topic', detail: 'Not about local sport or this community', icon: 'help-circle-outline' },
] as const;

export const CommunityScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<any>(null);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'quiet' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else if (mode === 'initial') setLoading(true);
    else setSyncing(true);
    try {
      const result = await BackendAPI.getCommunityPosts(filter);
      setPosts(result.posts || []);
      setError('');
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to load the community feed.');
      if (mode === 'refresh') showToast({ message: requestError.message, tone: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  }, [filter]);

  useEffect(() => { load('initial'); }, [load]);

  useEffect(() => {
    BackendAPI.getSports().then((result) => setSports(result.sports || [])).catch(() => undefined);
    BackendAPI.getMe().then((result) => setViewer(result.profile)).catch(() => undefined);
  }, []);

  // A fresh post bumps `refreshAt`, so the author sees their own update land.
  useFocusEffect(
    useCallback(() => {
      if (route.params?.refreshAt) load('quiet');
    }, [load, route.params?.refreshAt]),
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return posts;
    return posts.filter((post) =>
      `${post.content} ${post.user?.fullName || ''} ${post.sportSlug || ''}`.toLowerCase().includes(normalized),
    );
  }, [posts, query]);

  /** Optimistic: flip the heart immediately, roll back only if the call fails. */
  const toggleReaction = async (postId: string) => {
    const snapshot = posts;
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, viewerReacted: !post.viewerReacted, likes: post.likes + (post.viewerReacted ? -1 : 1) }
          : post,
      ),
    );
    try {
      const result = await BackendAPI.toggleCommunityReaction(postId);
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, likes: result.reaction.likes, viewerReacted: result.reaction.reacted } : post,
        ),
      );
    } catch (requestError: any) {
      setPosts(snapshot);
      showToast({ message: requestError.message || 'Could not save your reaction.', tone: 'error' });
    }
  };

  const reportPost = async (reason: string) => {
    const targetId = reportPostId;
    if (!targetId) return;
    setReportPostId(null);
    try {
      await BackendAPI.report({ targetType: 'COMMUNITY_POST', targetId, reason });
      showToast({ message: 'Report received. Our moderation team will review this post.', tone: 'success' });
    } catch (requestError: any) {
      showToast({ message: requestError.message || 'Unable to submit this report.', tone: 'error' });
    }
  };

  const selectFilter = (slug?: string) => {
    triggerHaptic('selection');
    setFilter(slug);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshBar active={refreshing || syncing} accent={ACCENT} />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title} accessibilityRole="header">Community</Text>
          <Text style={styles.subtitle}>Connect with players near you</Text>
        </View>
        <View style={styles.headerActions}>
          <PressableScale
            style={styles.iconButton}
            onPress={() => { setSearching((value) => !value); if (searching) setQuery(''); }}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel={searching ? 'Close search' : 'Search posts'}
          >
            <Ionicons name={searching ? 'close' : 'search'} size={20} color={theme.colors.text} />
          </PressableScale>
          <PressableScale
            style={styles.createButton}
            onPress={() => navigation.navigate('CreatePost')}
            accessibilityRole="button"
            accessibilityLabel="Create a post"
          >
            <Ionicons name="add" size={24} color={theme.colors.onPrimary} />
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
            placeholder="Search posts, people or sports"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
            selectionColor={theme.colors.primary}
            accessibilityLabel="Search community posts"
          />
        </Animated.View>
      ) : null}

      <PressableScale
        style={styles.composer}
        scaleTo={0.985}
        onPress={() => navigation.navigate('CreatePost')}
        accessibilityRole="button"
        accessibilityLabel="Share something with the community"
      >
        <Avatar uri={viewer?.avatarUrl} name={viewer?.fullName} size={40} />
        <Text style={styles.composerText}>Share something with the community…</Text>
        <View style={styles.composerIcon}>
          <Ionicons name="image-outline" size={18} color={theme.colors.textSecondary} />
        </View>
      </PressableScale>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filters}
      >
        <FilterChip accent={ACCENT} label="All" active={!filter} onPress={() => selectFilter(undefined)} />
        {sports.map((sport) => (
          <FilterChip
            accent={ACCENT}
            key={sport.id}
            label={sport.name}
            active={filter === sport.slug}
            onPress={() => selectFilter(sport.slug)}
          />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((key) => <PostSkeleton key={key} />)}
        </View>
      ) : error && !posts.length ? (
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Can't load the feed"
          message={error}
          actionLabel="Try again"
          onAction={() => load('initial')}
        />
      ) : (
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={(post) => post.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          ListHeaderComponent={
            visible.length ? (
              <Text style={styles.count}>
                {visible.length} {visible.length === 1 ? 'post' : 'posts'}
                {filter ? ` in ${filter.replace(/-/g, ' ')}` : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={query ? 'search-outline' : 'people-outline'}
              title={query ? `No posts match "${query}"` : 'The field is quiet'}
              message={
                query
                  ? 'Try another player, sport or keyword.'
                  : 'Be the first to share a local sports update with your community.'
              }
              actionLabel={query ? 'Clear search' : 'Write a post'}
              onAction={() => (query ? setQuery('') : navigation.navigate('CreatePost'))}
            />
          }
          renderItem={({ item, index }) => (
            <PostCard
              post={item}
              index={index}
              isOwn={item.user?.id === viewer?.id}
              onOpen={() => navigation.navigate('PostDetails', { postId: item.id })}
              onAuthor={() => item.user?.id && navigation.navigate('PublicProfile', { userId: item.user.id })}
              onLike={() => toggleReaction(item.id)}
              onReport={() => setReportPostId(item.id)}
            />
          )}
        />
      )}

      <BottomSheet
        visible={Boolean(reportPostId)}
        onClose={() => setReportPostId(null)}
        eyebrow="COMMUNITY SAFETY"
        title="Report post"
        description="Choose the main reason. Reports are private and reviewed by the moderation team."
      >
        {reportReasons.map((reason) => (
          <PressableScale
            key={reason.label}
            style={styles.reason}
            onPress={() => reportPost(reason.label)}
            accessibilityRole="button"
            accessibilityLabel={`Report for ${reason.label}`}
          >
            <View style={styles.reasonIcon}>
              <Ionicons name={reason.icon} size={20} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.reasonCopy}>
              <Text style={styles.reasonTitle}>{reason.label}</Text>
              <Text style={styles.reasonDetail}>{reason.detail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </PressableScale>
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
};

function PostCard({ post, index, isOwn, onOpen, onAuthor, onLike, onReport }: any) {
  const share = () =>
    Share.share({
      message: `${post.user?.fullName || 'An Athzy player'} on Athzy:\n\n${post.content}`,
    }).catch(() => undefined);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * theme.motion.stagger).duration(theme.motion.duration.normal)}
      style={styles.post}
    >
      <View style={styles.postHeader}>
        <PressableScale
          style={styles.author}
          onPress={onAuthor}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel={`View ${post.user?.fullName || 'player'}'s profile`}
        >
          <Avatar uri={post.user?.avatarUrl} name={post.user?.fullName} size={44} />
          <View style={styles.authorCopy}>
            <Text style={styles.authorName} numberOfLines={1}>
              {post.user?.fullName || 'Athzy Player'}
            </Text>
            <Text style={styles.authorMeta}>{formatRelative(post.createdAt)}</Text>
          </View>
        </PressableScale>

        {post.sportSlug ? <Badge label={post.sportSlug.replace(/-/g, ' ')} tone="neutral" /> : null}

        {!isOwn ? (
          <PressableScale
            style={styles.menu}
            onPress={onReport}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Post options"
          >
            <Ionicons name="ellipsis-horizontal" size={19} color={theme.colors.textMuted} />
          </PressableScale>
        ) : null}
      </View>

      <PressableScale onPress={onOpen} scaleTo={0.99} haptic="none" accessibilityRole="button" accessibilityLabel="Open post">
        <Text style={styles.content}>{post.content}</Text>
        {post.imageUrl ? <AppImage uri={post.imageUrl} style={styles.postImage} /> : null}
      </PressableScale>

      <View style={styles.footer}>
        <LikeButton liked={Boolean(post.viewerReacted)} count={post.likes ?? 0} onPress={onLike} />

        <PressableScale
          style={styles.action}
          onPress={onOpen}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${post.comments ?? 0} comments`}
        >
          <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textMuted} />
          <Text style={styles.actionCount}>{post.comments ?? 0}</Text>
        </PressableScale>

        <View style={styles.spacer} />

        <PressableScale
          style={styles.action}
          onPress={share}
          hitSlop={8}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel="Share post"
        >
          <Ionicons name="share-social-outline" size={18} color={theme.colors.textMuted} />
        </PressableScale>
      </View>
    </Animated.View>
  );
}

function PostSkeleton() {
  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Skeleton width={44} height={44} radius={theme.borderRadius.l} />
        <View style={styles.skeletonAuthor}>
          <Skeleton width="55%" height={13} radius={theme.borderRadius.xs} />
          <Skeleton width="30%" height={11} radius={theme.borderRadius.xs} />
        </View>
      </View>
      <View style={styles.skeletonBody}>
        <SkeletonText lines={3} />
      </View>
    </View>
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

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginHorizontal: theme.spacing.gutter,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  composerText: { ...theme.typography.bodySmall, flex: 1 },
  composerIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },

  filterScroll: { flexGrow: 0 },
  filters: { flexDirection: 'row', gap: theme.spacing.s, paddingHorizontal: theme.spacing.gutter, paddingBottom: theme.spacing.m },

  list: { paddingHorizontal: theme.spacing.gutter, gap: theme.spacing.m },
  count: { ...theme.typography.label, marginBottom: theme.spacing.s },

  post: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  author: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  authorCopy: { flex: 1, marginLeft: theme.spacing.m, minWidth: 0 },
  authorName: { ...theme.typography.title, fontSize: 15 },
  authorMeta: { ...theme.typography.caption, marginTop: 2 },
  menu: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },

  content: { ...theme.typography.bodyLarge, color: theme.colors.text, fontSize: 15, marginTop: theme.spacing.m },
  postImage: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: theme.borderRadius.l,
    marginTop: theme.spacing.m,
    backgroundColor: theme.colors.surfaceLight,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.l,
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  actionCount: { ...theme.typography.caption, fontFamily: theme.font.semibold },
  spacer: { flex: 1 },

  skeletonAuthor: { flex: 1, marginLeft: theme.spacing.m, gap: 8 },
  skeletonBody: { marginTop: theme.spacing.m },

  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reasonIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  reasonCopy: { flex: 1, marginHorizontal: theme.spacing.m },
  reasonTitle: { ...theme.typography.title, fontSize: 14 },
  reasonDetail: { ...theme.typography.caption, marginTop: 3 },
});
