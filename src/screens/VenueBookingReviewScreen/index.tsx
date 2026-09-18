import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SectionHeader } from '../../components/SectionHeader';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import { formatDateTime, formatMoney, formatTime } from '../../utils/format';

export const VenueBookingReviewScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { venue, sport, slot, durationMinutes } = route.params || {};
  const [loading, setLoading] = useState(false);

  if (!venue || !sport || !slot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader navigation={navigation} title="Review" />
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Reservation unavailable"
          message="These reservation details are missing. Pick a slot again."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const confirm = async () => {
    setLoading(true);
    try {
      const result = await BackendAPI.bookVenue(venue.id, {
        startsAt: slot.startsAt,
        durationMinutes,
        sportId: sport.id,
      });
      navigation.replace('VenueBookingSuccess', { booking: result.booking });
    } catch (error: any) {
      showToast({
        message: error.message || 'That slot could not be reserved.',
        tone: 'error',
        action: { label: 'Pick another', onPress: () => navigation.goBack() },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title="Review reservation" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.venue}>
          <AppImage uri={venue.imageUrl} fallback="venue" style={styles.venueImage} />
          <View style={styles.venueCopy}>
            <Text style={styles.venueName} numberOfLines={2}>{venue.name}</Text>
            <View style={styles.venueMetaRow}>
              <Ionicons name="location" size={13} color={theme.colors.primary} />
              <Text style={styles.venueMeta} numberOfLines={2}>{venue.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Reservation details" />
          <View style={styles.card}>
            <View style={styles.grid}>
              <Detail label="SPORT" value={sport.name} />
              <Detail label="DATE" value={formatDateTime(slot.startsAt, venue.timeZone).split(',').slice(0, 2).join(',')} />
              <Detail
                label="TIME"
                value={`${formatTime(slot.startsAt, venue.timeZone)} – ${formatTime(slot.endsAt, venue.timeZone)}`}
              />
              <Detail label="DURATION" value={durationLabel(durationMinutes)} />
            </View>
            <Text style={styles.timezone}>Times shown in the venue timezone ({venue.timeZone}).</Text>
          </View>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Price summary" />
          <View style={styles.card}>
            <Price label="Venue price" value={formatMoney(slot.basePriceMinor, slot.currency)} />
            <Price label="Platform fee" value={formatMoney(slot.platformFeeMinor, slot.currency)} />
            <Price label="Taxes" value={formatMoney(slot.taxesMinor, slot.currency)} />
            <View style={styles.total}>
              <Text style={styles.totalLabel}>Pay at venue</Text>
              <Text style={styles.totalValue}>{formatMoney(slot.totalMinor, slot.currency)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle" size={19} color={theme.colors.primary} />
          <Text style={styles.noticeText}>
            Nothing is charged online. You can cancel this reservation any time before it starts.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.m) }]}>
        <View style={styles.dueBlock}>
          <Text style={styles.dueLabel}>DUE NOW</Text>
          <Text style={styles.dueValue}>{formatMoney(0, slot.currency)}</Text>
        </View>
        <Button title="Reserve slot" trailingIconName="arrow-forward" onPress={confirm} loading={loading} style={styles.confirm} />
      </View>
    </SafeAreaView>
  );
};

function durationLabel(value: number) {
  return value % 60 ? `${Math.floor(value / 60)}h ${value % 60}m` : `${value / 60} hour${value === 60 ? '' : 's'}`;
}

const Detail = ({ label, value }: any) => (
  <View style={styles.detail}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const Price = ({ label, value }: any) => (
  <View style={styles.price}>
    <Text style={styles.priceLabel}>{label}</Text>
    <Text style={styles.priceValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.gutter, paddingBottom: 130 },

  venue: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  venueImage: { width: 76, height: 76, borderRadius: theme.borderRadius.l, backgroundColor: theme.colors.surfaceLight },
  venueCopy: { flex: 1, minWidth: 0 },
  venueName: { ...theme.typography.h3 },
  venueMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  venueMeta: { ...theme.typography.bodySmall, flex: 1 },

  block: { marginTop: theme.spacing.xl },
  card: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  detail: { width: '50%', marginBottom: theme.spacing.l, paddingRight: theme.spacing.s },
  detailLabel: { ...theme.typography.label, fontSize: 11 },
  detailValue: { ...theme.typography.title, fontSize: 15, marginTop: 6 },
  timezone: { ...theme.typography.caption },

  price: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.m, paddingVertical: 10 },
  priceLabel: { ...theme.typography.bodySmall },
  priceValue: { ...theme.typography.bodySmall, color: theme.colors.text, fontFamily: theme.font.semibold },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginTop: theme.spacing.s,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalLabel: { ...theme.typography.h3, fontSize: 16 },
  totalValue: { ...theme.typography.numeric, fontSize: 21, color: theme.colors.primary },

  notice: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    marginTop: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.primaryMuted,
  },
  noticeText: { ...theme.typography.caption, flex: 1, lineHeight: 18 },

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
  dueBlock: { minWidth: 80 },
  dueLabel: { ...theme.typography.label, fontSize: 11 },
  dueValue: { ...theme.typography.numeric, fontSize: 20, marginTop: 2 },
  confirm: { flex: 1 },
});
