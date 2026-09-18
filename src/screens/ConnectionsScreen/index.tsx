import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { PressableScale } from '../../components/PressableScale';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SkeletonRow } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';

type ConnectionItem = {
  id: string;
  status: 'PENDING' | 'ACCEPTED';
  user: { id: string; fullName?: string | null; avatarUrl?: string | null; locationCity?: string | null };
};

type Connections = { incoming: ConnectionItem[]; outgoing: ConnectionItem[]; accepted: ConnectionItem[] };

export function ConnectionsScreen({ navigation }: any) {
  const [connections, setConnections] = useState<Connections>({ incoming: [], outgoing: [], accepted: [] });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const result = await BackendAPI.getConnections();
      setConnections(result.connections);
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to load connections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced search so we aren't firing a request per keystroke.
  useEffect(() => {
    let active = true;
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      BackendAPI.searchUsers(normalized)
        .then((result: any) => { if (active) setResults(result.users || []); })
        .catch((requestError: any) => {
          if (active) showToast({ message: requestError.message || 'Search failed.', tone: 'error' });
        })
        .finally(() => { if (active) setSearching(false); });
    }, 350);
    return () => { active = false; clearTimeout(timeout); };
  }, [query]);

  const decide = async (item: ConnectionItem, accept: boolean) => {
    setBusyId(item.id);
    try {
      if (accept) await BackendAPI.acceptConnection(item.id);
      else await BackendAPI.declineConnection(item.id);
      await load();
      showToast({
        message: accept
          ? `You're now connected with ${item.user.fullName || 'this player'}.`
          : 'Request declined.',
        tone: accept ? 'success' : 'info',
      });
    } catch (requestError: any) {
      showToast({ message: requestError.message || 'Could not update that request.', tone: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const openProfile = (userId: string) => navigation.navigate('PublicProfile', { userId });
  const isSearchMode = query.trim().length >= 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title="Connections" subtitle="Find players and manage requests" />

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search players by name or city"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          selectionColor={theme.colors.primary}
          accessibilityLabel="Search players"
        />
        {searching ? <ActivityIndicator color={theme.colors.primary} size="small" /> : null}
        {query && !searching ? (
          <PressableScale onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </PressableScale>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {isSearchMode ? (
          <Section title="Search results" count={results.length}>
            {results.length ? (
              results.map((user, index) => (
                <PersonRow key={user.id} user={user} index={index} action="View" onPress={() => openProfile(user.id)} />
              ))
            ) : searching ? (
              <SkeletonRow />
            ) : (
              <EmptyState compact icon="search-outline" title="No players found" message="Try a different name or city." />
            )}
          </Section>
        ) : loading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3].map((key) => (
              <View key={key} style={styles.skeletonCard}><SkeletonRow avatarSize={50} /></View>
            ))}
          </View>
        ) : error ? (
          <EmptyState
            icon="cloud-offline-outline"
            tone="error"
            title="Unable to load connections"
            message={error}
            actionLabel="Try again"
            onAction={load}
          />
        ) : (
          <>
            {connections.incoming.length ? (
              <Section title="Requests" count={connections.incoming.length} highlight>
                {connections.incoming.map((item, index) => (
                  <PersonRow
                    key={item.id}
                    user={item.user}
                    index={index}
                    onPress={() => openProfile(item.user.id)}
                    actions={
                      <View style={styles.actions}>
                        <PressableScale
                          style={styles.accept}
                          onPress={() => decide(item, true)}
                          disabled={busyId === item.id}
                          haptic="medium"
                          accessibilityRole="button"
                          accessibilityLabel={`Accept request from ${item.user.fullName || 'player'}`}
                        >
                          {busyId === item.id ? (
                            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                          ) : (
                            <Ionicons name="checkmark" size={19} color={theme.colors.onPrimary} />
                          )}
                        </PressableScale>
                        <PressableScale
                          style={styles.decline}
                          onPress={() => decide(item, false)}
                          disabled={busyId === item.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Decline request from ${item.user.fullName || 'player'}`}
                        >
                          <Ionicons name="close" size={19} color={theme.colors.text} />
                        </PressableScale>
                      </View>
                    }
                  />
                ))}
              </Section>
            ) : null}

            {connections.outgoing.length ? (
              <Section title="Sent requests" count={connections.outgoing.length}>
                {connections.outgoing.map((item, index) => (
                  <PersonRow
                    key={item.id}
                    user={item.user}
                    index={index}
                    action="Pending"
                    onPress={() => openProfile(item.user.id)}
                  />
                ))}
              </Section>
            ) : null}

            <Section title="Your network" count={connections.accepted.length}>
              {connections.accepted.length ? (
                connections.accepted.map((item, index) => (
                  <PersonRow
                    key={item.id}
                    user={item.user}
                    index={index}
                    action="Message"
                    onPress={() => openProfile(item.user.id)}
                  />
                ))
              ) : (
                <EmptyState
                  compact
                  icon="people-outline"
                  title="No connections yet"
                  message="Search for local players to start building your sports network."
                />
              )}
            </Section>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, count, highlight, children }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count > 0 ? (
          <View style={[styles.sectionCount, highlight && styles.sectionCountHighlight]}>
            <Text style={[styles.sectionCountText, highlight && styles.sectionCountTextHighlight]}>{count}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function PersonRow({ user, action, actions, onPress, index = 0 }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * theme.motion.stagger).duration(theme.motion.duration.normal)}>
      <PressableScale
        style={styles.person}
        scaleTo={0.985}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${user.fullName || 'player'}'s profile`}
      >
        <Avatar uri={user.avatarUrl} name={user.fullName} size={50} />
        <View style={styles.personCopy}>
          <Text style={styles.personName} numberOfLines={1}>{user.fullName || 'Athzy Player'}</Text>
          <Text style={styles.personMeta} numberOfLines={1}>
            {user.locationCity || 'Athzy community'}
          </Text>
        </View>
        {actions || (
          <View style={styles.actionLabel}>
            <Text style={styles.actionText}>{action}</Text>
          </View>
        )}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    height: 52,
    marginHorizontal: theme.spacing.gutter,
    marginTop: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, color: theme.colors.text, fontFamily: theme.font.regular, fontSize: 15, padding: 0 },

  content: { padding: theme.spacing.gutter, paddingBottom: theme.spacing.xxl },
  section: { marginBottom: theme.spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, marginBottom: theme.spacing.m },
  sectionTitle: { ...theme.typography.h3, fontSize: 16 },
  sectionCount: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceLight,
  },
  sectionCountHighlight: { backgroundColor: theme.colors.primary },
  sectionCountText: { ...theme.typography.caption, fontSize: 11, textAlign: 'center', fontFamily: theme.font.bold },
  sectionCountTextHighlight: { color: theme.colors.onPrimary },
  sectionBody: { gap: theme.spacing.s },

  skeletonList: { gap: theme.spacing.s },
  skeletonCard: {
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    minHeight: 76,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  personCopy: { flex: 1, minWidth: 0 },
  personName: { ...theme.typography.title, fontSize: 15 },
  personMeta: { ...theme.typography.caption, marginTop: 3 },

  actionLabel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primaryMuted,
  },
  actionText: { ...theme.typography.caption, color: theme.colors.primary, fontFamily: theme.font.bold },

  actions: { flexDirection: 'row', gap: theme.spacing.s },
  accept: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  decline: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
});
