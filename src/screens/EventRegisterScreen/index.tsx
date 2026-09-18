import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '../../components/AppImage';
import { PressableScale } from '../../components/PressableScale';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { BackendAPI } from '../../api/backend';
import { isValidEmail, isValidPhone } from '../../utils/format';

type Experience = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type RosterMember = { name: string; email: string };
const experienceCopy: Record<Experience, string> = {
  BEGINNER: 'Just starting out or play occasionally for fun.',
  INTERMEDIATE: 'Play regularly and have a good grasp of the rules and techniques.',
  ADVANCED: 'Highly competitive player with advanced skills and experience.',
};

export const EventRegisterScreen = ({ navigation, route }: any) => {
  const eventId = route.params?.eventId;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [position, setPosition] = useState('');
  const [experience, setExperience] = useState<Experience>('INTERMEDIATE');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!eventId) {
      showToast({ message: 'No event was selected.', tone: 'error' });
      navigation.goBack();
      return;
    }
    Promise.all([BackendAPI.getEvent(eventId), BackendAPI.getMe()])
      .then(([eventResult, meResult]) => {
        if (eventResult.event?.tournament) {
          navigation.replace('TournamentDetails', { tournamentId: eventId });
          return;
        }
        if (eventResult.event?.viewerRegistration || eventResult.event?.isFull || new Date(eventResult.event.startsAt).getTime() <= Date.now()) {
          navigation.replace('EventDetails', { eventId });
          return;
        }
        setEvent(eventResult.event);
        setType(eventResult.event.registrationType === 'TEAM' ? 'TEAM' : 'INDIVIDUAL');
        setPlayerName(meResult.profile.fullName || '');
        setCaptainName(meResult.profile.fullName || '');
        setPlayerEmail(meResult.profile.email || '');
      })
      .catch((error) => showToast({ message: error.message, tone: 'error' }))
      .finally(() => setLoading(false));
  }, [eventId, navigation]);

  const minTeam = Math.max(1, event?.minTeamSize ?? 1);
  const maxTeam = Math.max(minTeam, event?.maxTeamSize ?? 7);

  const updateRoster = (index: number, key: keyof RosterMember, value: string) => {
    setRoster((current) => current.map((member, i) => i === index ? { ...member, [key]: value } : member));
  };

  /**
   * Mirrors the server's rules for the contact block. Returning the message
   * rather than a boolean keeps the copy in one place for both step 1 and the
   * final submit.
   */
  const contactProblem = () => {
    if (!playerName.trim()) return 'Enter your full name.';
    if (!isValidEmail(playerEmail)) return 'Enter a valid email address.';
    if (!isValidPhone(playerPhone)) return 'Enter a phone number of at least 7 digits.';
    if (type === 'TEAM' && !teamName.trim()) return 'Enter your team name.';
    if (type === 'TEAM' && !captainName.trim()) return 'Enter the captain name.';
    return null;
  };

  /** Roster the server will see — the captain occupies the first slot. */
  const rosterForSubmit = () => [
    { name: captainName.trim(), email: playerEmail.trim() },
    ...roster
      .filter((member) => member.name.trim())
      .map((member) => ({ name: member.name.trim(), email: member.email.trim() || undefined })),
  ];

  const continueToSummary = () => {
    const problem = contactProblem();
    if (problem) {
      showToast({ message: problem, tone: 'error' });
      return;
    }
    if (!accepted) {
      showToast({ message: 'Accept the event rules to continue.', tone: 'error' });
      return;
    }
    if (type === 'INDIVIDUAL' && !position.trim()) {
      showToast({ message: 'Preferred position is required.', tone: 'error' });
      return;
    }
    if (type === 'TEAM') {
      // The server rejects a roster outside the event's own range; check it
      // here so the user is not told after filling in the whole form.
      const size = rosterForSubmit().length;
      if (size < minTeam || size > maxTeam) {
        showToast({
          message:
            minTeam === maxTeam
              ? `This event needs exactly ${maxTeam} players.`
              : `Add between ${minTeam} and ${maxTeam} players.`,
          tone: 'error',
        });
        return;
      }
      const badEmail = roster.find((member) => member.email.trim() && !isValidEmail(member.email));
      if (badEmail) {
        showToast({ message: `${badEmail.name || 'A player'} has an invalid email address.`, tone: 'error' });
        return;
      }
    }
    const payload = type === 'INDIVIDUAL' ? {
      type, playerName: playerName.trim(), playerEmail: playerEmail.trim(), playerPhone: playerPhone.trim(),
      playerPosition: position.trim(), experienceLevel: experience,
      emergencyContactName: emergencyName.trim() || undefined, emergencyContactPhone: emergencyPhone.trim() || undefined, acceptedTerms: true,
    } : {
      type, teamName: teamName.trim(), captainName: captainName.trim(), playerName: playerName.trim(),
      playerEmail: playerEmail.trim(), playerPhone: playerPhone.trim(), experienceLevel: experience,
      roster: rosterForSubmit(),
      acceptedTerms: true,
    };
    navigation.navigate('RegistrationSummary', { eventId, event, payload });
  };

  const continueRegistration = () => {
    if (step === 1) {
      const problem = contactProblem();
      if (problem) {
        showToast({ message: problem, tone: 'error' });
        return;
      }
      setStep(2);
      return;
    }
    continueToSummary();
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  if (!event) return <View style={styles.loading}><Text style={styles.emptyText}>Event unavailable</Text></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <PressableScale style={styles.iconButton} onPress={() => step === 2 ? setStep(1) : navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#FFF" /></PressableScale>
        <Text style={styles.headerTitle}>{step === 1 ? 'Register for Event' : 'Select Skill Level'}</Text><View style={styles.iconButton} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.stepText}>Step {step} of 3: {step === 1 ? 'Player Details' : 'How would you describe your game?'}</Text>
          <View style={styles.eventCard}>
            <AppImage uri={event.imageUrl} style={styles.eventImage} />
            <View style={styles.eventCopy}><Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text><Text style={styles.eventMeta}>{new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text><Text style={styles.eventMeta}>{event.venue?.name || 'Venue to be announced'}</Text></View>
          </View>

          {step === 1 && <>
          <Text style={styles.sectionLabel}>PARTICIPATION TYPE</Text>
          <View style={styles.typeRow}>
            {event.registrationType !== 'TEAM' ? <TypeCard active={type === 'INDIVIDUAL'} icon="person" title="Individual" subtitle="Register yourself" onPress={() => setType('INDIVIDUAL')} /> : null}
            {event.registrationType !== 'INDIVIDUAL' ? <TypeCard active={type === 'TEAM'} icon="people" title="As a Team" subtitle="Register your squad" onPress={() => setType('TEAM')} /> : null}
          </View>

          {type === 'TEAM' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Team details</Text>
              <Input label="TEAM NAME" placeholder="The Elite Gamers" icon="shield-outline" value={teamName} onChangeText={setTeamName} />
              <Input label="CAPTAIN NAME" placeholder="Captain's full name" icon="person-outline" value={captainName} onChangeText={setCaptainName} />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{type === 'TEAM' ? 'Captain contact' : 'Participant details'}</Text>
            <Input label="FULL NAME" placeholder="Alex Thompson" icon="person-outline" value={playerName} onChangeText={setPlayerName} />
            <Input label="EMAIL ADDRESS" placeholder="alex@athzy.com" icon="mail-outline" value={playerEmail} onChangeText={setPlayerEmail} autoCapitalize="none" keyboardType="email-address" />
            <Input label="PHONE NUMBER" placeholder="+1 555 000 0000" icon="call-outline" value={playerPhone} onChangeText={setPlayerPhone} keyboardType="phone-pad" />
          </View>

          </>}

          {step === 2 && <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience level</Text>
            {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as Experience[]).map((level) => <PressableScale key={level} style={[styles.experienceCard, experience === level && styles.experienceCardActive]} onPress={() => setExperience(level)}><View style={styles.experienceCopy}><Text style={styles.experienceTitle}>{level[0] + level.slice(1).toLowerCase()}</Text><Text style={styles.experienceText}>{experienceCopy[level]}</Text></View><View style={[styles.radio, experience === level && styles.radioActive]}>{experience === level ? <View style={styles.radioDot} /> : null}</View></PressableScale>)}
            <View style={styles.experienceNote}><Ionicons name="information-circle-outline" size={19} color={theme.colors.textMuted} /><Text style={styles.experienceNoteText}>This helps us match you with players of a similar skill level.</Text></View>
          </View>

          {type === 'INDIVIDUAL' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Playing details</Text>
              <Input label="PREFERRED POSITION" placeholder="Striker, midfielder..." icon="football-outline" value={position} onChangeText={setPosition} />
              <Input label="EMERGENCY CONTACT NAME (OPTIONAL)" placeholder="Contact name" icon="medical-outline" value={emergencyName} onChangeText={setEmergencyName} />
              <Input label="EMERGENCY CONTACT PHONE (OPTIONAL)" placeholder="+1 555 000 0000" icon="call-outline" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.rosterHeader}><View><Text style={styles.sectionTitle}>Team roster</Text><Text style={styles.rosterCount}>{roster.length + 1}/{maxTeam} players{minTeam > 1 ? ` · ${minTeam} minimum` : ''}</Text></View><PressableScale style={styles.addMember} onPress={() => roster.length + 1 < (event.maxTeamSize || 7) && setRoster((current) => [...current, { name: '', email: '' }])}><Ionicons name="add" size={20} color={theme.colors.background} /></PressableScale></View>
              <View style={styles.captainRow}><View style={styles.memberAvatar}><Ionicons name="person" size={20} color={theme.colors.primary} /></View><View style={styles.memberCopy}><Text style={styles.memberName}>{captainName || 'Captain'}</Text><Text style={styles.memberStatus}>CAPTAIN • CONFIRMED</Text></View><Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} /></View>
              {roster.map((member, index) => <View key={index} style={styles.memberForm}><Input label={`PLAYER ${index + 2}`} placeholder="Player name" icon="person-add-outline" value={member.name} onChangeText={(value: string) => updateRoster(index, 'name', value)} /><Input label="EMAIL (OPTIONAL)" placeholder="player@email.com" icon="mail-outline" value={member.email} onChangeText={(value: string) => updateRoster(index, 'email', value)} autoCapitalize="none" keyboardType="email-address" /><PressableScale onPress={() => setRoster((current) => current.filter((_, i) => i !== index))}><Text style={styles.removeText}>Remove player</Text></PressableScale></View>)}
              {roster.length + 1 < (event.maxTeamSize || 7) && <PressableScale style={styles.inviteRow} onPress={() => setRoster((current) => [...current, { name: '', email: '' }])}><Ionicons name="add" size={24} color={theme.colors.textMuted} /><Text style={styles.inviteText}>Add another player</Text></PressableScale>}
            </View>
          )}

          <PressableScale style={styles.consentRow} onPress={() => setAccepted((value) => !value)}>
            <View style={[styles.checkbox, accepted && styles.checkboxActive]}>{accepted && <Ionicons name="checkmark" size={17} color={theme.colors.background} />}</View>
             <Text style={styles.consentText}>I accept the event rules, fair-play policy, and cancellation terms.</Text>
          </PressableScale>
          </>}
        </ScrollView>

        <LinearGradient colors={['rgba(10,10,10,0)', '#0A0A0A', '#0A0A0A']} style={styles.footer}>
          <Button title={step === 1 ? 'Continue →' : 'Continue to Summary →'} onPress={continueRegistration} disabled={step === 2 && !accepted} style={styles.footerButton} />
          {step === 2 ? <PressableScale onPress={() => setStep(1)}><Text style={styles.backText}>Back</Text></PressableScale> : null}
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const TypeCard = ({ active, icon, title, subtitle, onPress }: any) => <PressableScale style={[styles.typeCard, active && styles.typeCardActive]} onPress={onPress}><View style={[styles.typeIcon, active && styles.typeIconActive]}><Ionicons name={icon} size={24} color={active ? theme.colors.primary : theme.colors.textSecondary} /></View><Text style={styles.typeTitle}>{title}</Text><Text style={styles.typeSubtitle}>{subtitle}</Text>{active && <View style={styles.typeCheck}><Ionicons name="checkmark" size={12} color={theme.colors.background} /></View>}</PressableScale>;

const styles = StyleSheet.create({
  flex: { flex: 1 }, container: { flex: 1, backgroundColor: theme.colors.background }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }, emptyText: { color: theme.colors.text },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }, iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface }, headerTitle: { ...theme.typography.h3 },
  stepText: { ...theme.typography.body, marginBottom: 18 },
  content: { padding: 24, paddingBottom: 170 }, eventCard: { flexDirection: 'row', padding: 15, borderRadius: 24, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 34 }, eventImage: { width: 80, height: 80, borderRadius: 18 }, eventCopy: { flex: 1, justifyContent: 'center', marginLeft: 16 }, eventTitle: { ...theme.typography.h3, fontSize: 16, lineHeight: 21, marginBottom: 6 }, eventMeta: { ...theme.typography.body, fontSize: 12, lineHeight: 17 },
  sectionLabel: { ...theme.typography.label, marginBottom: 14 }, typeRow: { flexDirection: 'row', gap: 16, marginBottom: 34 }, typeCard: { flex: 1, height: 122, borderRadius: 24, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }, typeCardActive: { borderWidth: 2, borderColor: theme.colors.primary }, typeIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, typeIconActive: { backgroundColor: theme.colors.primaryMuted }, typeTitle: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }, typeSubtitle: { color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 2 }, typeCheck: { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 30 }, sectionTitle: { ...theme.typography.h3, marginBottom: 14 }, segmented: { flexDirection: 'row', height: 52, padding: 5, borderRadius: 24, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, segment: { flex: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, segmentActive: { backgroundColor: theme.colors.primary }, segmentText: { color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 }, segmentTextActive: { color: theme.colors.background },
  experienceCard: { minHeight: 104, flexDirection: 'row', alignItems: 'center', padding: 18, marginBottom: 12, borderRadius: 24, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, experienceCardActive: { borderWidth: 2, borderColor: theme.colors.primary }, experienceCopy: { flex: 1, paddingRight: 14 }, experienceTitle: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }, experienceText: { color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, lineHeight: 18, marginTop: 6 }, radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }, radioActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary }, radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.background }, experienceNote: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, experienceNoteText: { ...theme.typography.body, flex: 1, fontSize: 11, lineHeight: 17 },
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, rosterCount: { ...theme.typography.body, fontSize: 12, marginTop: -8, marginBottom: 14 }, addMember: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }, captainRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(69,240,106,0.3)', backgroundColor: theme.colors.surface, marginBottom: 12 }, memberAvatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryMuted }, memberCopy: { flex: 1, marginLeft: 14 }, memberName: { color: theme.colors.text, fontFamily: 'PlusJakartaSans_700Bold' }, memberStatus: { color: theme.colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, marginTop: 4 }, memberForm: { borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 }, removeText: { color: theme.colors.error, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, textAlign: 'right' }, inviteRow: { height: 78, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, inviteText: { color: theme.colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }, checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, checkboxActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, consentText: { ...theme.typography.body, flex: 1, fontSize: 12, lineHeight: 18 }, footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 38, paddingBottom: 18 }, footerButton: { height: 64, borderRadius: 32 }, backText: { color: theme.colors.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, textAlign: 'center', paddingTop: 14 },
});
