import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { PressableScale } from '../../components/PressableScale';
import { TicketCard } from '../../components/TicketCard';
import { theme } from '../../theme';

/** Full-screen ticket, presented as a transparent modal over the booking. */
export function FullTicketScreen({ navigation, route }: any) {
  const booking = route.params?.booking;
  if (!booking) return <SafeAreaView style={styles.container} />;

  const event = booking.kind === 'EVENT' || booking.kind === 'TOURNAMENT' ? booking.event : null;
  const venue = event?.venue || booking.venue;
  const label =
    booking.kind === 'TOURNAMENT'
      ? 'TOURNAMENT ENTRY'
      : booking.kind === 'EVENT'
        ? 'EVENT ENTRY'
        : 'VENUE RESERVATION';
  const participant =
    booking.kind === 'TOURNAMENT' && booking.registrationType === 'TEAM'
      ? booking.teamName || booking.participant
      : booking.participant;

  return (
    <SafeAreaView style={styles.container}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

      <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)} style={styles.header}>
        <Text style={styles.title}>Your ticket</Text>
        <PressableScale
          style={styles.close}
          scaleTo={0.9}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close ticket"
        >
          <Ionicons name="close" size={21} color={theme.colors.text} />
        </PressableScale>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View entering={ZoomIn.springify().damping(18).stiffness(160)} style={styles.ticketWrap}>
          <TicketCard
            label={label}
            title={event?.title || `${booking.sport?.name || 'Venue'} booking`}
            startsAt={booking.startsAt}
            venue={venue ? [venue.name, venue.city].filter(Boolean).join(', ') : undefined}
            participant={participant}
            quantity={booking.kind === 'EVENT' ? booking.quantity : undefined}
            ticketCode={booking.ticketCode}
            timeZone={venue?.timeZone}
            status={booking.status}
            compact
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.m,
  },
  title: { ...theme.typography.h3 },
  close: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.m },
  ticketWrap: { width: '100%', alignItems: 'center' },
});
