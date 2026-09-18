import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { SuccessHero, successStyles } from '../../components/SuccessHero';
import { TicketCard } from '../../components/TicketCard';
import { theme } from '../../theme';

export const RegistrationSuccessScreen = ({ navigation, route }: any) => {
  const registration = route.params?.registration;
  const event = registration?.event;
  const home = () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });

  if (!registration || !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Registration unavailable"
          message="We couldn't load the details for this registration."
          actionLabel="Back to home"
          onAction={home}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SuccessHero
          title="You're in, champ!"
          message={
            <>
              Your {registration.quantity > 1 ? `${registration.quantity} tickets` : 'spot'} for{' '}
              <Text style={successStyles.bold}>{event.title}</Text> {registration.quantity > 1 ? 'are' : 'is'} secured.
            </>
          }
        />

        <View style={styles.ticket}>
          <TicketCard
            label="EVENT ENTRY"
            title={event.title}
            startsAt={event.startsAt}
            venue={[event.venue?.name, event.venue?.city].filter(Boolean).join(', ') || 'Venue to be announced'}
            participant={registration.type === 'TEAM' ? registration.teamName : registration.playerName}
            quantity={registration.quantity}
            ticketCode={registration.ticketCode}
            timeZone={event.venue?.timeZone}
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Open event chat"
            iconName="chatbubbles-outline"
            onPress={() =>
              navigation.reset({
                index: 1,
                routes: [{ name: 'MainTabs' }, { name: 'EventWorkspace', params: { eventId: event.id } }],
              })
            }
            fullWidth
          />
          <Button
            title="View booking details"
            variant="secondary"
            onPress={() => navigation.replace('BookingDetails', { kind: 'event', bookingId: registration.id })}
            fullWidth
          />
          <Button title="Back to home" variant="ghost" onPress={home} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { alignItems: 'center', padding: theme.spacing.gutter, paddingBottom: theme.spacing.xxl },
  ticket: { width: '100%', marginTop: theme.spacing.xl },
  actions: { width: '100%', gap: theme.spacing.s, marginTop: theme.spacing.xl },
});
