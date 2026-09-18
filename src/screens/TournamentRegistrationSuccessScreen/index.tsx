import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { SuccessHero, successStyles } from '../../components/SuccessHero';
import { TicketCard } from '../../components/TicketCard';
import { theme } from '../../theme';
import type { Tournament, TournamentEntry } from '../../types/tournament';

export function TournamentRegistrationSuccessScreen({ navigation, route }: any) {
  const entry = route.params?.entry as TournamentEntry | undefined;
  const tournament = route.params?.tournament as Tournament | undefined;

  const resetTo = (name: string, params?: Record<string, unknown>) =>
    navigation.reset({
      index: params ? 1 : 0,
      routes: params ? [{ name: 'MainTabs' }, { name, params }] : [{ name }],
    });

  if (!entry || !tournament) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Entry unavailable"
          message="We couldn't load the details for this tournament entry."
          actionLabel="Back to home"
          onAction={() => resetTo('MainTabs')}
        />
      </SafeAreaView>
    );
  }

  const participant = entry.type === 'TEAM' ? entry.teamName || entry.contactName : entry.contactName;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SuccessHero
          title="You're in, champ!"
          message={
            <>
              Your entry for <Text style={successStyles.bold}>{tournament.title}</Text> is confirmed.
            </>
          }
        />

        <View style={styles.ticket}>
          <TicketCard
            label="TOURNAMENT ENTRY"
            title={tournament.title}
            startsAt={tournament.startsAt}
            venue={
              [tournament.venue?.name, tournament.venue?.city].filter(Boolean).join(', ') || 'Venue to be announced'
            }
            participant={participant}
            ticketCode={entry.ticketCode}
            timeZone={tournament.venue?.timeZone || undefined}
            status={entry.status}
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Open tournament lounge"
            iconName="chatbubbles-outline"
            onPress={() => resetTo('EventWorkspace', { eventId: tournament.id, workspaceKind: 'tournament' })}
            fullWidth
          />
          <Button
            title="View booking details"
            variant="secondary"
            onPress={() => resetTo('BookingDetails', { kind: 'tournament', bookingId: entry.id })}
            fullWidth
          />
          <Button title="Back to home" variant="ghost" onPress={() => resetTo('MainTabs')} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { alignItems: 'center', padding: theme.spacing.gutter, paddingBottom: theme.spacing.xxl },
  ticket: { width: '100%', marginTop: theme.spacing.xl },
  actions: { width: '100%', gap: theme.spacing.s, marginTop: theme.spacing.xl },
});
