import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { BackendAPI } from '../../api/backend';
import { EmptyState } from '../../components/EmptyState';
import { SectionHeader } from '../../components/SectionHeader';
import { FriendsGoing } from '../../components/FriendsGoing';
import {
  formatCountdown,
  formatMoney,
  formatTime,
  isListingLive,
} from '../../utils/format';

import { styles } from './styles';
import { EventHero } from './components/EventHero';
import { TopBar, BottomBar, DetailSkeleton } from './components/EventLayout';
import {
  Stat,
  ScheduleRow,
  RegisteredCard,
  PlayersCard,
  AboutCard,
  FixtureItem,
  OrganizerCard,
  VenueCard,
} from './components/EventCards';

export const EventDetailsScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [friends, setFriends] = useState<{
    friends: any[];
    friendCount: number;
  }>({ friends: [], friendCount: 0 });
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
        if (data.event?.tournament)
          navigation.replace('TournamentDetails', {
            tournamentId: data.event.id,
          });
        else setEvent(data.event);
      })
      .catch((requestError: any) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [eventId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    BackendAPI.getFriendsGoingToEvent(eventId)
      .then((result: any) => {
        if (active)
          setFriends({
            friends: result.friends || [],
            friendCount: result.friendCount || 0,
          });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [eventId]);

  const scrollHandler = useAnimatedScrollHandler(scrollEvent => {
    scrollY.value = scrollEvent.contentOffset.y;
  });

  // Keep critical navigation references stable
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleOpenChat = useCallback(
    () => navigation.navigate('EventWorkspace', { eventId: event?.id }),
    [navigation, event?.id],
  );
  const handleBook = useCallback(() => {
    if (!event) return;
    const registered = Boolean(event.viewerRegistration);
    const isTeamEntry = event.registrationType === 'TEAM';
    if (registered) {
      navigation.navigate('BookingDetails', {
        kind: 'event',
        bookingId: event.viewerRegistration.id,
      });
    } else {
      navigation.navigate(isTeamEntry ? 'EventRegister' : 'EventTicket', {
        eventId: event.id,
      });
    }
  }, [navigation, event]);

  if (loading) return <DetailSkeleton insets={insets} />;

  if (!event || error) {
    return (
      <View style={styles.container}>
        <View style={[styles.errorWrap, { paddingTop: insets.top }]}>
          <EmptyState
            icon="alert-circle-outline"
            tone="error"
            title="Event not found"
            message={
              error ||
              'This event may have been removed or is no longer published.'
            }
            actionLabel="Go back"
            onAction={handleBack}
          />
        </View>
      </View>
    );
  }

  // Pre-calculations
  const registrations = event.registrations ?? [];
  const fixtures = event.fixtures ?? [];
  const regCount =
    event.capacityUnit === 'TICKETS'
      ? event.ticketsSold ??
        event.registrationCounts?.total ??
        event._count?.registrations ??
        registrations.length
      : event.registrationCounts?.total ??
        event.entryCount ??
        event._count?.registrations ??
        registrations.length;

  const full = Boolean(event.isFull);
  const registered = Boolean(event.viewerRegistration);
  const started = new Date(event.startsAt).getTime() <= Date.now();
  const live = isListingLive(event);
  const countdown = formatCountdown(event.startsAt);
  const joinDisabled = full || registered || started;
  const totalFee = event.registrationFeeMinor
    ? formatMoney(
        event.registrationFeeMinor + (event.serviceFeeMinor || 0),
        event.currency,
      )
    : 'Free';
  const isTeamEntry = event.registrationType === 'TEAM';
  const slotsLeft =
    typeof event.spotsRemaining === 'number' ? event.spotsRemaining : null;

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <EventHero
          event={event}
          scrollY={scrollY}
          live={live}
          countdown={countdown}
        />

        <View style={styles.body}>
          {registered ? <RegisteredCard onPress={handleOpenChat} /> : null}

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
                <ScheduleRow
                  time={formatTime(event.endsAt, event.venue?.timeZone)}
                  label="Event concludes"
                  last
                />
              ) : null}
            </View>
          </View>

          {friends.friends.length ? (
            <View style={styles.section}>
              <SectionHeader title="Friends going" />
              <FriendsGoing
                friends={friends.friends}
                friendCount={friends.friendCount}
              />
            </View>
          ) : null}

          {registrations.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Who's playing"
                subtitle={`${regCount} confirmed`}
              />
              <PlayersCard registrations={registrations} regCount={regCount} />
            </View>
          ) : null}

          {event.description || event.rules?.length ? (
            <View style={styles.section}>
              <SectionHeader title="About this event" />
              <AboutCard event={event} />
            </View>
          ) : null}

          {fixtures.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Fixtures"
                subtitle={`${fixtures.length} scheduled`}
              />
              <View style={styles.fixtureList}>
                {fixtures.map((fixture: any) => (
                  <FixtureItem key={fixture.id} fixture={fixture} />
                ))}
              </View>
            </View>
          ) : null}

          {event.organizer ? (
            <View style={styles.section}>
              <SectionHeader title="Organizer" />
              <OrganizerCard organizer={event.organizer} />
            </View>
          ) : null}

          {event.venue ? (
            <View style={styles.section}>
              <SectionHeader title="Venue" />
              <VenueCard venue={event.venue} />
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      <TopBar
        event={event}
        scrollY={scrollY}
        onBack={handleBack}
        insets={insets}
      />

      <BottomBar
        event={event}
        registered={registered}
        started={started}
        full={full}
        joinDisabled={joinDisabled}
        totalFee={totalFee}
        isTeamEntry={isTeamEntry}
        onBook={handleBook}
        insets={insets}
      />
    </View>
  );
};
