import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PressableScale } from '../../components/PressableScale';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SectionHeader } from '../../components/SectionHeader';
import { Skeleton } from '../../components/Skeleton';
import { TicketCard } from '../../components/TicketCard';
import { showToast } from '../../components/Toast';
import { addBookingToCalendar } from '../../utils/calendar';
import { theme } from '../../theme';
import { formatDateTime, formatMoney, formatTime } from '../../utils/format';

const humanize = (value?: string | null) =>
  value
    ? value
        .toLowerCase()
        .split('_')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ')
    : 'Not specified';

export function BookingDetailsScreen({ navigation, route }: any) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [savingToCalendar, setSavingToCalendar] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await BackendAPI.getMyBooking(route.params?.kind, route.params?.bookingId);
      setBooking(data.booking);
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to load this booking.');
    } finally {
      setLoading(false);
    }
  }, [route.params?.bookingId, route.params?.kind]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <BookingSkeleton navigation={navigation} />;

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader navigation={navigation} title="Booking" />
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Unable to load booking"
          message={error}
          actionLabel="Try again"
          onAction={load}
        />
      </SafeAreaView>
    );
  }

  const isTournament = booking.kind === 'TOURNAMENT';
  const isEvent = booking.kind === 'EVENT';
  const event = isTournament || isEvent ? booking.event : null;
  const tournament = isTournament ? event?.tournament : null;
  const venue = event?.venue || booking.venue;
  const title = event?.title || `${booking.sport?.name || 'Venue'} at ${venue?.name || 'venue'}`;
  const screenTitle = isTournament ? 'Tournament entry' : isEvent ? 'Event entry' : 'Reservation';
  const ticketLabel = isTournament ? 'TOURNAMENT ENTRY' : isEvent ? 'EVENT ENTRY' : 'VENUE RESERVATION';
  const participant =
    isTournament && booking.registrationType === 'TEAM' ? booking.teamName || booking.participant : booking.participant;
  const inactive = booking.status === 'CANCELLED' || booking.status === 'WITHDRAWN';
  const canWithdraw = isTournament && booking.status === 'CONFIRMED' && new Date(booking.startsAt).getTime() > Date.now();
  const upcoming = !inactive && new Date(booking.startsAt).getTime() > Date.now();
  const dueMinor = isTournament || isEvent ? booking.totalDueMinor ?? 0 : booking.amountDueAtVenueMinor ?? 0;
  const payableAtVenue = !inactive && dueMinor > 0;

  const openMaps = () =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [venue?.name, venue?.address, venue?.city].filter(Boolean).join(', '),
      )}`,
    ).catch(() => showToast({ message: 'Could not open maps on this device.', tone: 'error' }));

  const saveToCalendar = async () => {
    setSavingToCalendar(true);
    const result = await addBookingToCalendar({
      title: title,
      startsAt: booking.startsAt,
      endsAt: event?.endsAt ?? null,
      location: venue ? [venue.name, venue.address, venue.city].filter(Boolean).join(', ') : null,
      notes: `Athzy booking ${booking.ticketCode}`,
      timeZone: venue?.timeZone ?? null,
    });
    setSavingToCalendar(false);

    showToast(
      result.ok
        ? { message: result.calendarName ? `Added to ${result.calendarName}.` : 'Added to your calendar.', tone: 'success' }
        : { message: result.message, tone: result.reason === 'denied' ? 'info' : 'error' },
    );
  };

  const cancelVenue = () =>
    Alert.alert(
      'Cancel reservation?',
      'No online payment was collected. This slot becomes available to other players.',
      [
        { text: 'Keep reservation', style: 'cancel' },
        {
          text: 'Cancel reservation',
          style: 'destructive',
          onPress: async () => {
            setWorking(true);
            try {
              const result = await BackendAPI.cancelVenueBooking(venue.id, booking.id);
              setBooking((current: any) => ({ ...current, ...result.booking, kind: 'VENUE' }));
              showToast({ message: 'Reservation cancelled.', tone: 'success' });
            } catch (requestError: any) {
              showToast({ message: requestError.message || 'Could not cancel.', tone: 'error' });
            } finally {
              setWorking(false);
            }
          },
        },
      ],
    );

  const withdrawTournament = () =>
    Alert.alert(
      'Withdraw tournament entry?',
      'Your entry is marked withdrawn and lounge access is removed. No online payment was collected.',
      [
        { text: 'Keep entry', style: 'cancel' },
        {
          text: 'Withdraw entry',
          style: 'destructive',
          onPress: async () => {
            setWorking(true);
            try {
              const result = await BackendAPI.withdrawTournamentEntry(event.id, booking.id);
              setBooking((current: any) => ({ ...current, ...result.entry, kind: 'TOURNAMENT' }));
              showToast({ message: 'Entry withdrawn.', tone: 'info' });
            } catch (requestError: any) {
              showToast({ message: requestError.message || 'Could not withdraw.', tone: 'error' });
            } finally {
              setWorking(false);
            }
          },
        },
      ],
    );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title={screenTitle} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(theme.motion.duration.normal)} style={styles.ticketWrap}>
          <TicketCard
            label={ticketLabel}
            title={title}
            startsAt={booking.startsAt}
            venue={venue ? [venue.name, venue.city].filter(Boolean).join(', ') : undefined}
            participant={participant}
            quantity={isEvent ? booking.quantity : undefined}
            ticketCode={booking.ticketCode}
            timeZone={venue?.timeZone}
            status={booking.status}
            compact
          />
        </Animated.View>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, inactive && styles.statusDotVoid, upcoming && styles.statusDotUpcoming]} />
          <Text style={styles.statusLabel}>Booking status</Text>
          <Badge
            label={inactive ? String(booking.status).replaceAll('_', ' ') : upcoming ? 'Upcoming' : 'Completed'}
            tone={inactive ? 'error' : upcoming ? 'warning' : 'neutral'}
          />
        </View>

        {!inactive ? (
          <View style={styles.actions}>
            <ActionCard
              icon="qr-code-outline"
              label="Full ticket"
              onPress={() => navigation.navigate('FullTicket', { booking })}
            />
            {isTournament && booking.status === 'CONFIRMED' ? (
              <ActionCard
                icon="chatbubbles-outline"
                label="Tournament lounge"
                onPress={() =>
                  navigation.navigate('EventWorkspace', { eventId: event.id, workspaceKind: 'tournament' })
                }
              />
            ) : isEvent ? (
              <ActionCard
                icon="chatbubbles-outline"
                label="Event chat"
                onPress={() => navigation.navigate('EventWorkspace', { eventId: event.id })}
              />
            ) : null}
            {event ? (
              <ActionCard
                icon="calendar-outline"
                label={isTournament ? 'Tournament' : 'Event page'}
                onPress={() =>
                  navigation.navigate(
                    isTournament ? 'TournamentDetails' : 'EventDetails',
                    isTournament ? { tournamentId: event.id } : { eventId: event.id },
                  )
                }
              />
            ) : null}
            {venue ? <ActionCard icon="navigate-outline" label="Directions" onPress={openMaps} /> : null}
            <ActionCard
              icon="calendar-outline"
              label="Add to calendar"
              onPress={saveToCalendar}
              busy={savingToCalendar}
            />
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader
            title={isTournament ? 'Tournament information' : isEvent ? 'Event information' : 'Reservation information'}
          />
          <View style={styles.card}>
            <Info icon="calendar-outline" label="Date and time" value={formatDateTime(booking.startsAt, venue?.timeZone)} first />
            {booking.durationMinutes ? (
              <Info icon="time-outline" label="Duration" value={`${booking.durationMinutes} minutes`} />
            ) : null}
            <Info
              icon="football-outline"
              label="Sport"
              value={event?.sport?.name || booking.sport?.name || 'Sport'}
            />

            {isTournament ? (
              <>
                <Info icon="git-network-outline" label="Format" value={humanize(tournament?.format)} />
                {tournament?.reportingAt ? (
                  <Info
                    icon="flag-outline"
                    label="Reporting time"
                    value={formatDateTime(tournament.reportingAt, venue?.timeZone)}
                  />
                ) : null}
                {tournament?.entryGate ? <Info icon="enter-outline" label="Entry gate" value={tournament.entryGate} /> : null}
                <Info
                  icon={booking.paymentPolicy === 'FREE' ? 'gift-outline' : 'cash-outline'}
                  label="Payment"
                  value={
                    inactive
                      ? 'Nothing due — entry withdrawn'
                      : booking.paymentPolicy === 'FREE'
                        ? 'Free entry'
                        : `${formatMoney(booking.totalDueMinor, booking.currency)} at venue`
                  }
                  accent={!inactive}
                />
              </>
            ) : null}

            {isEvent ? (
              <>
                <Info icon="ticket-outline" label="Tickets" value={String(booking.quantity ?? 1)} />
                <Info
                  icon={dueMinor > 0 ? 'cash-outline' : 'gift-outline'}
                  label="Payment"
                  value={dueMinor > 0 ? `${formatMoney(dueMinor, booking.currency)} at venue` : 'Free entry'}
                  accent={!inactive}
                />
              </>
            ) : null}

            {!isTournament && !isEvent ? (
              <Info
                icon="card-outline"
                label="Payment"
                value={
                  inactive
                    ? 'Nothing due'
                    : `${formatMoney(booking.amountDueAtVenueMinor, booking.currency)} due at venue`
                }
                accent={!inactive}
              />
            ) : null}

            <Info icon="wallet-outline" label="Paid online" value={formatMoney(0, booking.currency)} />
          </View>
        </View>

        {isTournament && booking.members?.length ? (
          <View style={styles.block}>
            <SectionHeader title={booking.registrationType === 'TEAM' ? 'Team roster' : 'Participant'} />
            <View style={styles.card}>
              {booking.members.map((member: any, index: number) => (
                <View key={member.id} style={[styles.member, index === 0 && styles.memberFirst]}>
                  <Ionicons
                    name={member.isCaptain ? 'star' : 'person-outline'}
                    size={15}
                    color={member.isCaptain ? theme.colors.warning : theme.colors.textMuted}
                  />
                  <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                  {member.position ? <Text style={styles.memberPosition}>{member.position}</Text> : null}
                  {member.isCaptain ? <Badge label="Captain" tone="warning" /> : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {venue ? (
          <View style={styles.block}>
            <SectionHeader title="Venue" />
            <PressableScale
              style={styles.location}
              scaleTo={0.985}
              onPress={openMaps}
              accessibilityRole="button"
              accessibilityLabel={`Directions to ${venue.name}`}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.locationCopy}>
                <Text style={styles.locationTitle} numberOfLines={1}>{venue.name}</Text>
                <Text style={styles.locationText} numberOfLines={2}>
                  {[venue.address, venue.city].filter(Boolean).join(', ')}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />
            </PressableScale>
          </View>
        ) : null}

        {isTournament && (tournament?.reportingAt || tournament?.entryGate || tournament?.format) ? (
          <View style={styles.block}>
            <SectionHeader title="Entry information" />
            <View style={styles.card}>
              {tournament?.reportingAt ? (
                <EntryRow
                  first
                  icon="time-outline"
                  label="Reporting time"
                  value={formatTime(tournament.reportingAt, venue?.timeZone)}
                />
              ) : null}
              {tournament?.entryGate ? (
                <EntryRow
                  icon="enter-outline"
                  label="Entry gate"
                  value={tournament.entryGate}
                  first={!tournament?.reportingAt}
                />
              ) : null}
              <EntryRow icon="git-network-outline" label="Format" value={humanize(tournament?.format)} />
            </View>
          </View>
        ) : null}

        {event?.rules?.length ? (
          <PressableScale
            style={styles.rulesRow}
            scaleTo={0.985}
            onPress={() =>
              navigation.navigate(
                isTournament ? 'TournamentDetails' : 'EventDetails',
                isTournament ? { tournamentId: event.id } : { eventId: event.id },
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Rules and guidelines"
          >
            <View style={styles.rulesIcon}>
              <Ionicons name="document-text-outline" size={18} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.rulesLabel}>Rules & guidelines</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </PressableScale>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Timeline" />
          <View style={styles.card}>
            <TimelineItem
              complete
              title="Registration confirmed"
              detail={formatDateTime(booking.createdAt, venue?.timeZone)}
            />
            <TimelineItem
              complete
              title={payableAtVenue ? 'Payment due at venue' : 'Nothing to pay'}
              detail={
                payableAtVenue
                  ? formatMoney(dueMinor, booking.currency) + ' on arrival'
                  : 'No online payment was collected'
              }
            />
            <TimelineItem
              complete={!inactive && !upcoming}
              current={upcoming}
              last
              title={inactive ? 'Booking cancelled' : upcoming ? 'Event day' : 'Event completed'}
              detail={formatDateTime(booking.startsAt, venue?.timeZone)}
            />
          </View>
        </View>

        {canWithdraw ? (
          <Button
            title="Withdraw tournament entry"
            variant="danger"
            onPress={withdrawTournament}
            loading={working}
            style={styles.danger}
            fullWidth
          />
        ) : null}

        {!isTournament && !isEvent && booking.cancellable ? (
          <Button
            title="Cancel reservation"
            variant="danger"
            onPress={cancelVenue}
            loading={working}
            style={styles.danger}
            fullWidth
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
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
        <Text style={[styles.infoValue, accent && styles.infoValueAccent]}>{value}</Text>
      </View>
    </View>
  );
}

/** Compact label/value row used by the entry-information card. */
function EntryRow({ icon, label, value, first }: any) {
  return (
    <View style={[styles.entryRow, first && styles.entryRowFirst]}>
      <Ionicons name={icon} size={16} color={theme.colors.textMuted} />
      <Text style={styles.entryLabel}>{label}</Text>
      <Text style={styles.entryValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionCard({ icon, label, onPress, busy }: any) {
  return (
    <PressableScale
      style={styles.actionCard}
      scaleTo={0.95}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: Boolean(busy) }}
    >
      <View style={styles.actionIcon}>
        {busy ? (
          <ActivityIndicator size="small" color={theme.colors.textSecondary} />
        ) : (
          <Ionicons name={icon} size={20} color={theme.colors.textSecondary} />
        )}
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>{label}</Text>
    </PressableScale>
  );
}

function TimelineItem({ complete, current, title, detail, last }: any) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            complete && styles.timelineDotComplete,
            !complete && current && styles.timelineDotCurrent,
          ]}
        >
          {complete ? <Ionicons name="checkmark" size={12} color={theme.colors.onPrimary} /> : null}
          {!complete && current ? <View style={styles.timelineDotPip} /> : null}
        </View>
        {!last ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={[styles.timelineTitle, (complete || current) && styles.timelineTitleActive]}>{title}</Text>
        <Text style={styles.timelineDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function BookingSkeleton({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title="Booking" />
      <View style={styles.content}>
        <Skeleton height={420} radius={26} />
        <View style={{ height: theme.spacing.l }} />
        <Skeleton height={60} radius={theme.borderRadius.l} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.gutter, paddingBottom: theme.spacing.xxl },

  ticketWrap: { alignItems: 'center' },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    marginTop: theme.spacing.l,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusLabel: { ...theme.typography.bodySmall, color: theme.colors.text, fontFamily: theme.font.semibold, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textMuted },
  statusDotUpcoming: { backgroundColor: theme.colors.warning },
  statusDotVoid: { backgroundColor: theme.colors.error },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingTop: theme.spacing.m,
    marginTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  entryRowFirst: { paddingTop: 0, marginTop: 0, borderTopWidth: 0 },
  entryLabel: { ...theme.typography.bodySmall, flex: 1 },
  entryValue: { ...theme.typography.bodySmall, color: theme.colors.text, fontFamily: theme.font.bold, flexShrink: 1 },

  rulesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    minHeight: 64,
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rulesIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  rulesLabel: { ...theme.typography.title, fontSize: 14, flex: 1 },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s, marginTop: theme.spacing.m },
  actionCard: {
    width: '48%',
    flexGrow: 1,
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  actionLabel: { ...theme.typography.caption, color: theme.colors.text, fontFamily: theme.font.bold, textAlign: 'center' },

  block: { marginTop: theme.spacing.xl },
  card: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

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
  infoValueAccent: { color: theme.colors.primary },

  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingTop: theme.spacing.m,
    marginTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  memberFirst: { paddingTop: 0, marginTop: 0, borderTopWidth: 0 },
  memberName: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1 },
  memberPosition: { ...theme.typography.caption, fontSize: 11 },

  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  locationCopy: { flex: 1, minWidth: 0 },
  locationTitle: { ...theme.typography.title, fontSize: 14 },
  locationText: { ...theme.typography.caption, marginTop: 3 },

  timelineItem: { flexDirection: 'row', gap: theme.spacing.m },
  timelineRail: { alignItems: 'center', width: 24 },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  timelineDotComplete: { backgroundColor: theme.colors.primary },
  timelineDotCurrent: { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.primary },
  timelineDotPip: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  timelineLine: { flex: 1, width: 2, marginVertical: 4, backgroundColor: theme.colors.border },
  timelineCopy: { flex: 1, paddingBottom: theme.spacing.l },
  timelineTitle: { ...theme.typography.title, fontSize: 14, color: theme.colors.textMuted },
  timelineTitleActive: { color: theme.colors.text },
  timelineDetail: { ...theme.typography.caption, marginTop: 3 },

  danger: { marginTop: theme.spacing.l },
});
