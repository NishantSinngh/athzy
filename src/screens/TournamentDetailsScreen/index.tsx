import React, { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { HeroReveal } from '../../components/HeroReveal';
import { PressableScale } from '../../components/PressableScale';
import { SectionHeader } from '../../components/SectionHeader';
import { Skeleton } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import type { PublicTournamentEntry, Tournament } from '../../types/tournament';
import { formatCountdown, formatDateTime, formatMoney, formatTime } from '../../utils/format';

const HERO_HEIGHT = 380;

const humanize = (value?: string | null) =>
  value
    ? value
        .toLowerCase()
        .split('_')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ')
    : 'Not specified';

export function TournamentDetailsScreen({ navigation, route }: any) {
  const tournamentId = route.params?.tournamentId;
  const insets = useSafeAreaInsets();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollY = useSharedValue(0);

  const load = useCallback(async () => {
    if (!tournamentId) {
      setError('No tournament was selected.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await BackendAPI.getTournament(tournamentId);
      setTournament(result.tournament);
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to load this tournament.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-HERO_HEIGHT, 0, HERO_HEIGHT],
          [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.35],
          Extrapolation.CLAMP,
        ),
      },
      { scale: interpolate(scrollY.value, [-HERO_HEIGHT, 0], [2.2, 1], Extrapolation.CLAMP) },
    ],
  }));

  const topBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT - 180, HERO_HEIGHT - 90], [0, 1], Extrapolation.CLAMP),
  }));

  if (loading) return <TournamentSkeleton insets={insets} />;

  if (!tournament) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Unable to load tournament"
          message={error}
          actionLabel="Try again"
          onAction={load}
        />
        <Button title="Go back" variant="ghost" onPress={() => navigation.goBack()} style={styles.backButton} />
      </View>
    );
  }

  const confirmed = tournament.viewerEntry?.status === 'CONFIRMED';
  const withdrawn = tournament.viewerEntry?.status === 'WITHDRAWN';
  const ctaTitle = confirmed
    ? 'Open tournament lounge'
    : withdrawn
      ? 'Entry withdrawn'
      : tournament.isFull
        ? 'Tournament full'
        : tournament.isRegistrationOpen
          ? 'Register'
          : tournament.status === 'CANCELLED'
            ? 'Tournament cancelled'
            : tournament.status === 'IN_PROGRESS'
              ? 'In progress'
              : tournament.status === 'COMPLETED'
                ? 'Completed'
                : 'Registration closed';
  const ctaDisabled = !confirmed && (withdrawn || !tournament.isRegistrationOpen || tournament.isFull);

  const venueText = tournament.venue
    ? [tournament.venue.name, tournament.venue.city].filter(Boolean).join(', ')
    : 'Venue to be announced';
  const capacity =
    tournament.maxEntries > 0 ? `${tournament.entryCount}/${tournament.maxEntries}` : `${tournament.entryCount}`;
  const feeText =
    tournament.paymentPolicy === 'FREE' ? 'Free' : formatMoney(tournament.totalFeeMinor, tournament.currency);
  const countdown = formatCountdown(tournament.startsAt);
  const slotsLeft = tournament.spotsRemaining;

  const openDirections = () => {
    if (!tournament.venue) return;
    const destination = [tournament.venue.name, tournament.venue.address, tournament.venue.city]
      .filter(Boolean)
      .join(', ');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`).catch(() =>
      showToast({ message: 'Could not open maps on this device.', tone: 'error' }),
    );
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
            <HeroReveal style={styles.heroImage}>
              <AppImage uri={tournament.imageUrl} fallback="tournament" style={styles.heroImage} priority="high" />
            </HeroReveal>
          </Animated.View>
          <LinearGradient colors={theme.gradients.imageScrim} style={StyleSheet.absoluteFill} />

          <View style={styles.heroBody}>
            <View style={styles.badges}>
              <Badge label={humanize(tournament.status)} tone="primary" />
              <Badge label={`${humanize(tournament.registrationMode)} entry`} tone="neutral" />
              {countdown ? <Badge label={countdown} tone="info" caps={false} /> : null}
            </View>
            <Text style={styles.title}>{tournament.title}</Text>
            <Text style={styles.sport}>
              {tournament.sport?.name || 'Tournament'} · {humanize(tournament.format)}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.statusCard, confirmed && styles.statusCardConfirmed]}>
            <View style={styles.statusIcon}>
              <Ionicons
                name={confirmed ? 'checkmark-circle' : tournament.isRegistrationOpen ? 'radio-button-on' : 'lock-closed'}
                size={22}
                color={confirmed || tournament.isRegistrationOpen ? theme.colors.primary : theme.colors.textMuted}
              />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.cardTitle}>
                {confirmed
                  ? "You're registered"
                  : tournament.isRegistrationOpen
                    ? 'Registration is open'
                    : 'Registration is not open'}
              </Text>
              <Text style={styles.cardText}>
                {confirmed
                  ? `${tournament.viewerEntry?.type === 'TEAM' ? tournament.viewerEntry.teamName : tournament.viewerEntry?.contactName} can access the lounge.`
                  : tournament.isRegistrationOpen
                    ? `${slotsLeft ?? 'Open'} spots left · closes ${formatDateTime(tournament.registrationClosesAt, tournament.venue?.timeZone || undefined)}`
                    : humanize(tournament.status)}
              </Text>
            </View>
          </View>

          {tournament.maxEntries > 0 ? (
            <View style={styles.capacityCard}>
              <View style={styles.capacityTop}>
                <Text style={styles.capacityLabel}>ENTRIES</Text>
                <Text style={styles.capacityValue}>{capacity}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, (tournament.entryCount / tournament.maxEntries) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.factGrid}>
            <Fact label="FORMAT" value={humanize(tournament.format)} icon="git-network-outline" />
            <Fact label="SKILL" value={humanize(tournament.skillLevel)} icon="speedometer-outline" />
            <Fact label="PRIZE" value={tournament.prizePool || 'Not announced'} icon="trophy-outline" accent />
            <Fact label="ENTRY" value={feeText} icon="wallet-outline" accent />
          </View>

          <View style={styles.block}>
            <SectionHeader title="Tournament day" />
            <View style={styles.card}>
              <Info
                first
                icon="calendar-outline"
                label="Date and start"
                value={formatDateTime(tournament.startsAt, tournament.venue?.timeZone || undefined)}
              />
              <Info icon="location-outline" label="Venue" value={venueText} />
              {tournament.reportingAt ? (
                <Info
                  icon="flag-outline"
                  label="Report by"
                  value={formatDateTime(tournament.reportingAt, tournament.venue?.timeZone || undefined)}
                />
              ) : null}
              {tournament.entryGate ? <Info icon="enter-outline" label="Entry gate" value={tournament.entryGate} /> : null}
            </View>
          </View>

          <View style={styles.block}>
            <SectionHeader title="Entry & payment" />
            <View style={styles.card}>
              <Info first icon="person-add-outline" label="Registration" value={humanize(tournament.registrationMode)} />
              <Info
                icon="lock-open-outline"
                label="Registration closes"
                value={formatDateTime(tournament.registrationClosesAt, tournament.venue?.timeZone || undefined)}
              />
              {tournament.registrationMode !== 'INDIVIDUAL' ? (
                <Info
                  icon="people-outline"
                  label="Team roster"
                  value={`${tournament.minRosterSize}–${tournament.maxRosterSize} members`}
                />
              ) : null}
              <Info
                icon={tournament.paymentPolicy === 'FREE' ? 'gift-outline' : 'cash-outline'}
                label="Payment"
                value={tournament.paymentPolicy === 'FREE' ? 'Free entry' : `${feeText} at venue`}
                accent
              />
              <Info icon="card-outline" label="Paid online" value={formatMoney(0, tournament.currency)} />
            </View>
          </View>

          {tournament.organizer ? (
            <View style={styles.block}>
              <SectionHeader title="Organizer" />
              <View style={styles.card}>
                <View style={styles.organizer}>
                  <Avatar uri={tournament.organizer.avatarUrl} name={tournament.organizer.fullName} size={48} />
                  <View style={styles.organizerCopy}>
                    <Text style={styles.cardTitle}>{tournament.organizer.fullName || 'Tournament organizer'}</Text>
                    <Text style={styles.cardText}>Official tournament organizer</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.block}>
            <SectionHeader
              title={tournament.registrationMode === 'INDIVIDUAL' ? 'Confirmed entries' : 'Teams'}
              subtitle={tournament.entries?.length ? `${tournament.entries.length} registered` : undefined}
            />
            {tournament.entries?.length ? (
              <View style={styles.list}>
                {tournament.entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)}
              </View>
            ) : (
              <EmptyState compact icon="people-outline" title="No entries yet" message="Confirmed entries appear here." />
            )}
          </View>

          <View style={styles.block}>
            <SectionHeader title="Fixtures" />
            {tournament.fixtures?.length ? (
              <View style={styles.list}>
                {tournament.fixtures.map((fixture) => (
                  <View key={fixture.id} style={styles.fixture}>
                    <View style={styles.fixtureWhen}>
                      <Text style={styles.fixtureDate}>
                        {new Date(fixture.date)
                          .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
                          .toUpperCase()}
                      </Text>
                      <Text style={styles.fixtureTime}>
                        {fixture.time || formatTime(fixture.date, tournament.venue?.timeZone || undefined)}
                      </Text>
                    </View>
                    <View style={styles.fixtureMatch}>
                      <Text style={styles.fixtureTeam} numberOfLines={2}>{fixture.team1Name}</Text>
                      <Text style={styles.vs}>VS</Text>
                      <Text style={styles.fixtureTeam} numberOfLines={2}>{fixture.team2Name}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState compact icon="trophy-outline" title="No fixtures yet" message="The draw has not been published." />
            )}
          </View>

          <View style={styles.block}>
            <SectionHeader title="Rules" />
            <View style={styles.card}>
              {tournament.rules?.length ? (
                tournament.rules.map((rule, index) => (
                  <View key={`${rule}-${index}`} style={[styles.rule, index === 0 && styles.ruleFirst]}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.cardText}>The organizer has not published additional rules.</Text>
              )}
            </View>
          </View>

          {tournament.venue ? (
            <View style={styles.block}>
              <SectionHeader title="Venue" />
              <PressableScale
                style={styles.venueCard}
                scaleTo={0.985}
                onPress={openDirections}
                accessibilityRole="button"
                accessibilityLabel={`Directions to ${tournament.venue.name}`}
              >
                <View style={styles.venueIcon}>
                  <Ionicons name="navigate" size={20} color={theme.colors.onPrimary} />
                </View>
                <View style={styles.venueCopy}>
                  <Text style={styles.cardTitle}>{tournament.venue.name}</Text>
                  <Text style={styles.cardText} numberOfLines={2}>
                    {[tournament.venue.address, tournament.venue.city].filter(Boolean).join(', ')}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />
              </PressableScale>
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.s }]} pointerEvents="box-none">
        <Animated.View style={[styles.topBarBackdrop, topBarStyle]} pointerEvents="none" />
        <PressableScale
          style={styles.circleButton}
          scaleTo={0.9}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </PressableScale>
        <PressableScale
          style={styles.circleButton}
          scaleTo={0.9}
          haptic="selection"
          onPress={() =>
            Share.share({
              title: tournament.title,
              message: `${tournament.title}\n${formatDateTime(tournament.startsAt, tournament.venue?.timeZone || undefined)}\n${venueText}`,
            }).catch(() => undefined)
          }
          accessibilityRole="button"
          accessibilityLabel="Share tournament"
        >
          <Ionicons name="share-outline" size={21} color={theme.colors.text} />
        </PressableScale>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.m) }]}>
        <View style={styles.feeBlock}>
          <Text style={styles.feeLabel}>{tournament.paymentPolicy === 'FREE' ? 'ENTRY' : 'AT VENUE'}</Text>
          <Text style={styles.feeValue}>{feeText}</Text>
        </View>
        <Button
          title={ctaTitle}
          trailingIconName={ctaDisabled ? undefined : 'arrow-forward'}
          onPress={() =>
            confirmed
              ? navigation.navigate('EventWorkspace', { eventId: tournament.id, workspaceKind: 'tournament' })
              : navigation.navigate('TournamentRegister', { tournamentId: tournament.id })
          }
          disabled={ctaDisabled}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

function Fact({ label, value, icon, accent }: any) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={18} color={accent ? theme.colors.primary : theme.colors.textMuted} />
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, accent && styles.accent]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function Info({ icon, label, value, accent, first }: any) {
  return (
    <View style={[styles.info, first && styles.infoFirst]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, accent && styles.accent]}>{value}</Text>
      </View>
    </View>
  );
}

function EntryRow({ entry }: { entry: PublicTournamentEntry }) {
  const title =
    entry.type === 'TEAM'
      ? entry.teamName || 'Registered team'
      : entry.registrant?.fullName || entry.members[0]?.name || 'Individual entry';

  return (
    <View style={styles.entry}>
      <View style={styles.entryIcon}>
        <Ionicons name={entry.type === 'TEAM' ? 'people' : 'person'} size={19} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.entryCopy}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.cardText}>
          {entry.type === 'TEAM' ? `${entry.members.length} roster members` : 'Individual entry'}
        </Text>
        {entry.type === 'TEAM' && entry.members.length ? (
          <Text style={styles.rosterNames} numberOfLines={2}>
            {entry.members.map((member) => (member.isCaptain ? `${member.name} (C)` : member.name)).join(' · ')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function TournamentSkeleton({ insets }: any) {
  return (
    <View style={styles.container}>
      <Skeleton height={HERO_HEIGHT} radius={0} />
      <View style={[styles.body, { paddingTop: theme.spacing.l }]}>
        <Skeleton height={80} radius={theme.borderRadius.xl} />
        <View style={{ height: theme.spacing.m }} />
        <View style={styles.factGrid}>
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} height={104} radius={theme.borderRadius.xl} style={{ width: '48%' }} />
          ))}
        </View>
      </View>
      <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.s }]}>
        <Skeleton width={44} height={44} radius={22} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center' },
  backButton: { alignSelf: 'center', width: 180 },
  content: { paddingBottom: 130 },

  heroWrap: {
    height: HERO_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  heroImage: { width: '100%', height: '100%' },
  heroBody: { padding: theme.spacing.gutter, paddingBottom: theme.spacing.l },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s, marginBottom: theme.spacing.m },
  title: { ...theme.typography.h1, fontSize: 28, lineHeight: 34 },
  sport: { ...theme.typography.bodySmall, color: theme.colors.text, marginTop: theme.spacing.s },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.s,
  },
  topBarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  circleButton: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.6)',
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },

  body: { paddingHorizontal: theme.spacing.gutter, paddingTop: theme.spacing.l },
  block: { marginTop: theme.spacing.xl },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusCardConfirmed: { borderColor: theme.colors.primarySoft, backgroundColor: theme.colors.primaryMuted },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  statusCopy: { flex: 1, minWidth: 0 },

  capacityCard: {
    marginTop: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  capacityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.m },
  capacityLabel: { ...theme.typography.label, fontSize: 11 },
  capacityValue: { ...theme.typography.title, fontSize: 16, color: theme.colors.primary },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: theme.spacing.s,
    backgroundColor: theme.colors.surfaceLight,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: theme.colors.primary },

  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    marginTop: theme.spacing.m,
  },
  fact: {
    width: '47%',
    flexGrow: 1,
    gap: 6,
    minHeight: 100,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  factLabel: { ...theme.typography.label, fontSize: 11, marginTop: 4 },
  factValue: { ...theme.typography.title, fontSize: 15 },
  accent: { color: theme.colors.primary },

  card: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: { ...theme.typography.title, fontSize: 15 },
  cardText: { ...theme.typography.bodySmall, marginTop: 4 },

  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    paddingTop: theme.spacing.m,
    marginTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  infoFirst: { paddingTop: 0, marginTop: 0, borderTopWidth: 0 },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  infoCopy: { flex: 1, minWidth: 0 },
  infoLabel: { ...theme.typography.label, fontSize: 11 },
  infoValue: { ...theme.typography.bodySmall, color: theme.colors.text, fontFamily: theme.font.semibold, marginTop: 3 },

  organizer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  organizerCopy: { flex: 1, minWidth: 0 },

  list: { gap: theme.spacing.s },
  entry: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  entryIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  entryCopy: { flex: 1, minWidth: 0 },
  rosterNames: { ...theme.typography.caption, fontSize: 11, lineHeight: 16, marginTop: 6 },

  fixture: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fixtureWhen: { minWidth: 56 },
  fixtureDate: { ...theme.typography.label, color: theme.colors.primary, fontSize: 11 },
  fixtureTime: { ...theme.typography.title, fontSize: 14, marginTop: 3 },
  fixtureMatch: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: theme.spacing.s },
  fixtureTeam: {
    flex: 1,
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.font.semibold,
    textAlign: 'center',
  },
  vs: { ...theme.typography.label, color: theme.colors.textMuted, fontSize: 11 },

  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.s,
    paddingTop: theme.spacing.m,
    marginTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ruleFirst: { paddingTop: 0, marginTop: 0, borderTopWidth: 0 },
  ruleText: { ...theme.typography.bodySmall, flex: 1 },

  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  venueIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  venueCopy: { flex: 1, minWidth: 0 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  feeBlock: { minWidth: 74 },
  feeLabel: { ...theme.typography.label, fontSize: 11 },
  feeValue: { ...theme.typography.numeric, fontSize: 19, color: theme.colors.primary, marginTop: 2 },
  cta: { flex: 1 },
});
