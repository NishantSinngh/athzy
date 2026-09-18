import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { LikeButton } from '../../components/LikeButton';
import { PressableScale } from '../../components/PressableScale';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Skeleton, SkeletonText } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import { formatRelative } from '../../utils/format';

export function PostDetailsScreen({ navigation, route }: any) {
  const [post, setPost] = useState<any>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoadError('');
      const result = await BackendAPI.getCommunityPost(route.params?.postId);
      setPost(result.post);
    } catch (error: any) {
      setLoadError(error.message || 'This post is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [route.params?.postId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    BackendAPI.getMe().then((result: any) => setViewer(result.profile)).catch(() => undefined);
  }, []);

  /** Optimistic like, same pattern as the feed so the two stay consistent. */
  const toggleReaction = async () => {
    const snapshot = post;
    setPost((current: any) => ({
      ...current,
      viewerReacted: !current.viewerReacted,
      likes: current.likes + (current.viewerReacted ? -1 : 1),
    }));
    try {
      const result = await BackendAPI.toggleCommunityReaction(post.id);
      setPost((current: any) => ({ ...current, likes: result.reaction.likes, viewerReacted: result.reaction.reacted }));
    } catch (error: any) {
      setPost(snapshot);
      showToast({ message: error.message || 'Could not save your reaction.', tone: 'error' });
    }
  };

  const publishComment = async () => {
    const text = comment.trim();
    if (!text) return;
    setSending(true);
    try {
      const result = await BackendAPI.createCommunityComment(post.id, text);
      setPost((current: any) => ({
        ...current,
        comments: current.comments + 1,
        commentItems: [...(current.commentItems || []), result.comment],
      }));
      setComment('');
    } catch (error: any) {
      showToast({ message: error.message || 'Could not post your comment.', tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  const sharePost = () =>
    Share.share({
      message: `${post.user?.fullName || 'An Athzy player'} on Athzy:\n\n${post.content}`,
    }).catch(() => undefined);

  if (loading) return <PostSkeleton navigation={navigation} />;

  if (!post) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader navigation={navigation} title="Post" />
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Post unavailable"
          message={loadError}
          actionLabel="Try again"
          onAction={() => { setLoading(true); load(); }}
        />
      </SafeAreaView>
    );
  }

  const comments = post.commentItems || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScreenHeader
          navigation={navigation}
          title="Post"
          bordered
          right={
            <PressableScale
              style={styles.headerButton}
              onPress={sharePost}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel="Share post"
            >
              <Ionicons name="share-social-outline" size={19} color={theme.colors.text} />
            </PressableScale>
          }
        />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <PressableScale
            style={styles.author}
            scaleTo={0.99}
            onPress={() => post.user?.id && navigation.navigate('PublicProfile', { userId: post.user.id })}
            accessibilityRole="button"
            accessibilityLabel={`View ${post.user?.fullName || 'player'}'s profile`}
          >
            <Avatar uri={post.user?.avatarUrl} name={post.user?.fullName} size={48} />
            <View style={styles.authorCopy}>
              <Text style={styles.authorName} numberOfLines={1}>{post.user?.fullName || 'Athzy Player'}</Text>
              <Text style={styles.authorMeta}>{formatRelative(post.createdAt)}</Text>
            </View>
            {post.sportSlug ? <Badge label={post.sportSlug.replace(/-/g, ' ')} tone="neutral" /> : null}
          </PressableScale>

          <Text style={styles.postText}>{post.content}</Text>
          {post.imageUrl ? <AppImage uri={post.imageUrl} style={styles.postImage} /> : null}

          <View style={styles.actions}>
            <LikeButton liked={Boolean(post.viewerReacted)} count={post.likes ?? 0} onPress={toggleReaction} size={21} />
            <View style={styles.action}>
              <Ionicons name="chatbubble-outline" size={19} color={theme.colors.textMuted} />
              <Text style={styles.actionCount}>{post.comments ?? 0}</Text>
            </View>
          </View>

          <Text style={styles.commentsTitle}>
            {post.comments ?? 0} {post.comments === 1 ? 'comment' : 'comments'}
          </Text>

          {comments.length ? (
            comments.map((item: any, index: number) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(Math.min(index, 8) * theme.motion.stagger).duration(theme.motion.duration.normal)}
                style={styles.comment}
              >
                <PressableScale
                  onPress={() => item.user?.id && navigation.navigate('PublicProfile', { userId: item.user.id })}
                  haptic="selection"
                  accessibilityRole="button"
                  accessibilityLabel={`View ${item.user?.fullName || 'player'}'s profile`}
                >
                  <Avatar uri={item.user?.avatarUrl} name={item.user?.fullName} size={38} />
                </PressableScale>
                <View style={styles.commentBubble}>
                  <View style={styles.commentTop}>
                    <Text style={styles.commentAuthor} numberOfLines={1}>
                      {item.user?.fullName || 'Athzy Player'}
                    </Text>
                    <Text style={styles.commentTime}>{formatRelative(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              </Animated.View>
            ))
          ) : (
            <EmptyState compact icon="chatbubbles-outline" title="No comments yet" message="Start the conversation." />
          )}
        </ScrollView>

        <View style={styles.composer}>
          <Avatar uri={viewer?.avatarUrl} name={viewer?.fullName} size={36} circle />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment…"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={500}
            style={styles.input}
            selectionColor={theme.colors.primary}
            accessibilityLabel="Write a comment"
          />
          <PressableScale
            disabled={sending || !comment.trim()}
            style={[styles.send, (!comment.trim() || sending) && styles.sendDisabled]}
            onPress={publishComment}
            haptic="medium"
            accessibilityRole="button"
            accessibilityLabel="Post comment"
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Ionicons name="send" size={17} color={theme.colors.onPrimary} />
            )}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PostSkeleton({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title="Post" bordered />
      <View style={styles.content}>
        <View style={styles.author}>
          <Skeleton width={48} height={48} radius={theme.borderRadius.l} />
          <View style={{ flex: 1, gap: 8, marginLeft: theme.spacing.m }}>
            <Skeleton width="50%" height={14} radius={theme.borderRadius.xs} />
            <Skeleton width="30%" height={11} radius={theme.borderRadius.xs} />
          </View>
        </View>
        <View style={{ marginTop: theme.spacing.l }}>
          <SkeletonText lines={4} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.gutter, paddingBottom: theme.spacing.xl },

  headerButton: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  author: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  authorCopy: { flex: 1, minWidth: 0 },
  authorName: { ...theme.typography.title, fontSize: 15 },
  authorMeta: { ...theme.typography.caption, marginTop: 2 },

  postText: { ...theme.typography.bodyLarge, color: theme.colors.text, marginTop: theme.spacing.l },
  postImage: {
    width: '100%',
    aspectRatio: 1.45,
    borderRadius: theme.borderRadius.xl,
    marginTop: theme.spacing.m,
    backgroundColor: theme.colors.surfaceLight,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.l,
    marginTop: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { ...theme.typography.caption, fontFamily: theme.font.semibold },

  commentsTitle: { ...theme.typography.h3, fontSize: 16, marginTop: theme.spacing.l, marginBottom: theme.spacing.m },
  comment: { flexDirection: 'row', gap: theme.spacing.m, marginBottom: theme.spacing.m },
  commentBubble: {
    flex: 1,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  commentTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  commentAuthor: { ...theme.typography.title, fontSize: 13, flex: 1 },
  commentTime: { ...theme.typography.caption, fontSize: 11 },
  commentText: { ...theme.typography.bodySmall, color: theme.colors.text, marginTop: 5 },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 11,
    borderRadius: theme.borderRadius.l,
    color: theme.colors.text,
    fontFamily: theme.font.regular,
    fontSize: 14,
    backgroundColor: theme.colors.background,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  sendDisabled: { opacity: 0.35 },
});
