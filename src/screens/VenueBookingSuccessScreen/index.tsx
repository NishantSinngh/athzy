import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '../../components/AppImage';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { SuccessHero, successStyles } from '../../components/SuccessHero';
import { theme } from '../../theme';
import { formatDateTime, formatMoney } from '../../utils/format';

export const VenueBookingSuccessScreen = ({ navigation, route }: any) => {
  const booking = route.params?.booking;
  const home = () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Reservation unavailable"
          message="We couldn't load the details for this reservation."
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
          title="Reservation confirmed"
          message={
            <>
              Your slot at <Text style={successStyles.bold}>{booking.venue.name}</Text> is reserved. Pay when you
              arrive.
            </>
          }
        />

        <View style={styles.card}>
          <View style={styles.codeRow}>
            <View>
              <Text style={styles.label}>BOOKING ID</Text>
              <Text style={styles.code}>#ATH-{booking.bookingCode.slice(-5).toUpperCase()}</Text>
            </View>
            <View style={styles.confirmedPill}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary} />
              <Text style={styles.confirmedText}>Confirmed</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Row
            icon="calendar-outline"
            label="DATE & TIME"
            value={formatDateTime(booking.startsAt, booking.venue.timeZone)}
          />
          <Row
            icon="cash-outline"
            label="PAYMENT"
            value={`${formatMoney(booking.amountDueAtVenueMinor, booking.currency)} due at venue`}
            accent
          />

          <View style={styles.venue}>
            <AppImage uri={booking.venue.imageUrl} fallback="venue" style={styles.venueImage} />
            <View style={styles.venueCopy}>
              <Text style={styles.venueName} numberOfLines={1}>{booking.venue.name}</Text>
              <Text style={styles.venueMeta} numberOfLines={1}>{booking.venue.city}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="View booking details"
            onPress={() => navigation.replace('BookingDetails', { kind: 'venue', bookingId: booking.id })}
            fullWidth
          />
          <Button title="Back to home" variant="ghost" onPress={home} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function Row({ icon, label, value, accent }: any) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={17} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { alignItems: 'center', padding: theme.spacing.gutter, paddingBottom: theme.spacing.xxl },

  card: {
    width: '100%',
    marginTop: theme.spacing.xl,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.m },
  label: { ...theme.typography.label, fontSize: 11 },
  code: { ...theme.typography.h2, fontSize: 22, marginTop: 5 },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.primaryMuted,
  },
  confirmedText: { ...theme.typography.caption, color: theme.colors.primary, fontFamily: theme.font.bold },

  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.l },

  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, marginBottom: theme.spacing.m },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  rowCopy: { flex: 1, minWidth: 0 },
  value: { ...theme.typography.bodySmall, color: theme.colors.text, fontFamily: theme.font.semibold, marginTop: 3 },
  valueAccent: { color: theme.colors.primary },

  venue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginTop: theme.spacing.s,
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surfaceRaised,
  },
  venueImage: { width: 44, height: 44, borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.surfaceLight },
  venueCopy: { flex: 1, minWidth: 0 },
  venueName: { ...theme.typography.title, fontSize: 14 },
  venueMeta: { ...theme.typography.caption, marginTop: 2 },

  actions: { width: '100%', gap: theme.spacing.s, marginTop: theme.spacing.xl },
});
