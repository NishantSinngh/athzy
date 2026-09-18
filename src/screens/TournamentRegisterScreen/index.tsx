import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackendAPI } from '../../api/backend';
import { isValidEmail, isValidPhone } from '../../utils/format';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AppImage } from '../../components/AppImage';
import { PressableScale } from '../../components/PressableScale';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import type { CreateTournamentEntryInput, Tournament, TournamentEntryType } from '../../types/tournament';
import { formatDateTime } from '../../utils/format';

type MemberForm = { key: string; name: string; email: string; phone: string; position: string; isCaptain: boolean };
const newMember = (captain = false): MemberForm => ({ key: `${Date.now()}-${Math.random()}`, name: '', email: '', phone: '', position: '', isCaptain: captain });

export function TournamentRegisterScreen({ navigation, route }: any) {
  const tournamentId = route.params?.tournamentId;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<TournamentEntryType>('INDIVIDUAL');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [position, setPosition] = useState('');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<MemberForm[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false);
      showToast({ message: 'No tournament was selected.', tone: 'error' });
      navigation.goBack();
      return;
    }
    let active = true;
    Promise.all([BackendAPI.getTournament(tournamentId), BackendAPI.getMe()])
      .then(([tournamentResult, meResult]) => {
        if (!active) return;
        const loaded = tournamentResult.tournament;
        if (loaded.viewerEntry || !loaded.isRegistrationOpen || loaded.isFull) {
          navigation.replace('TournamentDetails', { tournamentId });
          return;
        }
        const defaultType: TournamentEntryType = loaded.registrationMode === 'TEAM' ? 'TEAM' : 'INDIVIDUAL';
        const name = meResult.profile?.fullName || '';
        const email = meResult.profile?.email || '';
        setTournament(loaded);
        setType(defaultType);
        setContactName(name);
        setContactEmail(email);
        setMembers([{ ...newMember(true), name, email }]);
      })
      .catch((error) => { showToast({ message: error.message, tone: 'error' }); navigation.goBack(); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigation, tournamentId]);

  const chooseType = (nextType: TournamentEntryType) => {
    setType(nextType);
    if (nextType === 'TEAM' && !members.length) setMembers([{ ...newMember(true), name: contactName, email: contactEmail, phone: contactPhone }]);
  };
  const updateMember = (index: number, field: keyof Omit<MemberForm, 'key' | 'isCaptain'>, value: string) => setMembers((current) => current.map((member, memberIndex) => memberIndex === index ? { ...member, [field]: value } : member));
  const setCaptain = (index: number) => setMembers((current) => current.map((member, memberIndex) => ({ ...member, isCaptain: memberIndex === index })));
  const removeMember = (index: number) => setMembers((current) => {
    const next = current.filter((_, memberIndex) => memberIndex !== index);
    if (next.length && !next.some((member) => member.isCaptain)) next[0] = { ...next[0], isCaptain: true };
    return next;
  });

  const review = () => {
    if (!tournament) return;
    if (!contactName.trim()) {
      showToast({ message: 'Enter your name.', tone: 'error' });
      return;
    }
    if (!isValidEmail(contactEmail)) {
      showToast({ message: 'Enter a valid email address.', tone: 'error' });
      return;
    }
    if (!isValidPhone(contactPhone)) {
      showToast({ message: 'Enter a phone number of at least 7 digits.', tone: 'error' });
      return;
    }
    if (!acceptedTerms) {
      showToast({ message: 'Review and accept the tournament rules and participation terms.', tone: 'error' });
      return;
    }
    let payload: CreateTournamentEntryInput;
    if (type === 'TEAM') {
      if (!teamName.trim()) {
        showToast({ message: 'Enter the team name that should appear in the tournament.', tone: 'error' });
        return;
      }
      if (members.length < tournament.minRosterSize || members.length > tournament.maxRosterSize) {
        showToast({ message: `Add between ${tournament.minRosterSize} and ${tournament.maxRosterSize} roster members before review.`, tone: 'error' });
        return;
      }
      if (members.some((member) => !member.name.trim())) {
        showToast({ message: 'Every roster slot needs a player name.', tone: 'error' });
        return;
      }
      if (members.filter((member) => member.isCaptain).length !== 1) {
        showToast({ message: 'A team entry must have exactly one captain.', tone: 'error' });
        return;
      }
      const badEmail = members.find((member) => member.email.trim() && !isValidEmail(member.email));
      if (badEmail) {
        showToast({ message: `${badEmail.name.trim() || 'A player'} has an invalid email address.`, tone: 'error' });
        return;
      }
      const emails = members.map((member) => member.email.trim().toLowerCase()).filter(Boolean);
      if (new Set(emails).size !== emails.length) {
        showToast({ message: 'Each player email can only appear once in the roster.', tone: 'error' });
        return;
      }
      payload = {
        type: 'TEAM',
        teamName: teamName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        acceptedTerms: true,
        members: members.map((member) => ({
          name: member.name.trim(),
          ...(member.email.trim() ? { email: member.email.trim() } : {}),
          ...(member.phone.trim() ? { phone: member.phone.trim() } : {}),
          ...(member.position.trim() ? { position: member.position.trim() } : {}),
          isCaptain: member.isCaptain,
        })),
      };
    } else {
      payload = {
        type: 'INDIVIDUAL',
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        acceptedTerms: true,
        ...(position.trim() ? { position: position.trim() } : {}),
      };
    }
    navigation.navigate('TournamentRegistrationSummary', { tournamentId: tournament.id, tournament, payload });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>Preparing registration...</Text></View>;
  if (!tournament) return <View style={styles.center}><Text style={styles.emptyText}>Tournament registration is unavailable.</Text></View>;

  const allowsIndividual = tournament.registrationMode !== 'TEAM';
  const allowsTeam = tournament.registrationMode !== 'INDIVIDUAL';
  const canAdd = members.length < tournament.maxRosterSize;

  return <SafeAreaView style={styles.container} edges={['top']}>
    <View style={styles.header}><PressableScale style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#FFF" /></PressableScale><Text style={styles.headerTitle}>Register for Tournament</Text><View style={styles.back} /></View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.tournamentCard}><AppImage uri={tournament.imageUrl} fallback="tournament" style={styles.image} /><View style={styles.tournamentCopy}><Text style={styles.tournamentTitle} numberOfLines={2}>{tournament.title}</Text><Text style={styles.meta}>{formatDateTime(tournament.startsAt, tournament.venue?.timeZone || undefined)}</Text><Text style={styles.meta}>{tournament.venue?.name || 'Venue to be announced'}</Text></View></View>

        {allowsIndividual && allowsTeam ? <><Text style={styles.label}>PARTICIPATION TYPE</Text><View style={styles.typeRow}><TypeCard active={type === 'INDIVIDUAL'} icon="person" title="Individual" subtitle="Enter yourself" onPress={() => chooseType('INDIVIDUAL')} /><TypeCard active={type === 'TEAM'} icon="people" title="As a Team" subtitle="Set up roster" onPress={() => chooseType('TEAM')} /></View></> : <View style={styles.modeNotice}><Ionicons name={allowsTeam ? 'people-outline' : 'person-outline'} size={21} color={theme.colors.primary} /><View style={styles.noticeCopy}><Text style={styles.noticeTitle}>{allowsTeam ? 'Team registration' : 'Individual registration'}</Text><Text style={styles.noticeText}>{allowsTeam ? `Create the confirmed roster directly here. This is not an invitation flow.` : 'This tournament accepts individual participants.'}</Text></View></View>}

        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.sectionHelp}>The organizer can use these details for tournament-day coordination.</Text>
        <Input label="FULL NAME" placeholder="Your full name" icon="person-outline" value={contactName} onChangeText={setContactName} />
        <Input label="EMAIL ADDRESS" placeholder="you@example.com" icon="mail-outline" value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label="PHONE NUMBER" placeholder="+91 98765 43210" icon="call-outline" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

        {type === 'INDIVIDUAL' ? <><Text style={styles.sectionTitle}>Playing Details</Text><Text style={styles.sectionHelp}>Position is optional and helps the organizer understand where you prefer to play.</Text><Input label="PREFERRED POSITION (OPTIONAL)" placeholder="Striker, guard, all-rounder..." icon="fitness-outline" value={position} onChangeText={setPosition} /></> : <>
          <Text style={styles.sectionTitle}>Team Setup</Text>
          <Text style={styles.sectionHelp}>Add the players who are joining now. No invites are sent or persisted from this screen.</Text>
          <Input label="TEAM NAME" placeholder="Your team name" icon="shield-outline" value={teamName} onChangeText={setTeamName} />
          <View style={styles.rosterHeading}><View><Text style={styles.rosterTitle}>Roster</Text><Text style={styles.rosterCount}>{members.length}/{tournament.maxRosterSize} members · minimum {tournament.minRosterSize}</Text></View>{canAdd ? <PressableScale style={styles.add} onPress={() => setMembers((current) => [...current, newMember(false)])}><Ionicons name="add" size={22} color={theme.colors.background} /></PressableScale> : null}</View>
          {members.map((member, index) => <View key={member.key} style={[styles.memberCard, member.isCaptain && styles.captainCard]}>
            <View style={styles.memberHeader}><View style={[styles.memberNumber, member.isCaptain && styles.captainNumber]}><Text style={[styles.memberNumberText, member.isCaptain && styles.captainNumberText]}>{index + 1}</Text></View><Text style={styles.memberTitle}>Roster member {index + 1}</Text><PressableScale onPress={() => setCaptain(index)} style={[styles.captainChoice, member.isCaptain && styles.captainChoiceActive]}><Ionicons name={member.isCaptain ? 'star' : 'star-outline'} size={14} color={member.isCaptain ? theme.colors.background : theme.colors.textSecondary} /><Text style={[styles.captainChoiceText, member.isCaptain && styles.captainChoiceTextActive]}>{member.isCaptain ? 'CAPTAIN' : 'MAKE CAPTAIN'}</Text></PressableScale></View>
            <Input label="PLAYER NAME" placeholder="Full name" icon="person-outline" value={member.name} onChangeText={(value) => updateMember(index, 'name', value)} />
            <Input label="EMAIL (OPTIONAL)" placeholder="player@example.com" icon="mail-outline" value={member.email} onChangeText={(value) => updateMember(index, 'email', value)} autoCapitalize="none" keyboardType="email-address" />
            <Input label="PHONE (OPTIONAL)" placeholder="Phone number" icon="call-outline" value={member.phone} onChangeText={(value) => updateMember(index, 'phone', value)} keyboardType="phone-pad" />
            <Input label="POSITION (OPTIONAL)" placeholder="Playing position" icon="fitness-outline" value={member.position} onChangeText={(value) => updateMember(index, 'position', value)} />
            {members.length > 1 ? <PressableScale onPress={() => removeMember(index)} style={styles.remove}><Ionicons name="trash-outline" size={15} color={theme.colors.error} /><Text style={styles.removeText}>Remove member</Text></PressableScale> : null}
          </View>)}
          {canAdd ? <PressableScale style={styles.addSlot} onPress={() => setMembers((current) => [...current, newMember(false)])}><Ionicons name="add-circle-outline" size={22} color={theme.colors.textMuted} /><Text style={styles.addSlotText}>Add roster member</Text></PressableScale> : null}
        </>}

        <PressableScale style={styles.terms} onPress={() => setAcceptedTerms((current) => !current)}><View style={[styles.checkbox, acceptedTerms && styles.checked]}>{acceptedTerms ? <Ionicons name="checkmark" size={17} color={theme.colors.background} /> : null}</View><Text style={styles.termsText}>I accept the tournament rules, participation terms, and organizer instructions.</Text></PressableScale>
      </ScrollView>
      <View style={styles.footer}><Button title="Review Registration" onPress={review} disabled={!acceptedTerms} style={styles.review} /></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function TypeCard({ active, icon, title, subtitle, onPress }: any) { return <PressableScale style={[styles.typeCard, active && styles.typeCardActive]} onPress={onPress}><View style={[styles.typeIcon, active && styles.typeIconActive]}><Ionicons name={icon} size={24} color={active ? theme.colors.primary : theme.colors.textSecondary} /></View><Text style={styles.typeTitle}>{title}</Text><Text style={styles.typeSubtitle}>{subtitle}</Text>{active ? <View style={styles.typeCheck}><Ionicons name="checkmark" size={12} color={theme.colors.background} /></View> : null}</PressableScale>; }

const styles = StyleSheet.create({
  flex: { flex: 1 }, container: { flex: 1, backgroundColor: theme.colors.background }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: theme.colors.background }, loadingText: { ...theme.typography.body, marginTop: 12 }, emptyText: { ...theme.typography.body, textAlign: 'center' }, header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }, back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface }, headerTitle: { ...theme.typography.h3, fontSize: 16 }, content: { padding: 22, paddingBottom: 124 },
  tournamentCard: { flexDirection: 'row', padding: 14, borderRadius: 22, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 28 }, image: { width: 78, height: 78, borderRadius: 17 }, tournamentCopy: { flex: 1, justifyContent: 'center', marginLeft: 14 }, tournamentTitle: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, lineHeight: 20 }, meta: { color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, marginTop: 5 }, label: { ...theme.typography.label, marginBottom: 12 }, typeRow: { flexDirection: 'row', gap: 12, marginBottom: 28 }, typeCard: { flex: 1, minHeight: 122, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, typeCardActive: { borderWidth: 2, borderColor: theme.colors.primary }, typeIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.04)', marginBottom: 8 }, typeIconActive: { backgroundColor: theme.colors.primaryMuted }, typeTitle: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }, typeSubtitle: { color: theme.colors.textMuted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, marginTop: 3 }, typeCheck: { position: 'absolute', top: 11, right: 11, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
  modeNotice: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: theme.colors.primaryMuted, borderWidth: 1, borderColor: 'rgba(69,240,106,.25)', marginBottom: 26 }, noticeCopy: { flex: 1, marginLeft: 12 }, noticeTitle: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }, noticeText: { ...theme.typography.body, fontSize: 11, lineHeight: 17, marginTop: 3 }, sectionTitle: { ...theme.typography.h3, fontSize: 17, marginTop: 8, marginBottom: 4 }, sectionHelp: { ...theme.typography.body, fontSize: 11, lineHeight: 17, marginBottom: 16 }, rosterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 14 }, rosterTitle: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }, rosterCount: { color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, marginTop: 4 }, add: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary }, memberCard: { padding: 16, borderRadius: 22, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 14 }, captainCard: { borderColor: 'rgba(69,240,106,.34)' }, memberHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, memberNumber: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceLight }, captainNumber: { backgroundColor: theme.colors.primaryMuted }, memberNumberText: { color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 }, captainNumberText: { color: theme.colors.primary }, memberTitle: { flex: 1, color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, marginLeft: 10 }, captainChoice: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 11, borderWidth: 1, borderColor: theme.colors.border }, captainChoiceActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, captainChoiceText: { color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 }, captainChoiceTextActive: { color: theme.colors.background }, remove: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, paddingTop: 4 }, removeText: { color: theme.colors.error, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 }, addSlot: { height: 70, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 24 }, addSlotText: { color: theme.colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 }, terms: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20 }, checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, checked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, termsText: { flex: 1, color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 18 }, footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border }, review: { borderRadius: 28 },
});
