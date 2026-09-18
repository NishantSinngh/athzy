import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '../../../components/PressableScale';
import { AppImage } from '../../../components/AppImage';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { theme } from '../../../theme';
import {
  formatCountdown,
  formatDayBadge,
  formatMoney,
  formatRelative,
  formatTime,
  isListingLive,
  isLiveNow,
} from '../../../utils/format';
import { styles } from '../styles';

export const NextUpCard = React.memo(({ booking, navigation }: any) => {
  const isVenue = booking.kind === 'VENUE';
  const title = isVenue
    ? booking.venue?.name || 'Venue booking'
    : booking.event?.title || 'Your event';
  const countdown = formatCountdown(booking.startsAt);
  const live = isListingLive(booking);
  const venueName = isVenue
    ? booking.venue?.city
    : booking.event?.venue?.name || booking.venue?.name;

  return (
    <PressableScale
      style={styles.nextUp}
      scaleTo={0.985}
      onPress={() =>
        navigation.navigate('BookingDetails', {
          kind:
            booking.kind === 'TOURNAMENT'
              ? 'tournament'
              : booking.kind === 'VENUE'
              ? 'venue'
              : 'event',
          bookingId: booking.id,
        })
      }
    >
      <LinearGradient
        colors={theme.gradients.brandFade}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.nextUpTop}>
        <Badge
          label={live ? 'Happening now' : 'Up next'}
          tone={live ? 'live' : 'primary'}
        />
        {countdown && !live ? (
          <Text style={styles.nextUpCountdown}>{countdown}</Text>
        ) : null}
      </View>
      <Text style={styles.nextUpTitle} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.nextUpMeta}>
        <Ionicons
          name="time-outline"
          size={15}
          color={theme.colors.textMuted}
        />
        <Text style={styles.nextUpMetaText}>
          {formatDayBadge(booking.startsAt)} · {formatTime(booking.startsAt)}
        </Text>
      </View>
      {venueName ? (
        <View style={styles.nextUpMeta}>
          <Ionicons
            name="location-outline"
            size={15}
            color={theme.colors.textMuted}
          />
          <Text style={styles.nextUpMetaText} numberOfLines={1}>
            {venueName}
          </Text>
        </View>
      ) : null}
      <View style={styles.nextUpActions}>
        <View style={styles.nextUpPrimary}>
          <Text style={styles.nextUpPrimaryText}>View ticket</Text>
          <Ionicons
            name="arrow-forward"
            size={15}
            color={theme.colors.onPrimary}
          />
        </View>
        {!isVenue && booking.event?.id ? (
          <PressableScale
            style={styles.nextUpSecondary}
            onPress={() =>
              navigation.navigate('EventWorkspace', {
                eventId: booking.event.id,
              })
            }
          >
            <Ionicons
              name="chatbubbles-outline"
              size={16}
              color={theme.colors.text}
            />
            <Text style={styles.nextUpSecondaryText}>Chat</Text>
          </PressableScale>
        ) : null}
      </View>
    </PressableScale>
  );
});

export const EventCard = React.memo(({ event, onPress }: any) => {
  const countdown = formatCountdown(event.startsAt);
  const live = isLiveNow(event.startsAt);
  const fee = event.registrationFeeMinor
    ? formatMoney(
        event.registrationFeeMinor + (event.serviceFeeMinor || 0),
        event.currency,
      )
    : 'Free';
  const attending = event._count?.registrations ?? 0;

  return (
    <PressableScale style={styles.card} onPress={() => onPress(event)}>
      <View style={styles.cardImageWrap}>
        <AppImage uri={event.imageUrl} style={styles.cardImage} />
        <View style={styles.cardImageTop}>
          {live ? (
            <Badge label="Live" tone="live" />
          ) : (
            <Badge label={formatDayBadge(event.startsAt)} tone="neutral" />
          )}
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons
            name="location-outline"
            size={14}
            color={theme.colors.textMuted}
          />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {event.venue?.name ?? 'Venue TBA'}
          </Text>
        </View>
        {countdown ? (
          <View style={styles.cardMeta}>
            <Ionicons
              name="time-outline"
              size={14}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.cardMetaText, styles.cardMetaAccent]}>
              {countdown}
            </Text>
          </View>
        ) : null}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardPrice}>{fee}</Text>
            {attending > 0 ? (
              <Text style={styles.cardPriceLabel}>{attending} going</Text>
            ) : null}
          </View>
          <View style={styles.cardArrow}>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={theme.colors.onPrimary}
            />
          </View>
        </View>
      </View>
    </PressableScale>
  );
});

export const TournamentCard = React.memo(({ tournament, onPress }: any) => (
  <PressableScale style={styles.card} onPress={() => onPress(tournament)}>
    <View style={styles.cardImageWrap}>
      <AppImage
        uri={tournament.imageUrl}
        fallback="tournament"
        style={styles.cardImage}
      />
      <LinearGradient
        colors={theme.gradients.imageScrim}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardImageTop}>
        <Badge
          label={tournament.sport?.name || 'Tournament'}
          tone="primary"
          icon="trophy-outline"
        />
      </View>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {tournament.title}
      </Text>
      <View style={styles.cardMeta}>
        <Ionicons
          name="calendar-outline"
          size={14}
          color={theme.colors.textMuted}
        />
        <Text style={styles.cardMetaText} numberOfLines={1}>
          {formatDayBadge(tournament.startsAt)} ·{' '}
          {tournament.venue?.name || 'Venue TBA'}
        </Text>
      </View>
      <View style={styles.cardCta}>
        <Text style={styles.cardCtaText}>View Tournament</Text>
      </View>
    </View>
  </PressableScale>
));

export const VenueCard = React.memo(({ venue, onPress }: any) => (
  <PressableScale style={styles.venueCard} onPress={() => onPress(venue)}>
    <View style={styles.venueImageWrap}>
      <AppImage
        uri={venue.imageUrl}
        fallback="venue"
        style={styles.venueImage}
      />
      {venue.rating ? (
        <View style={styles.rating}>
          <Ionicons name="star" size={11} color={theme.colors.warning} />
          <Text style={styles.ratingText}>
            {Number(venue.rating).toFixed(1)}
          </Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.venueName} numberOfLines={1}>
      {venue.name}
    </Text>
    <Text style={styles.venueCity} numberOfLines={1}>
      {venue.city}
    </Text>
    <Text style={styles.venuePrice}>
      {formatMoney(venue.basePriceMinor, venue.currency)}
      <Text style={styles.venuePriceUnit}> /hr</Text>
    </Text>
  </PressableScale>
));

export const FixtureCard = React.memo(({ fixture, onPress }: any) => (
  <PressableScale style={styles.fixture} onPress={() => onPress(fixture)}>
    <Text style={styles.fixtureDate}>{formatDayBadge(fixture.date)}</Text>
    <View style={styles.fixtureTeams}>
      <View style={styles.fixtureTeam}>
        <View
          style={[
            styles.fixtureMark,
            { backgroundColor: fixture.team1Color || theme.colors.primary },
          ]}
        />
        <Text style={styles.fixtureTeamName} numberOfLines={1}>
          {fixture.team1Name}
        </Text>
      </View>
      <Text style={styles.fixtureVs}>VS</Text>
      <View style={styles.fixtureTeam}>
        <View
          style={[
            styles.fixtureMark,
            { backgroundColor: fixture.team2Color || theme.colors.warning },
          ]}
        />
        <Text style={styles.fixtureTeamName} numberOfLines={1}>
          {fixture.team2Name}
        </Text>
      </View>
    </View>
    <Text style={styles.fixtureEvent} numberOfLines={1}>
      {fixture.time} · {fixture.event?.title || 'Fixture'}
    </Text>
  </PressableScale>
));

export const CommunityRow = React.memo(({ post, onPress }: any) => (
  <PressableScale
    style={styles.communityRow}
    scaleTo={0.985}
    onPress={() => onPress(post)}
  >
    <Avatar uri={post.user?.avatarUrl} name={post.user?.fullName} size={42} />
    <View style={styles.communityCopy}>
      <View style={styles.communityTop}>
        <Text style={styles.communityAuthor} numberOfLines={1}>
          {post.user?.fullName || 'Athzy Player'}
        </Text>
        <Text style={styles.communityTime}>
          {formatRelative(post.createdAt)}
        </Text>
      </View>
      <Text style={styles.communityText} numberOfLines={2}>
        {post.content}
      </Text>
      <View style={styles.communityStats}>
        <Ionicons
          name="heart-outline"
          size={13}
          color={theme.colors.textMuted}
        />
        <Text style={styles.communityStat}>{post.likes ?? 0}</Text>
        <Ionicons
          name="chatbubble-outline"
          size={13}
          color={theme.colors.textMuted}
          style={{ marginLeft: 12 }}
        />
        <Text style={styles.communityStat}>{post.comments ?? 0}</Text>
      </View>
    </View>
  </PressableScale>
));

export const SportChips = React.memo(({ sports, navigation }: any) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.sportChips}
    style={styles.sportChipsScroll}
  >
    {sports.map((entry: any) => (
      <PressableScale
        key={entry.sport.id}
        style={styles.sportChip}
        scaleTo={0.94}
        haptic="selection"
        onPress={() =>
          navigation.navigate('Events', { sportName: entry.sport.name })
        }
      >
        <Ionicons name="ellipse" size={7} color={theme.colors.primary} />
        <Text style={styles.sportChipText}>{entry.sport.name}</Text>
      </PressableScale>
    ))}
  </ScrollView>
));
