import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppImage } from '../../../components/AppImage';
import { Avatar, AvatarStack } from '../../../components/Avatar';
import { PressableScale } from '../../../components/PressableScale';
import { showToast } from '../../../components/Toast';
import { theme } from '../../../theme';
import { styles } from '../styles';

export const Stat = React.memo(({ label, value, accent, warn }: any) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text
      style={[
        styles.statValue,
        accent && styles.statAccent,
        warn && styles.statWarn,
      ]}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
));

export const ScheduleRow = React.memo(({ time, label, active, last }: any) => (
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
));

export const RegisteredCard = React.memo(({ onPress }: any) => (
  <Animated.View
    entering={FadeInDown.duration(theme.motion.duration.normal)}
    style={styles.registeredCard}
  >
    <View style={styles.registeredIcon}>
      <Ionicons
        name="checkmark-circle"
        size={22}
        color={theme.colors.primary}
      />
    </View>
    <View style={styles.registeredCopy}>
      <Text style={styles.registeredTitle}>You're registered</Text>
      <Text style={styles.registeredMeta}>
        Your ticket and event channels are ready
      </Text>
    </View>
    <PressableScale
      style={styles.registeredAction}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open event chat"
    >
      <Ionicons name="chatbubbles" size={17} color={theme.colors.onPrimary} />
    </PressableScale>
  </Animated.View>
));

export const PlayersCard = React.memo(({ registrations, regCount }: any) => (
  <View style={styles.joined}>
    <AvatarStack
      users={registrations
        .map((registration: any) => registration.user)
        .filter(Boolean)}
      total={regCount}
      size={38}
      max={4}
    />
    <Text style={styles.joinedText} numberOfLines={2}>
      {registrations
        .slice(0, 2)
        .map((registration: any) => registration.user?.fullName || 'A player')
        .join(', ')}
      {regCount > registrations.length
        ? ` · ${regCount} tickets booked`
        : regCount > 2
        ? ` and ${regCount - 2} others have joined`
        : ' joined'}
    </Text>
  </View>
));

export const AboutCard = React.memo(({ event }: any) => (
  <View style={styles.card}>
    {event.description ? (
      <Text style={styles.about}>{event.description}</Text>
    ) : null}
    {event.rules?.length ? (
      <>
        <View style={styles.divider} />
        <Text style={styles.rulesTitle}>Event rules</Text>
        {event.rules.map((rule: string, index: number) => (
          <View key={`${rule}-${index}`} style={styles.rule}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </>
    ) : null}
  </View>
));

export const FixtureItem = React.memo(({ fixture }: any) => (
  <View style={styles.fixture}>
    <View style={styles.fixtureWhen}>
      <Text style={styles.fixtureDay}>
        {new Date(fixture.date)
          .toLocaleDateString('en-IN', { weekday: 'short' })
          .toUpperCase()}
      </Text>
      <Text style={styles.fixtureTime}>{fixture.time}</Text>
    </View>
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
  </View>
));

export const OrganizerCard = React.memo(({ organizer }: any) => (
  <View style={styles.card}>
    <View style={styles.organizer}>
      <Avatar uri={organizer.avatarUrl} name={organizer.fullName} size={48} />
      <View style={styles.organizerCopy}>
        <Text style={styles.organizerName}>
          {organizer.fullName || 'Athzy Organizer'}
        </Text>
        <Text style={styles.organizerMeta}>Hosting this event</Text>
      </View>
    </View>
  </View>
));

export const VenueCard = React.memo(({ venue }: any) => {
  const handleDirections = () => {
    const destination = [venue.name, venue.address, venue.city]
      .filter(Boolean)
      .join(', ');
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        destination,
      )}`,
    ).catch(() =>
      showToast({
        message: 'Could not open maps on this device.',
        tone: 'error',
      }),
    );
  };

  return (
    <View style={styles.venueCard}>
      <View style={styles.venueImageWrap}>
        <AppImage
          uri={venue.imageUrl}
          fallback="venue"
          style={styles.venueImage}
        />
        <LinearGradient
          colors={theme.gradients.imageScrim}
          style={StyleSheet.absoluteFill}
        />
        <PressableScale
          style={styles.directions}
          onPress={handleDirections}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${venue.name}`}
        >
          <Ionicons name="navigate" size={14} color={theme.colors.onPrimary} />
          <Text style={styles.directionsText}>Directions</Text>
        </PressableScale>
      </View>
      <View style={styles.venueBody}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <Text style={styles.venueAddress} numberOfLines={2}>
          {[venue.address, venue.city].filter(Boolean).join(', ')}
        </Text>
        {venue.rating ? (
          <View style={styles.venueRating}>
            <Ionicons name="star" size={13} color={theme.colors.warning} />
            <Text style={styles.venueRatingText}>
              {Number(venue.rating).toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});
