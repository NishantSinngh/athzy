import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '../../components/AppImage';
import { PressableScale } from '../../components/PressableScale';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import { Button } from '../../components/Button';
import { GlassCard } from '../../components/GlassCard';
import { BackendAPI } from '../../api/backend';

export const RegistrationSummaryScreen = ({ navigation, route }: any) => {
  const { eventId, payload } = route.params || {};
  const [event, setEvent] = useState(route.params?.event || null);
  const [loading, setLoading] = useState(!route.params?.event);
  const [submitting, setSubmitting] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(false);

  useEffect(() => {
    if (!eventId || !payload) {
      showToast({ message: 'Registration details are missing.', tone: 'error' });
      navigation.goBack();
      return;
    }
    if (!event) BackendAPI.getEvent(eventId).then((result: any) => {
      if (result.event?.tournament) navigation.replace('TournamentDetails', { tournamentId: eventId });
      else setEvent(result.event);
    }).catch((error: any) => showToast({ message: error.message, tone: 'error' })).finally(() => setLoading(false));
    else if (event.tournament) navigation.replace('TournamentDetails', { tournamentId: eventId });
  }, [event, eventId, navigation, payload]);

  const confirm = async () => {
    if (!paymentAccepted || !eventId || !payload) return;
    try {
      setSubmitting(true);
      const result = await BackendAPI.registerForEvent(eventId, payload);
      navigation.replace('RegistrationSuccess', { registration: result.registration });
    } catch (error: any) {
      showToast({ message: error.message, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !event) return <View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  const fee = event.registrationFeeMinor || 0;
  const serviceFee = event.serviceFeeMinor || 0;
  const money = (minor: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: event.currency || 'USD' }).format(minor / 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><PressableScale style={styles.backButton} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#FFF" /></PressableScale><Text style={styles.headerTitle}>Review Registration</Text><View style={styles.backButton} /></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, styles.heroImage]}>
          <AppImage uri={event.imageUrl} style={StyleSheet.absoluteFillObject} />
          <LinearGradient colors={['transparent', 'rgba(10,10,10,0.25)', '#151515']} style={styles.heroGradient}>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <View style={styles.heroMeta}><Ionicons name="calendar" size={16} color={theme.colors.primary} /><Text style={styles.heroMetaText}>{new Date(event.startsAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text></View>
            <View style={styles.heroMeta}><Ionicons name="location" size={16} color={theme.colors.primary} /><Text style={styles.heroMetaText}>{event.venue?.name}</Text></View>
          </LinearGradient>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.cardHeading}><Ionicons name="person-circle" size={22} color={theme.colors.primary} /><Text style={styles.cardTitle}>Participant</Text><View style={styles.confirmedPill}><Text style={styles.confirmedText}>READY</Text></View></View>
          <SummaryRow label="Name" value={payload.playerName} />
          <SummaryRow label="Entry" value={payload.type === 'TEAM' ? payload.teamName : 'Individual player'} />
          <SummaryRow label="Experience" value={(payload.experienceLevel || '').toLowerCase()} />
          {payload.type === 'TEAM' && <SummaryRow label="Roster" value={`${payload.roster?.length || 0} players`} />}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Registration Details</Text>
          <SummaryRow label="Email" value={payload.playerEmail} />
          <SummaryRow label="Phone" value={payload.playerPhone} />
          <SummaryRow label="Category" value={event.skillLevel} />
           <SummaryRow label="Status" value="Confirmed when submitted" accent />
        </GlassCard>

        <GlassCard style={styles.card}>
           <Text style={styles.cardTitle}>Fee Summary</Text>
          <SummaryRow label="Registration fee" value={money(fee)} />
          <SummaryRow label="Service fee" value={money(serviceFee)} />
           <View style={styles.totalRow}><Text style={styles.totalLabel}>Amount Due Now</Text><Text style={styles.totalValue}>{money(0)}</Text></View>
           <Text style={styles.paymentDisclosure}>No online payment is collected in this registration flow.</Text>
        </GlassCard>

        <PressableScale style={styles.consent} onPress={() => setPaymentAccepted((value) => !value)}><View style={[styles.checkbox, paymentAccepted && styles.checkboxActive]}>{paymentAccepted && <Ionicons name="checkmark" size={17} color={theme.colors.background} />}</View><Text style={styles.consentText}>I have reviewed the event registration details.</Text></PressableScale>
        <View style={styles.secure}><Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} /><Text style={styles.secureText}>Your registration is protected by Athzy Fair Play.</Text></View>
        <Button title="Confirm & Register →" onPress={confirm} loading={submitting} disabled={!paymentAccepted} style={styles.confirmButton} />
      </ScrollView>
    </SafeAreaView>
  );
};

const SummaryRow = ({ label, value, accent }: any) => <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={[styles.rowValue, accent && styles.accent]} numberOfLines={2}>{value || '-'}</Text></View>;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }, header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }, backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface }, headerTitle: { ...theme.typography.h3, fontSize: 17 }, content: { padding: 24, paddingBottom: 42 },
  hero: { height: 190, marginBottom: 24 }, heroImage: { borderRadius: 24, overflow: 'hidden' }, heroGradient: { flex: 1, justifyContent: 'flex-end', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.borderSoft }, heroTitle: { ...theme.typography.h2, marginBottom: 12 }, heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 }, heroMetaText: { ...theme.typography.body, color: theme.colors.text, marginLeft: 8 },
  card: { borderRadius: 24, padding: 20, marginBottom: 24 }, cardHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, cardTitle: { ...theme.typography.h3, fontSize: 16, flex: 1, marginLeft: 8, marginBottom: 10 }, confirmedPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: theme.colors.primaryMuted }, confirmedText: { ...theme.typography.label, fontSize: 11, color: theme.colors.primary }, row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }, rowLabel: { ...theme.typography.body, fontSize: 13, flexShrink: 0 }, rowValue: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, textTransform: 'capitalize', flexShrink: 1, textAlign: 'right' }, accent: { color: theme.colors.primary }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 }, totalLabel: { ...theme.typography.h3 }, totalValue: { color: theme.colors.primary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24 },
  paymentDisclosure: { ...theme.typography.body, fontSize: 12, lineHeight: 16, marginTop: 12 }, consent: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 }, checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, checkboxActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, consentText: { ...theme.typography.body, flex: 1, fontSize: 12 }, secure: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 22 }, secureText: { ...theme.typography.body, fontSize: 11, marginLeft: 7 }, confirmButton: { borderRadius: 28 },
});
