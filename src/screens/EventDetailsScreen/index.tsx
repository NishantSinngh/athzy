import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  FadeInDown,
} from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Avatar, AvatarStack } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { FriendsGoing } from '../../components/FriendsGoing';
import { HeroReveal } from '../../components/HeroReveal';
import { PressableScale } from '../../components/PressableScale';
import { SectionHeader } from '../../components/SectionHeader';
import { Skeleton } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import { formatCountdown, formatDayBadge, formatMoney, formatTime, isListingLive } from '../../utils/format';

const HERO_HEIGHT = 360;

export const EventDetailsScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [friends, setFriends] = useState<{ friends: any[]; friendCount: number }>({ friends: [], friendCount: 0 });
  const scrollY = useSharedValue(0);
  const eventId = route.params?.eventId;

  const load = useCallback(() => {
    if (!eventId) {
      setError('No event was selected.');
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    BackendAPI.getEvent(eventId)
      .then((data: any) => {
        if (data.event?.tournament) navigation.replace('TournamentDetails', { tournamentId: data.event.id });
        else setEvent(data.event);
      })
      .catch((requestError: any) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [eventId, navigation]);

  useEffect(() => { load(); }, [load]);

  // Separate from the event fetch: a failure here should cost the section, not
  // the page.
  useEffect(() => {
    if (!eventId) return;
    let active = true;
    BackendAPI.getFriendsGoingToEvent(eventId)
      .then((result: any) => { if (active) setFriends({ friends: result.friends || [], friendCount: result.friendCount || 0 }); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [eventId]);

  const scrollHandler = useAnimatedScrollHandler((scrollEvent) => {
    scrollY.value = scrollEvent.contentOffset.y;
  });

  /** Hero grows when pulled down and drifts up as you scroll away. */
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.35], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-HERO_HEIGHT, 0], [2.2, 1], Extrapolation.CLAMP) },
    ],
  }));

  /** Solid bar fades in behind the buttons once the title scrolls under them. */
  const topBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT - 180, HERO_HEIGHT - 90], [0, 1], Extrapolation.CLAMP),
  }));

  if (loading) return <DetailSkeleton insets={insets} />;

  if (!event || error) {
    return (
      <View style={styles.container}>
        <View style={[styles.errorWrap, { paddingTop: insets.top }]}>
          <EmptyState
            icon="alert-circle-outline"
            tone="error"
            title="Event not found"
            message={error || 'This event may have been removed or is no longer published.'}
            actionLabel="Go back"
            onAction={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  const registrations = event.registrations ?? [];
  const fixtures = event.fixtures ?? [];
  const regCount = event.capacityUnit === 'TICKETS'
    ? event.ticketsSold ?? event.registrationCounts?.total ?? event._count?.registrations ?? registrations.length
    : event.registrationCounts?.total ?? event.entryCount ?? event._count?.registrations ?? registrations.length;
  const full = Boolean(event.isFull);
  const registered = Boolean(event.viewerRegistration);
  const started = new Date(event.startsAt).getTime() <= Date.now();
  const live = isListingLive(event);
  const countdown = formatCountdown(event.startsAt);
  const joinDisabled = full || registered || started;
  const totalFee = event.registrationFeeMinor
    ? formatMoney(event.registrationFeeMinor + (event.serviceFeeMinor || 0), event.currency)
    : 'Free';
  const isTeamEntry = event.registrationType === 'TEAM';
  // Backend reports seats left in tickets, falling back to the raw capacity sum.
  const slotsLeft = typeof event.spotsRemaining === 'number' ? event.spotsRemaining : null;

  const openDirections = () => {
    const destination = [event.venue?.name, event.venue?.address, event.venue?.city].filter(Boolean).join(', ');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`).catch(() =>
      showToast({ message: 'Could not open maps on this device.', tone: 'error' }),
    );
  };

  const shareEvent = () =>
    Share.share({
      title: event.title,
      message: `${event.title}\n${formatDayBadge(event.startsAt)} · ${formatTime(event.startsAt, event.venue?.timeZone)}\n${event.venue?.name || 'Venue TBA'}\n\nJoin me on Athzy.`,
    }).catch(() => undefined);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.heroWrap}>
          <Animated.View style={[styles.heroImageWrap, heroStyle]}>
            <HeroReveal style={styles.heroImage}>
              <AppImage uri={event.imageUrl} style={styles.heroImage} priority="high" />
            </HeroReveal>
          </Animated.View>
          <LinearGradient colors={theme.gradients.imageScrim} style={styles.heroScrim} />

          <View style={styles.heroBody}>
            <View style={styles.heroBadges}>
              {live ? <Badge label="Live now" tone="live" /> : null}
              {!live && countdown ? <Badge label={countdown} tone="primary" caps={false} /> : null}
              {event.eventType ? <Badge label={String(event.eventType).replaceAll('_', ' ')} tone="neutral" /> : null}
              {event.isPremium ? <Badge label="Premium" tone="warning" icon="star" /> : null}
            </View>

            <Text style={styles.heroTitle}>{event.title}</Text>

            <View style={styles.heroMeta}>
              <Ionicons name="calendar-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={styles.heroMetaText}>
                {formatDayBadge(event.startsAt, event.venue?.timeZone)} · {formatTime(event.startsAt, event.venue?.timeZone)}
              </Text>
            </View>
            <View style={styles.heroMeta}>
              <Ionicons name="location-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={styles.heroMetaText} numberOfLines={1}>
                {[event.venue?.name, event.venue?.city].filter(Boolean).join(', ') || 'Venue to be announced'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {registered ? (
            <Animated.View entering={FadeInDown.duration(theme.motion.duration.normal)} style={styles.registeredCard}>
              <View style={styles.registeredIcon}>
                <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.registeredCopy}>
                <Text style={styles.registeredTitle}>You're registered</Text>
                <Text style={styles.registeredMeta}>Your ticket and event channels are ready</Text>
              </View>
              <PressableScale
                style={styles.registeredAction}
                onPress={() => navigation.navigate('EventWorkspace', { eventId: event.id })}
                accessibilityRole="button"
                accessibilityLabel="Open event chat"
              >
                <Ionicons name="chatbubbles" size={17} color={theme.colors.onPrimary} />
              </PressableScale>
            </Animated.View>
          ) : null}

          <View style={styles.stats}>
            <Stat label="ENTRY FEE" value={totalFee} accent />
            <Stat
              label="SLOTS"
              value={slotsLeft === null ? 'Open' : `${slotsLeft} left`}
              warn={slotsLeft !== null && slotsLeft <= 3 && slotsLeft > 0}
            />
            <Stat label="JOINED" value={String(regCount)} />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Schedule" />
            <View style={styles.schedule}>
              <ScheduleRow
                time={formatTime(event.startsAt, event.venue?.timeZone)}
                label="Event starts"
                active
              />
              {event.endsAt ? (
                <ScheduleRow time={formatTime(event.endsAt, event.venue?.timeZone)} label="Event concludes" last />
              ) : null}
            </View>
          </View>

          {friends.friends.length ? (
            <View style={styles.section}>
              <SectionHeader title="Friends going" />
              <FriendsGoing friends={friends.friends} friendCount={friends.friendCount} />
            </View>
          ) : null}

          {registrations.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Who's playing" subtitle={`${regCount} confirmed`} />
              <View style={styles.joined}>
                <AvatarStack
                  users={registrations.map((registration: any) => registration.user).filter(Boolean)}
                  total={regCount}
                  size={38}
                  max={4}
                />
                <Text style={styles.joinedText} numberOfLines={2}>
                  {registrations
                    .slice(0, 2)
                    .map((registration: any) => registration.user?.fullName || 'A player')
                    .join(', ')}
                  {regCount > registrations.length ? ` · ${regCount} tickets booked` : regCount > 2 ? ` and ${regCount - 2} others have joined` : ' joined'}
                </Text>
              </View>
            </View>
          ) : null}

          {event.description || event.rules?.length ? (
            <View style={styles.section}>
              <SectionHeader title="About this event" />
              <View style={styles.card}>
                {event.description ? <Text style={styles.about}>{event.description}</Text> : null}
                {event.rules?.length ? (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.rulesTitle}>Event rules</Text>
                    {event.rules.map((rule: string, index: number) => (
                      <View key={`${rule}-${index}`} style={styles.rule}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                        <Text style={styles.ruleText}>{rule}</Text>
                      </View>
                    ))}
                  </>
                ) : null}
              </View>
            </View>
          ) : null}

          {fixtures.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Fixtures" subtitle={`${fixtures.length} scheduled`} />
              <View style={styles.fixtureList}>
                {fixtures.map((fixture: any) => (
                  <View key={fixture.id} style={styles.fixture}>
                    <View style={styles.fixtureWhen}>
                      <Text style={styles.fixtureDay}>
                        {new Date(fixture.date).toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}
                      </Text>
                      <Text style={styles.fixtureTime}>{fixture.time}</Text>
                    </View>
                    <View style={styles.fixtureTeams}>
                      <View style={styles.fixtureTeam}>
                        <View style={[styles.fixtureMark, { backgroundColor: fixture.team1Color || theme.colors.primary }]} />
                        <Text style={styles.fixtureTeamName} numberOfLines={1}>{fixture.team1Name}</Text>
                      </View>
                      <Text style={styles.fixtureVs}>VS</Text>
                      <View style={styles.fixtureTeam}>
                        <View style={[styles.fixtureMark, { backgroundColor: fixture.team2Color || theme.colors.warning }]} />
                        <Text style={styles.fixtureTeamName} numberOfLines={1}>{fixture.team2Name}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {event.organizer ? (
            <View style={styles.section}>
              <SectionHeader title="Organizer" />
              <View style={styles.card}>
                <View style={styles.organizer}>
                  <Avatar uri={event.organizer.avatarUrl} name={event.organizer.fullName} size={48} />
                  <View style={styles.organizerCopy}>
                    <Text style={styles.organizerName}>{event.organizer.fullName || 'Athzy Organizer'}</Text>
                    <Text style={styles.organizerMeta}>Hosting this event</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {event.venue ? (
            <View style={styles.section}>
              <SectionHeader title="Venue" />
              <View style={styles.venueCard}>
                <View style={styles.venueImageWrap}>
                  <AppImage uri={event.venue.imageUrl} fallback="venue" style={styles.venueImage} />
                  <LinearGradient colors={theme.gradients.imageScrim} style={StyleSheet.absoluteFill} />
                  <PressableScale
                    style={styles.directions}
                    onPress={openDirections}
                    accessibilityRole="button"
                    accessibilityLabel={`Get directions to ${event.venue.name}`}
                  >
                    <Ionicons name="navigate" size={14} color={theme.colors.onPrimary} />
                    <Text style={styles.directionsText}>Directions</Text>
                  </PressableScale>
                </View>
                <View style={styles.venueBody}>
                  <Text style={styles.venueName}>{event.venue.name}</Text>
                  <Text style={styles.venueAddress} numberOfLines={2}>
                    {[event.venue.address, event.venue.city].filter(Boolean).join(', ')}
                  </Text>
                  {event.venue.rating ? (
                    <View style={styles.venueRating}>
                      <Ionicons name="star" size={13} color={theme.colors.warning} />
                      <Text style={styles.venueRatingText}>{Number(event.venue.rating).toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* Floating top controls, with a bar that fades in on scroll. */}
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
          onPress={shareEvent}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel="Share event"
        >
          <Ionicons name="share-outline" size={21} color={theme.colors.text} />
        </PressableScale>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.m) }]}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>{event.registrationFeeMinor ? 'TOTAL' : 'ENTRY'}</Text>
          <Text style={styles.priceValue}>{totalFee}</Text>
        </View>
        <Button
          title={
            registered
              ? 'View my ticket'
              : started
                ? 'Booking closed'
                : full
                  ? 'Sold out'
                  : isTeamEntry
                    ? 'Enter a team'
                    : 'Book tickets'
          }
          trailingIconName={registered || !joinDisabled ? 'arrow-forward' : undefined}
          onPress={() =>
            registered
              ? navigation.navigate('BookingDetails', { kind: 'event', bookingId: event.viewerRegistration.id })
              : // A team event is a squad entry; everything else is a ticket sale.
                navigation.navigate(isTeamEntry ? 'EventRegister' : 'EventTicket', { eventId: event.id })
          }
          disabled={joinDisabled && !registered}
          style={styles.joinButton}
        />
      </View>
    </View>
  );
};

function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statAccent, warn && styles.statWarn]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ScheduleRow({ time, label, active, last }: { time: string; label: string; active?: boolean; last?: boolean }) {
  return (
    <View style={styles.scheduleRow}>
      <View style={styles.scheduleRail}>
        <View style={[styles.scheduleDot, active && styles.scheduleDotActive]} />
        {!last ? <View style={styles.scheduleLine} /> : null}
      </View>
      <View style={styles.scheduleCopy}>
        <Text style={styles.scheduleTime}>{time}</Text>
        <Text style={styles.scheduleLabel}>{label}</Text>
      </View>
    </View>
  );
}

function DetailSkeleton({ insets }: any) {
  return (
    <View style={styles.container}>
      <Skeleton height={HERO_HEIGHT} radius={0} />
      <View style={[styles.body, { paddingTop: theme.spacing.l }]}>
        <View style={styles.stats}>
          {[0, 1, 2].map((key) => <Skeleton key={key} height={72} radius={theme.borderRadius.l} style={{ flex: 1 }} />)}
        </View>
        <View style={{ height: theme.spacing.xl }} />
        <Skeleton height={20} width="45%" radius={theme.borderRadius.xs} />
        <View style={{ height: theme.spacing.m }} />
        <Skeleton height={120} radius={theme.borderRadius.xl} />
      </View>
      <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.s }]}>
        <Skeleton width={44} height={44} radius={22} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingBottom: 130 },
  errorWrap: { flex: 1, justifyContent: 'center' },

  heroWrap: { height: HERO_HEIGHT, justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: theme.colors.surface },
  heroImageWrap: { ...StyleSheet.absoluteFillObject },
  heroImage: { width: '100%', height: '100%' },
  heroScrim: { ...StyleSheet.absoluteFillObject },
  heroBody: { padding: theme.spacing.gutter, paddingBottom: theme.spacing.l },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s, marginBottom: theme.spacing.m },
  heroTitle: { ...theme.typography.h1, fontSize: 28, lineHeight: 34 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: theme.spacing.s },
  heroMetaText: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1 },

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
  section: { marginTop: theme.spacing.xl },

  registeredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
  },
  registeredIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(69,240,106,0.14)',
  },
  registeredCopy: { flex: 1, minWidth: 0 },
  registeredTitle: { ...theme.typography.title, fontSize: 15 },
  registeredMeta: { ...theme.typography.caption, marginTop: 2 },
  registeredAction: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },

  stats: { flexDirection: 'row', gap: theme.spacing.s },
  stat: {
    flex: 1,
    minWidth: 0,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statLabel: { ...theme.typography.label, fontSize: 11 },
  statValue: { ...theme.typography.title, fontSize: 17, marginTop: theme.spacing.s },
  statAccent: { color: theme.colors.primary },
  statWarn: { color: theme.colors.warning },

  schedule: { paddingLeft: 4 },
  scheduleRow: { flexDirection: 'row', gap: theme.spacing.m },
  scheduleRail: { alignItems: 'center', width: 16 },
  scheduleDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: theme.colors.surfaceLight },
  scheduleDotActive: { backgroundColor: theme.colors.primary },
  scheduleLine: { flex: 1, width: 2, marginVertical: 4, backgroundColor: theme.colors.border },
  scheduleCopy: { flex: 1, paddingBottom: theme.spacing.l },
  scheduleTime: { ...theme.typography.title, fontSize: 15 },
  scheduleLabel: { ...theme.typography.caption, marginTop: 3 },

  joined: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  joinedText: { ...theme.typography.bodySmall, flex: 1 },

  card: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  about: { ...theme.typography.bodyLarge, fontSize: 15 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.m },
  rulesTitle: { ...theme.typography.label, marginBottom: theme.spacing.m },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.s, marginBottom: theme.spacing.s },
  ruleText: { ...theme.typography.bodySmall, flex: 1 },

  fixtureList: { gap: theme.spacing.s },
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
  fixtureWhen: { alignItems: 'center', minWidth: 54 },
  fixtureDay: { ...theme.typography.label, color: theme.colors.primary, fontSize: 11 },
  fixtureTime: { ...theme.typography.title, fontSize: 15, marginTop: 3 },
  fixtureTeams: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  fixtureTeam: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, minWidth: 0 },
  fixtureMark: { width: 24, height: 24, borderRadius: 12 },
  fixtureTeamName: { ...theme.typography.caption, color: theme.colors.text, fontFamily: theme.font.semibold, flex: 1 },
  fixtureVs: { ...theme.typography.label, color: theme.colors.textMuted, fontSize: 11 },

  organizer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  organizerCopy: { flex: 1, minWidth: 0 },
  organizerName: { ...theme.typography.title, fontSize: 15 },
  organizerMeta: { ...theme.typography.caption, marginTop: 2 },

  venueCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  venueImageWrap: { height: 160, justifyContent: 'flex-end', alignItems: 'flex-end', padding: theme.spacing.m },
  venueImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  directions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
  },
  directionsText: { ...theme.typography.caption, color: theme.colors.onPrimary, fontFamily: theme.font.bold },
  venueBody: { padding: theme.spacing.m },
  venueName: { ...theme.typography.title, fontSize: 16 },
  venueAddress: { ...theme.typography.bodySmall, marginTop: 4 },
  venueRating: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: theme.spacing.s },
  venueRatingText: { ...theme.typography.caption, color: theme.colors.text, fontFamily: theme.font.bold },

  bottomBar: {
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
  priceBlock: { minWidth: 74 },
  priceLabel: { ...theme.typography.label, fontSize: 11 },
  priceValue: { ...theme.typography.title, fontSize: 19, color: theme.colors.primary, marginTop: 2 },
  joinButton: { flex: 1 },
});
