import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Skeleton } from '../../components/Skeleton';
import { EventWorkspace } from '../../chat/types';
import { theme } from '../../theme';
import { formatCountdown, formatDayBadge } from '../../utils/format';

/**
 * Expo Go build of the workspace: shows the event context and roster we can
 * fetch over REST, and explains why the live channels aren't there.
 */
export function EventWorkspaceFallback({ navigation, route }: any) {
  const [workspace, setWorkspace] = useState<EventWorkspace | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    BackendAPI.getEventWorkspace(route.params?.eventId)
      .then((result: any) => setWorkspace(result.workspace))
      .catch((requestError: any) => setError(requestError.message));
  }, [route.params?.eventId]);

  useEffect(() => { load(); }, [load]);

  const isTournament = route.params?.workspaceKind === 'tournament' || workspace?.kind === 'TOURNAMENT';
  const title = isTournament ? 'Tournament Lounge' : 'Event Workspace';

  if (!workspace && !error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader navigation={navigation} title={title} />
        <View style={styles.content}>
          <Skeleton height={210} radius={theme.borderRadius.xxl} />
          <Skeleton height={120} radius={theme.borderRadius.xl} />
        </View>
      </SafeAreaView>
    );
  }

  if (!workspace) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader navigation={navigation} title={title} />
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Unable to open workspace"
          message={error}
          actionLabel="Try again"
          onAction={load}
        />
      </SafeAreaView>
    );
  }

  const countdown = formatCountdown(workspace.startsAt);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title={title} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppImage uri={workspace.imageUrl} style={StyleSheet.absoluteFillObject as any} />
          <LinearGradient colors={theme.gradients.imageScrim} style={StyleSheet.absoluteFill} />
          <View style={styles.heroBody}>
            <View style={styles.heroBadges}>
              <Badge label={workspace.role} tone="primary" />
              {countdown ? <Badge label={countdown} tone="neutral" caps={false} /> : null}
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{workspace.title}</Text>
            <View style={styles.heroMeta}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.heroMetaText}>
                {formatDayBadge(workspace.startsAt)} · {workspace.venue?.name || 'Venue TBA'}
              </Text>
            </View>
          </View>
        </View>

        <EmptyState
          compact
          icon="phone-portrait-outline"
          title="Chat needs an Athzy build"
          message="Expo Go cannot load Stream's native chat modules. Welcome, general and announcement channels are available in development and preview builds."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.gutter, gap: theme.spacing.l },
  hero: {
    height: 230,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.surface,
  },
  heroBody: { padding: theme.spacing.gutter },
  heroBadges: { flexDirection: 'row', gap: theme.spacing.s, marginBottom: theme.spacing.s },
  heroTitle: { ...theme.typography.h2 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.s },
  heroMetaText: { ...theme.typography.bodySmall, color: theme.colors.text },
});
