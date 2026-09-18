import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { BottomSheet } from '../../components/BottomSheet';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PressableScale } from '../../components/PressableScale';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Skeleton } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';

const reportReasons = ['Harassment', 'Spam', 'Unsafe behavior', 'Fake profile'] as const;

export function PublicProfileScreen({ navigation, route }: any) {
  const [user, setUser] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const [profileResult, meResult] = await Promise.all([
        BackendAPI.getUser(route.params?.userId),
        BackendAPI.getMe(),
      ]);
      setUser(profileResult.user);
      setMe(meResult.profile);
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to load this player.');
    } finally {
      setLoading(false);
    }
  }, [route.params?.userId]);

  useEffect(() => { load(); }, [load]);

  /** Wraps a relationship mutation with busy state, a toast, and a refetch. */
  const run = async (action: () => Promise<unknown>, successMessage?: string) => {
    setBusy(true);
    try {
      await action();
      await load();
      if (successMessage) showToast({ message: successMessage, tone: 'success' });
    } catch (requestError: any) {
      showToast({ message: requestError.message || 'That did not work. Try again.', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const relationship = user?.relationship || { status: 'NONE' };
  const isIncoming = relationship.status === 'PENDING' && relationship.addresseeId === me?.id;

  const confirmRemove = () => {
    setOptionsVisible(false);
    Alert.alert('Remove connection?', 'The direct conversation will no longer be available.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => run(() => BackendAPI.removeConnection(relationship.id), 'Connection removed.'),
      },
    ]);
  };

  const confirmBlock = () => {
    setOptionsVisible(false);
    Alert.alert('Block this player?', 'They will not be able to connect or message you.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => run(() => BackendAPI.blockUser(user.id), 'Player blocked.'),
      },
    ]);
  };

  const submitReport = (reason: string) => {
    setReportVisible(false);
    run(
      () => BackendAPI.report({ targetType: 'USER', targetId: user.id, reason }),
      'Report received. Our moderation team will review it.',
    );
  };

  if (loading) return <PublicProfileSkeleton navigation={navigation} />;

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader navigation={navigation} title="Player" />
        <EmptyState
          icon="person-outline"
          tone="error"
          title="Player unavailable"
          message={error}
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        navigation={navigation}
        title="Player profile"
        right={
          <PressableScale
            style={styles.optionsButton}
            onPress={() => setOptionsVisible(true)}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Player options"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text} />
          </PressableScale>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(theme.motion.duration.normal)} style={styles.identity}>
          <Avatar uri={user.avatarUrl} name={user.fullName} size={116} ring />
          <Text style={styles.name}>{user.fullName || 'Athzy Player'}</Text>
          {user.username ? <Text style={styles.username}>@{user.username}</Text> : null}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.colors.primary} />
            <Text style={styles.location}>
              {[user.locationCity, user.locationState].filter(Boolean).join(', ') || 'Location not shared'}
            </Text>
          </View>
        </Animated.View>

        {(user.sports || []).length ? (
          <View style={styles.sports}>
            {user.sports.map((item: any) => (
              <Badge key={item.sport.id} label={item.sport.name} tone="neutral" caps={false} />
            ))}
          </View>
        ) : null}

        <View style={styles.actionArea}>
          {relationship.status === 'NONE' ? (
            <Button
              title="Connect"
              iconName="person-add-outline"
              loading={busy}
              onPress={() => run(() => BackendAPI.requestConnection(user.id), 'Connection request sent.')}
              fullWidth
            />
          ) : null}

          {relationship.status === 'PENDING' && !isIncoming ? (
            <View style={styles.notice}>
              <Ionicons name="time-outline" size={19} color={theme.colors.primary} />
              <Text style={styles.noticeText}>Connection request pending</Text>
            </View>
          ) : null}

          {isIncoming ? (
            <View style={styles.buttonRow}>
              <Button
                title="Accept"
                loading={busy}
                onPress={() => run(() => BackendAPI.acceptConnection(relationship.id), 'You are now connected.')}
                style={styles.flex}
              />
              <Button
                title="Decline"
                variant="outline"
                onPress={() => run(() => BackendAPI.declineConnection(relationship.id))}
                style={styles.flex}
              />
            </View>
          ) : null}

          {relationship.status === 'ACCEPTED' ? (
            <Button
              title="Open chat"
              iconName="chatbubbles-outline"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
              fullWidth
            />
          ) : null}

          {relationship.status === 'BLOCKED' ? (
            <Button
              title="Unblock player"
              variant="danger"
              loading={busy}
              onPress={() => run(() => BackendAPI.unblockUser(user.id), 'Player unblocked.')}
              fullWidth
            />
          ) : null}

          {relationship.status === 'BLOCKED_BY_USER' ? (
            <View style={styles.notice}>
              <Ionicons name="lock-closed-outline" size={19} color={theme.colors.textMuted} />
              <Text style={styles.noticeText}>This profile is unavailable for connections.</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.about}>
          <Text style={styles.aboutTitle}>Sports profile</Text>
          <Text style={styles.aboutText}>
            Connect to coordinate matches and open a private Athzy conversation.
          </Text>
        </View>
      </ScrollView>

      <BottomSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        title="Player options"
        eyebrow={user.fullName || 'ATHZY PLAYER'}
      >
        {relationship.status === 'ACCEPTED' ? (
          <OptionRow icon="person-remove-outline" title="Remove connection" detail="End the direct conversation" onPress={confirmRemove} />
        ) : null}
        <OptionRow
          icon="flag-outline"
          title="Report player"
          detail="Send this profile to moderation"
          onPress={() => { setOptionsVisible(false); setReportVisible(true); }}
        />
        {relationship.status === 'BLOCKED' ? (
          <OptionRow
            icon="lock-open-outline"
            title="Unblock player"
            detail="Allow connections and messages again"
            onPress={() => { setOptionsVisible(false); run(() => BackendAPI.unblockUser(user.id), 'Player unblocked.'); }}
          />
        ) : (
          <OptionRow icon="ban-outline" title="Block player" detail="Stop all contact" danger onPress={confirmBlock} />
        )}
      </BottomSheet>

      <BottomSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        eyebrow="COMMUNITY SAFETY"
        title="Report player"
        description="Choose the main reason. Reports are private and reviewed by the moderation team."
      >
        {reportReasons.map((reason) => (
          <OptionRow key={reason} icon="alert-circle-outline" title={reason} onPress={() => submitReport(reason)} />
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
}

function OptionRow({ icon, title, detail, danger, onPress }: any) {
  return (
    <PressableScale
      style={styles.optionRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.optionIcon, danger && styles.optionIconDanger]}>
        <Ionicons name={icon} size={19} color={danger ? theme.colors.error : theme.colors.textSecondary} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, danger && styles.optionTitleDanger]}>{title}</Text>
        {detail ? <Text style={styles.optionDetail}>{detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </PressableScale>
  );
}

function PublicProfileSkeleton({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title="Player profile" />
      <View style={[styles.content, { alignItems: 'center' }]}>
        <Skeleton width={116} height={116} radius={38} />
        <Skeleton width={170} height={26} radius={theme.borderRadius.xs} style={{ marginTop: theme.spacing.l }} />
        <Skeleton width={110} height={14} radius={theme.borderRadius.xs} style={{ marginTop: theme.spacing.s }} />
        <Skeleton height={56} radius={theme.borderRadius.l} style={{ width: '100%', marginTop: theme.spacing.xl }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  content: { padding: theme.spacing.gutter, paddingBottom: theme.spacing.xxl },

  optionsButton: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  identity: { alignItems: 'center', paddingTop: theme.spacing.s },
  name: { ...theme.typography.h1, fontSize: 26, marginTop: theme.spacing.l, textAlign: 'center' },
  username: { ...theme.typography.bodySmall, color: theme.colors.primary, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: theme.spacing.s },
  location: { ...theme.typography.bodySmall },

  sports: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.s,
    marginTop: theme.spacing.l,
  },

  actionArea: { marginTop: theme.spacing.xl },
  buttonRow: { flexDirection: 'row', gap: theme.spacing.s },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    minHeight: 56,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noticeText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },

  about: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  aboutTitle: { ...theme.typography.title, fontSize: 15 },
  aboutText: { ...theme.typography.bodySmall, marginTop: theme.spacing.s },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  optionIconDanger: { backgroundColor: theme.colors.errorMuted },
  optionCopy: { flex: 1, marginHorizontal: theme.spacing.m },
  optionTitle: { ...theme.typography.title, fontSize: 14 },
  optionTitleDanger: { color: theme.colors.error },
  optionDetail: { ...theme.typography.caption, marginTop: 2 },
});
