import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isRunningInExpoGo } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../api/backend';
import { AppImage } from '../components/AppImage';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { PressableScale, triggerHaptic } from '../components/PressableScale';
import { Skeleton } from '../components/Skeleton';
import { showToast } from '../components/Toast';
import { useAthzyStream } from '../chat/StreamContext';
import { activeChannels, ChatChannelKind, EventWorkspace, parseStreamCid } from '../chat/types';
import { theme } from '../theme';
import { formatCountdown, formatDayBadge, formatTime, isLiveNow } from '../utils/format';
import { EventWorkspaceFallback } from './EventWorkspaceFallback';

const streamChat = isRunningInExpoGo() ? null : (require('stream-chat-expo') as typeof import('stream-chat-expo'));

type WorkspaceTab = 'Welcome' | 'General' | 'Announcements' | 'Fixtures' | 'Teams';

const tabs: { key: WorkspaceTab; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'Welcome', icon: 'hand-left-outline' },
  { key: 'General', icon: 'chatbubbles-outline' },
  { key: 'Announcements', icon: 'megaphone-outline' },
  { key: 'Fixtures', icon: 'trophy-outline' },
  { key: 'Teams', icon: 'people-outline' },
];

const channelKinds: Partial<Record<WorkspaceTab, ChatChannelKind>> = {
  Welcome: 'EVENT_WELCOME',
  General: 'EVENT_GENERAL',
  Announcements: 'EVENT_ANNOUNCEMENTS',
};

const privilegedRoles = new Set(['OWNER', 'ORGANIZER', 'MODERATOR', 'ADMIN']);

function NativeEventWorkspaceScreen({ navigation, route }: any) {
  const { Channel, MessageComposer, MessageList } = streamChat!;
  const { client, error: streamError } = useAthzyStream();
  const [workspace, setWorkspace] = useState<EventWorkspace | null>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [tab, setTab] = useState<WorkspaceTab>(route.params?.tab || 'Welcome');
  const [error, setError] = useState('');
  const [fixtureError, setFixtureError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [sending, setSending] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      setError('');
      const result = await BackendAPI.getEventWorkspace(route.params?.eventId);
      const loaded = result.workspace as EventWorkspace;
      setWorkspace(loaded);

      if (Array.isArray(loaded.fixtures)) {
        setFixtures(loaded.fixtures);
        return;
      }
      try {
        const fixtureResult = await BackendAPI.getFixtures();
        setFixtures(
          (fixtureResult.fixtures || []).filter(
            (fixture: any) => fixture.event?.id === loaded.id || fixture.eventId === loaded.id,
          ),
        );
      } catch (requestError: any) {
        setFixtureError(requestError.message || 'Fixtures could not be loaded.');
      }
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to open this workspace.');
    }
  }, [route.params?.eventId]);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  const selectedMapping = workspace
    ? activeChannels(workspace.chatChannels).find((mapping) => mapping.kind === channelKinds[tab])
    : undefined;
  const cid = selectedMapping ? parseStreamCid(selectedMapping.streamCid) : null;
  const channel = useMemo(
    () => (client && cid ? client.channel(cid.type, cid.id) : null),
    [cid?.id, cid?.type, client],
  );
  const canAnnounce = Boolean(workspace && privilegedRoles.has(workspace.role));

  /** Which tabs actually have a provisioned room — the rest are shown disabled. */
  const availableTabs = useMemo(() => {
    if (!workspace) return new Set<WorkspaceTab>();
    const active = activeChannels(workspace.chatChannels).map((mapping) => mapping.kind);
    const set = new Set<WorkspaceTab>(['Fixtures']);
    if (workspace.tournament || workspace.registrations?.length) set.add('Teams');
    (Object.keys(channelKinds) as WorkspaceTab[]).forEach((key) => {
      if (active.includes(channelKinds[key]!)) set.add(key);
    });
    return set;
  }, [workspace]);

  const sendAnnouncement = async () => {
    if (!workspace || !announcement.trim()) return;
    setSending(true);
    try {
      await BackendAPI.postEventAnnouncement(workspace.id, announcement.trim());
      setAnnouncement('');
      showToast({ message: 'Announcement posted to everyone in this event.', tone: 'success' });
    } catch (requestError: any) {
      showToast({ message: requestError.message || 'Could not post that announcement.', tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (!workspace && !error) return <WorkspaceSkeleton />;

  if (!workspace) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <WorkspaceHeader navigation={navigation} title="Workspace" />
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Unable to open workspace"
          message={error}
          actionLabel="Try again"
          onAction={loadWorkspace}
        />
      </SafeAreaView>
    );
  }

  const isTournament = workspace.kind === 'TOURNAMENT' || Boolean(workspace.tournament);
  const teams = workspace.entries || workspace.registrations || [];
  const channelUnavailable =
    streamError || 'This channel is not active yet. Organizers can retry provisioning from the event workflow.';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorkspaceHeader
        navigation={navigation}
        title={workspace.title}
        imageUrl={workspace.imageUrl}
        role={workspace.role}
        startsAt={workspace.startsAt}
        endsAt={workspace.endsAt}
        onDetails={() =>
          navigation.navigate(isTournament ? 'TournamentDetails' : 'EventDetails', {
            [isTournament ? 'tournamentId' : 'eventId']: workspace.id,
          })
        }
      />

      <FactStrip workspace={workspace} isTournament={isTournament} teamCount={teams.length} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabScroll}
      >
        {tabs.map((item) => {
          const active = tab === item.key;
          const available = availableTabs.has(item.key);
          return (
            <PressableScale
              key={item.key}
              style={[styles.tab, active && styles.tabActive, !available && styles.tabDisabled]}
              onPress={() => {
                if (!available) return;
                triggerHaptic('selection');
                setTab(item.key);
                setError('');
              }}
              haptic="none"
              scaleTo={0.94}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: !available }}
              accessibilityLabel={`${item.key}${available ? '' : ', not available yet'}`}
            >
              <Ionicons
                name={item.icon}
                size={15}
                color={active ? theme.colors.onPrimary : available ? theme.colors.textSecondary : theme.colors.textFaint}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive, !available && styles.tabTextDisabled]}>
                {item.key}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {tab === 'Fixtures' ? (
        fixtureError ? (
          <EmptyState icon="cloud-offline-outline" tone="error" title="Fixtures unavailable" message={fixtureError} />
        ) : (
          <Fixtures fixtures={fixtures} />
        )
      ) : tab === 'Teams' ? (
        <Teams teams={teams} />
      ) : channel ? (
        <Animated.View style={styles.channelWrap} entering={FadeIn.duration(theme.motion.duration.fast)}>
          <Channel channel={channel} audioRecordingEnabled={false} disableAttachmentPicker>
            {tab === 'Announcements' ? (
              <View style={styles.channelNotice}>
                <Ionicons name="megaphone-outline" size={15} color={theme.colors.primary} />
                <Text style={styles.channelNoticeText}>
                  {canAnnounce
                    ? 'Posts here notify everyone registered for this event.'
                    : 'Official updates from the organizers appear here.'}
                </Text>
              </View>
            ) : null}
            {tab === 'Welcome' ? (
              <View style={styles.channelNotice}>
                <Ionicons name="information-circle-outline" size={15} color={theme.colors.primary} />
                <Text style={styles.channelNoticeText}>
                  Everything you need before the first whistle. Ask questions in General.
                </Text>
              </View>
            ) : null}

            <MessageList />

            {tab === 'General' ? <MessageComposer /> : null}
            {tab === 'Announcements' && canAnnounce ? (
              <View style={styles.composer}>
                <TextInput
                  value={announcement}
                  onChangeText={setAnnouncement}
                  placeholder="Post an official announcement…"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  maxLength={1000}
                  style={styles.composerInput}
                  selectionColor={theme.colors.primary}
                  accessibilityLabel="Announcement text"
                />
                <PressableScale
                  disabled={sending || !announcement.trim()}
                  onPress={sendAnnouncement}
                  style={[styles.send, (!announcement.trim() || sending) && styles.sendDisabled]}
                  haptic="medium"
                  accessibilityRole="button"
                  accessibilityLabel="Post announcement"
                >
                  <Ionicons name="send" size={18} color={theme.colors.onPrimary} />
                </PressableScale>
              </View>
            ) : null}
          </Channel>
        </Animated.View>
      ) : (
        <EmptyState
          icon="hourglass-outline"
          title={`${tab} is being prepared`}
          message={channelUnavailable}
          actionLabel="Refresh"
          onAction={loadWorkspace}
        />
      )}
    </SafeAreaView>
  );
}

export function EventWorkspaceScreen(props: any) {
  return streamChat ? <NativeEventWorkspaceScreen {...props} /> : <EventWorkspaceFallback {...props} />;
}

function WorkspaceHeader({ navigation, title, imageUrl, role, startsAt, endsAt, onDetails }: any) {
  const live = startsAt ? isLiveNow(startsAt, endsAt) : false;

  return (
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

      {imageUrl ? <AppImage uri={imageUrl} style={styles.headerImage} /> : null}

      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerMetaRow}>
          {live ? <Badge label="Live" tone="live" /> : null}
          {role ? <Text style={styles.headerRole}>{role.toLowerCase()}</Text> : null}
        </View>
      </View>

      {onDetails ? (
        <PressableScale
          style={styles.back}
          scaleTo={0.9}
          onPress={onDetails}
          accessibilityRole="button"
          accessibilityLabel="Event details"
        >
          <Ionicons name="information-circle-outline" size={21} color={theme.colors.text} />
        </PressableScale>
      ) : null}
    </View>
  );
}

/** At-a-glance facts so players don't leave chat to check when and where. */
function FactStrip({ workspace, isTournament, teamCount }: any) {
  const countdown = formatCountdown(workspace.startsAt);
  const reportingAt = workspace.tournament?.reportingAt;

  const facts = [
    { icon: 'time-outline' as const, label: countdown ?? formatDayBadge(workspace.startsAt) },
    {
      icon: 'location-outline' as const,
      label: workspace.venue?.name || 'Venue TBA',
    },
    isTournament
      ? {
          icon: 'flag-outline' as const,
          label: reportingAt
            ? `Report ${formatTime(reportingAt, workspace.venue?.timeZone)}`
            : `${workspace.participantCount ?? teamCount} entries`,
        }
      : { icon: 'people-outline' as const, label: `${workspace.participantCount ?? teamCount} joined` },
  ];

  return (
    <View style={styles.facts}>
      {facts.map((fact) => (
        <View key={fact.label} style={styles.fact}>
          <Ionicons name={fact.icon} size={14} color={theme.colors.textSecondary} />
          <Text style={styles.factText} numberOfLines={1}>{fact.label}</Text>
        </View>
      ))}
    </View>
  );
}

function Fixtures({ fixtures }: { fixtures: any[] }) {
  if (!fixtures.length) {
    return (
      <EmptyState
        icon="trophy-outline"
        title="No fixtures scheduled"
        message="Match-ups appear here as soon as the organizers publish the schedule."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.panel} showsVerticalScrollIndicator={false}>
      {fixtures.map((fixture, index) => (
        <Animated.View
          key={fixture.id}
          entering={FadeInDown.delay(Math.min(index, 6) * theme.motion.stagger).duration(theme.motion.duration.normal)}
          style={styles.fixture}
        >
          <View style={styles.fixtureTop}>
            <Text style={styles.fixtureDate}>{formatDayBadge(fixture.date)}</Text>
            <Badge label="Upcoming" tone="neutral" />
          </View>
          <View style={styles.match}>
            <View style={styles.team}>
              <View style={[styles.teamMark, { backgroundColor: fixture.team1Color || theme.colors.primary }]} />
              <Text style={styles.teamName} numberOfLines={2}>{fixture.team1Name}</Text>
            </View>
            <View style={styles.kickoff}>
              <Text style={styles.kickoffTime}>{fixture.time}</Text>
              <Text style={styles.vs}>VS</Text>
            </View>
            <View style={styles.team}>
              <View style={[styles.teamMark, { backgroundColor: fixture.team2Color || theme.colors.warning }]} />
              <Text style={styles.teamName} numberOfLines={2}>{fixture.team2Name}</Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

function Teams({ teams }: { teams: EventWorkspace['registrations'] }) {
  if (!teams.length) {
    return (
      <EmptyState
        icon="people-outline"
        title="No teams registered yet"
        message="Rosters appear here as teams complete their registration."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.panel} showsVerticalScrollIndicator={false}>
      {teams.map((team, teamIndex) => {
        const roster = team.roster || [];
        const hasCaptain = roster.some((member) => member.isCaptain);

        return (
          <Animated.View
            key={team.id}
            entering={FadeInDown.delay(Math.min(teamIndex, 6) * theme.motion.stagger).duration(theme.motion.duration.normal)}
            style={styles.teamCard}
          >
            <View style={styles.teamCardHeader}>
              <Avatar name={team.teamName || 'Team'} size={40} />
              <View style={styles.teamCardCopy}>
                <Text style={styles.teamCardTitle} numberOfLines={1}>{team.teamName || 'Registered team'}</Text>
                <Text style={styles.teamCardMeta}>
                  {roster.length} {roster.length === 1 ? 'player' : 'players'}
                </Text>
              </View>
            </View>

            {roster.map((player, index) => {
              const captain = player.isCaptain || (!hasCaptain && index === 0);
              return (
                <View key={player.id || `${team.id}-${index}`} style={styles.player}>
                  <Ionicons
                    name={captain ? 'star' : 'person-outline'}
                    size={14}
                    color={captain ? theme.colors.warning : theme.colors.textMuted}
                  />
                  <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                  {player.position ? <Text style={styles.playerPosition}>{player.position}</Text> : null}
                  {captain ? <Badge label="Captain" tone="warning" /> : null}
                </View>
              );
            })}
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

function WorkspaceSkeleton() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Skeleton width={44} height={44} radius={theme.borderRadius.l} />
        <Skeleton width={44} height={44} radius={theme.borderRadius.l} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={15} radius={theme.borderRadius.xs} />
          <Skeleton width="35%" height={11} radius={theme.borderRadius.xs} />
        </View>
      </View>
      <View style={styles.facts}>
        {[0, 1, 2].map((key) => <Skeleton key={key} height={34} radius={theme.borderRadius.m} style={{ flex: 1 }} />)}
      </View>
      <View style={styles.panel}>
        <Skeleton height={92} radius={theme.borderRadius.xl} />
        <Skeleton height={92} radius={theme.borderRadius.xl} />
        <Skeleton height={92} radius={theme.borderRadius.xl} />
      </View>
    </SafeAreaView>
  );
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
  headerImage: { width: 40, height: 40, borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.surfaceLight },
  headerCopy: { flex: 1, minWidth: 0, marginLeft: 2 },
  headerTitle: { ...theme.typography.title, fontSize: 15 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, marginTop: 3 },
  headerRole: { ...theme.typography.caption, color: theme.colors.primary, textTransform: 'capitalize' },

  facts: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
  },
  fact: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  factText: { ...theme.typography.caption, color: theme.colors.text, fontSize: 11, flexShrink: 1 },

  tabScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tabs: { gap: theme.spacing.s, paddingHorizontal: theme.spacing.m, paddingBottom: theme.spacing.m },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabDisabled: { opacity: 0.45 },
  tabText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontFamily: theme.font.semibold },
  tabTextActive: { color: theme.colors.onPrimary, fontFamily: theme.font.bold },
  tabTextDisabled: { color: theme.colors.textFaint },

  channelWrap: { flex: 1 },
  channelNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.primaryMuted,
  },
  channelNoticeText: { ...theme.typography.caption, color: theme.colors.textSecondary, flex: 1 },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.s,
    padding: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  composerInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.l,
    color: theme.colors.text,
    fontFamily: theme.font.regular,
    fontSize: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  sendDisabled: { opacity: 0.35 },

  panel: { padding: theme.spacing.gutter, gap: theme.spacing.m, paddingBottom: theme.spacing.xl },

  fixture: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fixtureTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fixtureDate: { ...theme.typography.label, color: theme.colors.primary },
  match: { flexDirection: 'row', alignItems: 'flex-start', marginTop: theme.spacing.l },
  team: { flex: 1, alignItems: 'center', gap: theme.spacing.s },
  teamMark: { width: 42, height: 42, borderRadius: 21, borderWidth: 4, borderColor: theme.colors.borderSoft },
  teamName: { ...theme.typography.caption, color: theme.colors.text, fontFamily: theme.font.bold, textAlign: 'center' },
  kickoff: { alignItems: 'center', paddingHorizontal: theme.spacing.s, paddingTop: 4 },
  kickoffTime: { ...theme.typography.numeric, fontSize: 18 },
  vs: { ...theme.typography.label, color: theme.colors.textMuted, marginTop: 4 },

  teamCard: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teamCardHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  teamCardCopy: { flex: 1, minWidth: 0 },
  teamCardTitle: { ...theme.typography.title, fontSize: 15 },
  teamCardMeta: { ...theme.typography.caption, marginTop: 2 },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingTop: theme.spacing.m,
    marginTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  playerName: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1 },
  playerPosition: { ...theme.typography.caption, fontSize: 11 },
});
