import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SectionHeader } from '../../components/SectionHeader';
import { Skeleton } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import { formatDayBadge, formatMoney, formatTime, isValidEmail, isValidPhone } from '../../utils/format';

/** Mirrors MAX_TICKETS_PER_BOOKING on the server. */
const MAX_TICKETS = 10;

/**
 * Ticket booking for an event.
 *
 * Events are attended, not competed in, so this is a ticket purchase — pick a
 * quantity, confirm who is coming, see the total, book. Squad details, rosters
 * and skill levels belong to the tournament entry flow, which is a different
 * screen for a genuinely different thing.
 */
export function EventTicketScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const eventId = route.params?.eventId;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    if (!eventId) {
      showToast({ message: 'No event was selected.', tone: 'error' });
      navigation.goBack();
      return;
    }
    Promise.all([BackendAPI.getEvent(eventId), BackendAPI.getMe()])
      .then(([eventResult, me]) => {
        const loaded = eventResult.event;
        if (loaded?.tournament) {
          navigation.replace('TournamentDetails', { tournamentId: eventId });
          return;
        }
        // Team events are a squad entry, not a ticket sale.
        if (loaded?.registrationType === 'TEAM') {
          navigation.replace('EventRegister', { eventId });
          return;
        }
        if (loaded?.viewerRegistration || loaded?.isFull || new Date(loaded.startsAt).getTime() <= Date.now()) {
          navigation.replace('EventDetails', { eventId });
          return;
        }
        setEvent(loaded);
        setName(me.profile.fullName || '');
        setEmail(me.profile.email || '');
      })
      .catch((error) => {
        showToast({ message: error.message, tone: 'error' });
        navigation.goBack();
      })
      .finally(() => setLoading(false));
  }, [eventId, navigation]);

  const unitMinor = (event?.registrationFeeMinor ?? 0) + (event?.serviceFeeMinor ?? 0);
  const currency = event?.currency ?? 'INR';
  const isFree = unitMinor === 0;

  /** Never offer more tickets than the event has seats for. */
  const maxAvailable = useMemo(() => {
    const remaining = event?.spotsRemaining;
    if (typeof remaining !== 'number') return MAX_TICKETS;
    return Math.max(1, Math.min(MAX_TICKETS, remaining));
  }, [event]);

  const adjust = (delta: number) => {
    setQuantity((current) => {
      const next = Math.min(maxAvailable, Math.max(1, current + delta));
      if (next !== current) triggerHaptic('selection');
      return next;
    });
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Enter the name for the booking.';
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (!isValidPhone(phone)) next.phone = 'Enter a phone number of at least 7 digits.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const book = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await BackendAPI.registerForEvent(eventId, {
        type: 'INDIVIDUAL',
        quantity,
        playerName: name.trim(),
        playerEmail: email.trim(),
        playerPhone: phone.trim(),
        acceptedTerms,
      });
      navigation.replace('RegistrationSuccess', { registration: result.registration });
    } catch (error: any) {
      showToast({ message: error.message || 'That booking could not be completed.', tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader navigation={navigation} title="Book tickets" />
        <View style={styles.content}>
          <Skeleton height={96} radius={theme.borderRadius.xl} />
          <View style={{ height: theme.spacing.l }} />
          <Skeleton height={120} radius={theme.borderRadius.xl} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader navigation={navigation} title="Book tickets" />
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="Event unavailable"
          message="This event can no longer be booked."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const subtotalMinor = (event.registrationFeeMinor ?? 0) * quantity;
  const feesMinor = (event.serviceFeeMinor ?? 0) * quantity;
  const totalMinor = unitMinor * quantity;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title="Book tickets" bordered />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.event}>
            <AppImage uri={event.imageUrl} style={styles.eventImage} />
            <View style={styles.eventCopy}>
              <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
              <Text style={styles.eventMeta} numberOfLines={1}>
                {formatDayBadge(event.startsAt, event.venue?.timeZone)} · {formatTime(event.startsAt, event.venue?.timeZone)}
              </Text>
              <Text style={styles.eventMeta} numberOfLines={1}>
                {event.venue?.name || 'Venue to be announced'}
              </Text>
            </View>
          </View>

          <View style={styles.block}>
            <SectionHeader
              title="Tickets"
              subtitle={
                typeof event.spotsRemaining === 'number'
                  ? `${event.spotsRemaining} left`
                  : undefined
              }
            />
            <View style={styles.card}>
              <View style={styles.stepperRow}>
                <View style={styles.stepperCopy}>
                  <Text style={styles.stepperLabel}>{isFree ? 'Free entry' : 'Per ticket'}</Text>
                  <Text style={styles.stepperPrice}>
                    {isFree ? 'No charge' : formatMoney(unitMinor, currency)}
                  </Text>
                </View>

                <View style={styles.stepper}>
                  <PressableScale
                    style={[styles.stepButton, quantity <= 1 && styles.stepButtonOff]}
                    onPress={() => adjust(-1)}
                    disabled={quantity <= 1}
                    haptic="none"
                    accessibilityRole="button"
                    accessibilityLabel="Remove a ticket"
                  >
                    <Ionicons name="remove" size={20} color={quantity <= 1 ? theme.colors.textFaint : theme.colors.text} />
                  </PressableScale>

                  <Text style={styles.stepCount} accessibilityLabel={`${quantity} tickets`}>{quantity}</Text>

                  <PressableScale
                    style={[styles.stepButton, quantity >= maxAvailable && styles.stepButtonOff]}
                    onPress={() => adjust(1)}
                    disabled={quantity >= maxAvailable}
                    haptic="none"
                    accessibilityRole="button"
                    accessibilityLabel="Add a ticket"
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={quantity >= maxAvailable ? theme.colors.textFaint : theme.colors.text}
                    />
                  </PressableScale>
                </View>
              </View>

              {quantity >= maxAvailable ? (
                <Animated.Text entering={FadeIn.duration(theme.motion.duration.fast)} style={styles.stepperNote}>
                  {maxAvailable === MAX_TICKETS
                    ? `Up to ${MAX_TICKETS} tickets per booking.`
                    : 'That is every remaining ticket.'}
                </Animated.Text>
              ) : null}
            </View>
          </View>

          <View style={styles.block}>
            <SectionHeader title="Booking details" subtitle="Where we send your ticket" />
            <Input
              label="Full name"
              placeholder="Alex Morgan"
              icon="person-outline"
              value={name}
              onChangeText={(value: string) => { setName(value); setErrors((e) => ({ ...e, name: undefined })); }}
              error={errors.name}
            />
            <Input
              label="Email"
              placeholder="alex@athzy.com"
              icon="mail-outline"
              value={email}
              onChangeText={(value: string) => { setEmail(value); setErrors((e) => ({ ...e, email: undefined })); }}
              error={errors.email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Input
              label="Phone"
              placeholder="+91 98765 43210"
              icon="call-outline"
              value={phone}
              onChangeText={(value: string) => { setPhone(value); setErrors((e) => ({ ...e, phone: undefined })); }}
              error={errors.phone}
              keyboardType="phone-pad"
            />
          </View>

          {!isFree ? (
            <View style={styles.block}>
              <SectionHeader title="Price summary" />
              <View style={styles.card}>
                <PriceLine
                  label={`Entry × ${quantity}`}
                  value={formatMoney(subtotalMinor, currency)}
                />
                {feesMinor > 0 ? <PriceLine label="Service fee" value={formatMoney(feesMinor, currency)} /> : null}
                <View style={styles.total}>
                  <Text style={styles.totalLabel}>Pay at venue</Text>
                  <Text style={styles.totalValue}>{formatMoney(totalMinor, currency)}</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.notice}>
            <Ionicons name="information-circle" size={19} color={theme.colors.primary} />
            <Text style={styles.noticeText}>
              {isFree
                ? 'Free entry. Your ticket and the event chat unlock as soon as you book.'
                : 'Nothing is charged online — pay at the venue. Your ticket and the event chat unlock as soon as you book.'}
            </Text>
          </View>

          <PressableScale
            style={styles.terms}
            onPress={() => setAcceptedTerms((current) => !current)}
            haptic="selection"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            accessibilityLabel="Agree to the event rules and booking terms"
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms ? <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} /> : null}
            </View>
            <Text style={styles.termsText}>I agree to the event rules and booking terms.</Text>
          </PressableScale>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.m) }]}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalBarLabel}>{isFree ? 'ENTRY' : 'TOTAL'}</Text>
            <Text style={styles.totalBarValue}>{isFree ? 'Free' : formatMoney(totalMinor, currency)}</Text>
          </View>
          <Button
            title={quantity === 1 ? 'Book ticket' : `Book ${quantity} tickets`}
            trailingIconName="arrow-forward"
            onPress={book}
            loading={submitting}
            disabled={!acceptedTerms}
            style={styles.bookButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceLine}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.gutter, paddingTop: theme.spacing.m },

  event: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  eventImage: { width: 72, height: 72, borderRadius: theme.borderRadius.l, backgroundColor: theme.colors.surfaceLight },
  eventCopy: { flex: 1, minWidth: 0, gap: 3 },
  eventTitle: { ...theme.typography.title, fontSize: 16 },
  eventMeta: { ...theme.typography.caption },

  block: { marginTop: theme.spacing.xl },
  card: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.m },
  stepperCopy: { flexShrink: 1 },
  stepperLabel: { ...theme.typography.label, fontSize: 11 },
  stepperPrice: { ...theme.typography.title, fontSize: 17, marginTop: 3 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  stepButton: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepButtonOff: { opacity: 0.45 },
  stepCount: { ...theme.typography.numeric, fontSize: 20, minWidth: 32, textAlign: 'center' },
  stepperNote: { ...theme.typography.caption, marginTop: theme.spacing.m },

  priceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.m, paddingVertical: 9 },
  priceLabel: { ...theme.typography.bodySmall, flexShrink: 1 },
  priceValue: { ...theme.typography.bodySmall, color: theme.colors.text, fontFamily: theme.font.semibold },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    marginTop: theme.spacing.s,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalLabel: { ...theme.typography.title, fontSize: 15 },
  totalValue: { ...theme.typography.numeric, fontSize: 20, color: theme.colors.primary },

  notice: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginTop: theme.spacing.l,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.primaryMuted,
  },
  noticeText: { ...theme.typography.caption, flex: 1, lineHeight: 18 },

  terms: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    minHeight: theme.hitTarget,
    marginTop: theme.spacing.m,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  checkboxChecked: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  termsText: { ...theme.typography.bodySmall, flex: 1 },

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
  totalBlock: { minWidth: 80 },
  totalBarLabel: { ...theme.typography.label, fontSize: 11 },
  totalBarValue: { ...theme.typography.numeric, fontSize: 20, color: theme.colors.primary, marginTop: 2 },
  bookButton: { flex: 1 },
});
