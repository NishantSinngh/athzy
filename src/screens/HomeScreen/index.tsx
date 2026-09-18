import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { theme } from '../../theme';
import { BackendAPI } from '../../api/backend';
import { greetingFor } from '../../utils/format';
import { prefetchImages } from '../../components/AppImage';
import { SectionHeader } from '../../components/SectionHeader';
import { FriendsGoing } from '../../components/FriendsGoing';
import { EmptyState } from '../../components/EmptyState';

import { styles, MAX_HERO } from './styles';
import { AmbientGlow, Header, SearchEntry } from './components/HomeHeader';
import {
  NextUpCard,
  EventCard,
  TournamentCard,
  VenueCard,
  FixtureCard,
  CommunityRow,
  SportChips,
} from './components/HomeCards';
import { HeroCarousel } from './components/HeroSection';
import {
  Section,
  Carousel,
  StaleBanner,
  HomeSkeleton,
} from './components/HomeLayout';

const EMPTY_ARRAY: any[] = [];

function openListing(navigation: any, item: any) {
  if (item.tournament)
    navigation.navigate('TournamentDetails', { tournamentId: item.id });
  else navigation.navigate('EventDetails', { eventId: item.id });
}

export const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>(EMPTY_ARRAY);
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendsGoing, setFriendsGoing] = useState<any[]>(EMPTY_ARRAY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'quiet' = 'initial') => {
      if (mode === 'refresh') setRefreshing(true);
      else if (mode === 'initial') setLoading(true);
      else setSyncing(true);

      const [feedResult, bookingResult, notificationResult, friendsResult] =
        await Promise.allSettled([
          BackendAPI.getHomeFeed(),
          BackendAPI.getMyBookings(),
          BackendAPI.getNotifications({ take: 20 }),
          BackendAPI.getFriendsGoing(),
        ]);

      if (feedResult.status === 'fulfilled') {
        setFeed(feedResult.value);
        setError('');
        prefetchImages([
          ...(feedResult.value.events ?? EMPTY_ARRAY)
            .slice(0, 6)
            .map((event: any) => event.imageUrl),
          ...(feedResult.value.venues ?? EMPTY_ARRAY)
            .slice(0, 4)
            .map((venue: any) => venue.imageUrl),
        ]);
      } else {
        setError(feedResult.reason?.message || 'Unable to load your feed.');
      }

      if (bookingResult.status === 'fulfilled')
        setBookings(bookingResult.value.bookings || EMPTY_ARRAY);
      if (friendsResult.status === 'fulfilled')
        setFriendsGoing(friendsResult.value.friendsGoing || EMPTY_ARRAY);
      if (notificationResult.status === 'fulfilled') {
        setUnreadCount(
          (notificationResult.value.notifications || EMPTY_ARRAY).filter(
            (item: any) => !item.readAt,
          ).length,
        );
      }

      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    },
    [],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  const hasLoaded = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasLoaded.current) load('quiet');
      hasLoaded.current = true;
    }, [load]),
  );

  const profile = feed?.profile;
  const firstName = profile?.fullName?.split(' ')[0] || 'Player';
  const location = profile?.locationCity || 'Set location';

  const listings = useMemo(() => feed?.events ?? EMPTY_ARRAY, [feed]);
  const events = useMemo(
    () => listings.filter((item: any) => !item.tournament),
    [listings],
  );
  const tournaments = useMemo(
    () => listings.filter((item: any) => item.tournament),
    [listings],
  );
  const heroItems = useMemo(() => listings.slice(0, MAX_HERO), [listings]);
  const venues = useMemo(() => feed?.venues ?? EMPTY_ARRAY, [feed]);
  const communityPosts = useMemo(
    () => feed?.communityPosts ?? EMPTY_ARRAY,
    [feed],
  );
  const fixtures = useMemo(() => feed?.fixtures ?? EMPTY_ARRAY, [feed]);
  const sports = useMemo(() => profile?.sports ?? EMPTY_ARRAY, [profile]);

  const nextBooking = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter(booking => {
        const status = String(booking.status).toUpperCase();
        return (
          status !== 'CANCELLED' &&
          status !== 'WITHDRAWN' &&
          new Date(booking.startsAt).getTime() >= now
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )[0];
  }, [bookings]);

  const onProfile = useCallback(
    () => navigation.navigate('Profile'),
    [navigation],
  );
  const onNotifications = useCallback(
    () => navigation.navigate('Notifications'),
    [navigation],
  );
  const onLocation = useCallback(() => {
    navigation.navigate('Location', {
      editing: true,
      city: profile?.locationCity ?? '',
      state: profile?.locationState ?? '',
      latitude:
        profile?.latitude == null ? undefined : Number(profile.latitude),
      longitude:
        profile?.longitude == null ? undefined : Number(profile.longitude),
    });
  }, [navigation, profile]);
  const onSearch = useCallback(
    () => navigation.navigate('Search'),
    [navigation],
  );

  const handleEventPress = useCallback(
    (event: any) => openListing(navigation, event),
    [navigation],
  );
  const handleTournamentPress = useCallback(
    (tournament: any) =>
      navigation.navigate('TournamentDetails', { tournamentId: tournament.id }),
    [navigation],
  );
  const handleVenuePress = useCallback(
    (venue: any) => navigation.navigate('VenueDetails', { venueId: venue.id }),
    [navigation],
  );
  const handleFixturePress = useCallback(
    (fixture: any) => {
      if (fixture.event?.id)
        navigation.navigate('EventDetails', { eventId: fixture.event.id });
    },
    [navigation],
  );
  const handlePostPress = useCallback(
    (post: any) => navigation.navigate('PostDetails', { postId: post.id }),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AmbientGlow />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <Header
          greeting={greetingFor()}
          name={firstName}
          avatarUrl={profile?.avatarUrl}
          location={location}
          unreadCount={unreadCount}
          loading={loading}
          onProfile={onProfile}
          onNotifications={onNotifications}
          onLocation={onLocation}
        />

        <SearchEntry onPress={onSearch} />

        {loading ? (
          <HomeSkeleton />
        ) : error && !feed ? (
          <EmptyState
            icon="cloud-offline-outline"
            tone="error"
            title="Can't reach Athzy"
            message={error}
            actionLabel="Try again"
            onAction={() => load('initial')}
          />
        ) : (
          <Animated.View
            entering={FadeIn.duration(theme.motion.duration.normal)}
          >
            {error ? <StaleBanner onRetry={() => load('refresh')} /> : null}

            {nextBooking ? (
              <Animated.View
                entering={FadeInDown.duration(theme.motion.duration.normal)}
              >
                <NextUpCard booking={nextBooking} navigation={navigation} />
              </Animated.View>
            ) : null}

            {friendsGoing.length ? (
              <Section delay={1}>
                <SectionHeader
                  style={styles.sectionHeader}
                  title="Friends are going"
                />
                <View style={styles.friendsList}>
                  {friendsGoing.slice(0, 3).map((entry: any) => (
                    <FriendsGoing
                      key={entry.event.id}
                      friends={entry.friends}
                      friendCount={entry.friendCount}
                      label={`${entry.friendCount} ${
                        entry.friendCount === 1 ? 'friend is' : 'friends are'
                      } going to ${entry.event.title}`}
                      onPress={() =>
                        navigation.navigate(
                          entry.event.isTournament
                            ? 'TournamentDetails'
                            : 'EventDetails',
                          entry.event.isTournament
                            ? { tournamentId: entry.event.id }
                            : { eventId: entry.event.id },
                        )
                      }
                    />
                  ))}
                </View>
              </Section>
            ) : null}

            {heroItems.length ? (
              <Animated.View
                entering={FadeIn.delay(theme.motion.stagger * 2).duration(
                  theme.motion.duration.slow,
                )}
              >
                <HeroCarousel items={heroItems} navigation={navigation} />
              </Animated.View>
            ) : null}

            {sports.length ? (
              <SportChips sports={sports} navigation={navigation} />
            ) : null}

            {events.length ? (
              <Section delay={3}>
                <SectionHeader
                  style={styles.sectionHeader}
                  title="Events Nearby"
                  subtitle={`${events.length} happening around ${location}`}
                  actionLabel="View All"
                  onAction={() => navigation.navigate('Events')}
                />
                <Carousel
                  data={events}
                  itemWidth={272}
                  renderItem={item => (
                    <EventCard event={item} onPress={handleEventPress} />
                  )}
                />
              </Section>
            ) : null}

            {fixtures.length ? (
              <Section delay={4}>
                <SectionHeader
                  style={styles.sectionHeader}
                  title="Upcoming Fixtures"
                  subtitle="Match-ups in your sports"
                />
                <Carousel
                  data={fixtures}
                  itemWidth={230}
                  renderItem={item => (
                    <FixtureCard fixture={item} onPress={handleFixturePress} />
                  )}
                />
              </Section>
            ) : null}

            {tournaments.length ? (
              <Section delay={5}>
                <SectionHeader
                  style={styles.sectionHeader}
                  title="Tournaments"
                  actionLabel="View All"
                  onAction={() =>
                    navigation.navigate('Events', { tab: 'TOURNAMENTS' })
                  }
                />
                <Carousel
                  data={tournaments}
                  itemWidth={286}
                  renderItem={item => (
                    <TournamentCard
                      tournament={item}
                      onPress={handleTournamentPress}
                    />
                  )}
                />
              </Section>
            ) : null}

            {venues.length ? (
              <Section delay={6}>
                <SectionHeader
                  style={styles.sectionHeader}
                  title="Premium Venues"
                  actionLabel="View All"
                  onAction={() => navigation.navigate('Venues')}
                />
                <Carousel
                  data={venues}
                  itemWidth={210}
                  renderItem={item => (
                    <VenueCard venue={item} onPress={handleVenuePress} />
                  )}
                />
              </Section>
            ) : null}

            {communityPosts.length ? (
              <Section delay={7}>
                <SectionHeader
                  style={styles.sectionHeader}
                  title="From the Community"
                  actionLabel="View All"
                  onAction={() => navigation.navigate('Community')}
                />
                <View style={styles.communityList}>
                  {communityPosts.slice(0, 3).map((post: any) => (
                    <CommunityRow
                      key={post.id}
                      post={post}
                      onPress={handlePostPress}
                    />
                  ))}
                </View>
              </Section>
            ) : null}

            {!heroItems.length && !venues.length && !communityPosts.length ? (
              <EmptyState
                icon="compass-outline"
                title="Nothing nearby yet"
                message="Set your city and pick a few sports so Athzy can find games around you."
                actionLabel="Choose sports"
                onAction={() =>
                  navigation.navigate('SportsInterest', { editing: true })
                }
              />
            ) : null}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
