import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackendAPI } from '../../api/backend';
import { Button } from '../../components/Button';
import { AppImage } from '../../components/AppImage';
import { PressableScale } from '../../components/PressableScale';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import type { CreateTournamentEntryInput, Tournament } from '../../types/tournament';
import { formatDateTime, formatMoney } from '../../utils/format';


export function TournamentRegistrationSummaryScreen({ navigation, route }: any) {
  const tournamentId = route.params?.tournamentId;
  const payload = route.params?.payload as CreateTournamentEntryInput | undefined;
  const [tournament, setTournament] = useState<Tournament | null>(route.params?.tournament || null);
  const [loading, setLoading] = useState(!route.params?.tournament);
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    if (!tournamentId || !payload) {
      showToast({ message: 'Registration details are missing.', tone: 'error' });
      navigation.goBack();
      return;
    }
    if (!tournament) BackendAPI.getTournament(tournamentId).then((result) => setTournament(result.tournament)).catch((error) => showToast({ message: error.message, tone: 'error' })).finally(() => setLoading(false));
  }, [navigation, payload, tournament, tournamentId]);

  const submit = async () => {
    if (!reviewed || !tournament || !payload) return;
    try {
      setSubmitting(true);
      const result = await BackendAPI.createTournamentEntry(tournament.id, payload);
      navigation.reset({ index: 1, routes: [{ name: 'MainTabs' }, { name: 'TournamentRegistrationSuccess', params: { entry: result.entry, tournament } }] });
    } catch (error: any) {
      showToast({ message: error.message, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !tournament || !payload) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  const venueText = tournament.venue ? [tournament.venue.name, tournament.venue.city].filter(Boolean).join(', ') : 'Venue to be announced';
  const isFree = tournament.paymentPolicy === 'FREE';

  return <SafeAreaView style={styles.container} edges={['top']}>
    <View style={styles.header}><PressableScale style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#FFF" /></PressableScale><Text style={styles.headerTitle}>Registration Summary</Text><View style={styles.back} /></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, styles.heroImage]}><AppImage uri={tournament.imageUrl} fallback="tournament" style={StyleSheet.absoluteFillObject} /><View style={styles.heroShade}><Text style={styles.heroTitle}>{tournament.title}</Text><Text style={styles.heroMeta}>{formatDateTime(tournament.startsAt, tournament.venue?.timeZone || undefined)}</Text><Text style={styles.heroMeta}>{venueText}</Text></View></View>

      <View style={styles.card}>
        <View style={styles.cardHeader}><Ionicons name={payload.type === 'TEAM' ? 'people' : 'person'} size={21} color={theme.colors.primary} /><Text style={styles.cardTitle}>Participant Details</Text><PressableScale onPress={() => navigation.goBack()}><Text style={styles.edit}>EDIT</Text></PressableScale></View>
        <Row label="Contact" value={payload.contactName} />
        <Row label="Entry type" value={payload.type === 'TEAM' ? 'Team' : 'Individual'} />
        {payload.type === 'TEAM' ? <><Row label="Team" value={payload.teamName} /><Row label="Roster" value={`${payload.members.length} members`} /></> : <Row label="Position" value={payload.position || 'Not specified'} />}
        <Row label="Email" value={payload.contactEmail} />
        <Row label="Phone" value={payload.contactPhone} />
      </View>

      {payload.type === 'TEAM' ? <View style={styles.card}><Text style={styles.plainTitle}>Confirmed Roster</Text>{payload.members.map((member, index) => <View key={`${member.name}-${index}`} style={styles.member}><View style={styles.memberIcon}><Ionicons name={member.isCaptain ? 'star' : 'person-outline'} size={16} color={member.isCaptain ? theme.colors.warning : theme.colors.textMuted} /></View><View style={styles.memberCopy}><Text style={styles.memberName}>{member.name}</Text><Text style={styles.memberMeta}>{[member.isCaptain ? 'Captain' : null, member.position].filter(Boolean).join(' · ') || 'Roster member'}</Text></View></View>)}</View> : null}

      <View style={styles.card}>
        <Text style={styles.plainTitle}>Tournament Facts</Text>
        <Row label="Format" value={tournament.format.toLowerCase().replaceAll('_', ' ')} />
        <Row label="Reporting" value={tournament.reportingAt ? formatDateTime(tournament.reportingAt, tournament.venue?.timeZone || undefined) : 'Not specified'} />
        <Row label="Entry gate" value={tournament.entryGate || 'Not specified'} />
        <Row label="Venue" value={venueText} />
      </View>

      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}><View><Text style={styles.paymentEyebrow}>PAYMENT POLICY</Text><Text style={styles.paymentPolicy}>{isFree ? 'FREE' : 'PAY AT VENUE'}</Text></View><Ionicons name={isFree ? 'gift' : 'cash'} size={25} color={theme.colors.primary} /></View>
        <Row label="Registration fee" value={formatMoney(tournament.registrationFeeMinor, tournament.currency)} />
        <Row label="Service fee" value={formatMoney(tournament.serviceFeeMinor, tournament.currency)} />
        <View style={styles.total}><Text style={styles.totalLabel}>{isFree ? 'Total' : 'Due at venue'}</Text><Text style={styles.totalValue}>{formatMoney(tournament.totalFeeMinor, tournament.currency)}</Text></View>
        <View style={styles.dueNow}><Text style={styles.dueNowLabel}>AMOUNT DUE NOW</Text><Text style={styles.dueNowValue}>{formatMoney(0, tournament.currency)}</Text></View>
        <Text style={styles.paymentNote}>{isFree ? 'No payment is required for this tournament entry.' : 'No online payment is collected. Pay the stated amount directly at the venue.'}</Text>
      </View>

      <PressableScale style={styles.review} onPress={() => setReviewed((current) => !current)}><View style={[styles.checkbox, reviewed && styles.checked]}>{reviewed ? <Ionicons name="checkmark" size={17} color={theme.colors.background} /> : null}</View><Text style={styles.reviewText}>I have reviewed the participant, roster, tournament, and fee details above.</Text></PressableScale>
      <Button title="Confirm Tournament Entry" onPress={submit} loading={submitting} disabled={!reviewed} style={styles.submit} />
    </ScrollView>
  </SafeAreaView>;
}

function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value || '-'}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }, header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }, back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface }, headerTitle: { ...theme.typography.h3, fontSize: 16 }, content: { padding: 22, paddingBottom: 44 }, hero: { height: 210, justifyContent: 'flex-end', marginBottom: 18 }, heroImage: { borderRadius: 24, overflow: 'hidden' }, heroShade: { padding: 20, paddingTop: 60, borderRadius: 24, backgroundColor: 'rgba(0,0,0,.55)', borderWidth: 1, borderColor: theme.colors.borderSoft }, heroTitle: { ...theme.typography.h2, fontSize: 21, marginBottom: 7 }, heroMeta: { color: '#E5E7EB', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, marginTop: 4 }, card: { padding: 18, borderRadius: 22, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16 }, cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 }, cardTitle: { flex: 1, color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, marginLeft: 9 }, plainTitle: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, marginBottom: 8 }, edit: { color: theme.colors.primary, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }, row: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, rowLabel: { color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, flexShrink: 0 }, rowValue: { flexShrink: 1, color: theme.colors.text, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16, textAlign: 'right', textTransform: 'capitalize' }, member: { flexDirection: 'row', alignItems: 'center', minHeight: 54, borderTopWidth: 1, borderTopColor: theme.colors.border }, memberIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceLight }, memberCopy: { flex: 1, marginLeft: 11 }, memberName: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 }, memberMeta: { color: theme.colors.textMuted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, marginTop: 3 }, paymentCard: { padding: 18, borderRadius: 22, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: 'rgba(69,240,106,.25)', marginBottom: 20 }, paymentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 }, paymentEyebrow: { ...theme.typography.label, fontSize: 11 }, paymentPolicy: { color: theme.colors.primary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, marginTop: 5 }, total: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 17 }, totalLabel: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }, totalValue: { color: theme.colors.primary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 21 }, dueNow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14, backgroundColor: theme.colors.primaryMuted, marginTop: 16 }, dueNowLabel: { color: theme.colors.primary, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }, dueNowValue: { color: theme.colors.primary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 15 }, paymentNote: { ...theme.typography.body, fontSize: 12, lineHeight: 16, marginTop: 12 }, review: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 5 }, checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, checked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, reviewText: { flex: 1, color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 18 }, submit: { borderRadius: 28, marginTop: 20 },
});
