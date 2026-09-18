import React, { useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { ScreenHeader } from '../../components/ScreenHeader';
import { theme } from '../../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const helpTopics = [
  {
    title: 'Account and profile',
    icon: 'person-circle-outline' as const,
    answer:
      'Edit your name and username from Profile. Sports and location can be updated from the Profile settings section.',
  },
  {
    title: 'Bookings and registrations',
    icon: 'ticket-outline' as const,
    answer:
      'Open My Bookings to review event entries, tournament entries, venue reservations, tickets, and available cancellation actions.',
  },
  {
    title: 'Event chat and channels',
    icon: 'chatbubbles-outline' as const,
    answer:
      'Registering for an event adds you to its channels automatically. Open Chat to find the welcome, general and announcement rooms for every event you have joined.',
  },
  {
    title: 'Community and safety',
    icon: 'shield-checkmark-outline' as const,
    answer:
      'Use the menu on a post or player profile to send a report to the moderation team. Block controls are available on player profiles.',
  },
  {
    title: 'Notifications',
    icon: 'notifications-outline' as const,
    answer:
      'Your inbox includes connection, community, event and chat updates. Pull down on the Notifications screen to refresh it.',
  },
];

export function SupportScreen({ navigation }: any) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (title: string) => {
    triggerHaptic('selection');
    // Cheap height animation — the content is static, so a layout pass is enough.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((current) => (current === title ? null : title));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title="Help & support" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroIcon}>
            <Ionicons name="headset-outline" size={28} color={theme.colors.onPrimary} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroText}>
            Quick guidance for your account, bookings, event chat, community safety and notifications.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>QUICK ANSWERS</Text>
        <View style={styles.topicList}>
          {helpTopics.map((topic) => {
            const open = expanded === topic.title;
            return (
              <PressableScale
                key={topic.title}
                style={[styles.topic, open && styles.topicOpen]}
                scaleTo={0.99}
                haptic="none"
                onPress={() => toggle(topic.title)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={topic.title}
              >
                <View style={styles.topicTop}>
                  <View style={styles.topicIcon}>
                    <Ionicons name={topic.icon} size={20} color={theme.colors.textSecondary} />
                  </View>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
                </View>
                {open ? <Text style={styles.topicAnswer}>{topic.answer}</Text> : null}
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.safetyCard}>
          <View style={styles.safetyIcon}>
            <Ionicons name="lock-closed-outline" size={21} color={theme.colors.primary} />
          </View>
          <View style={styles.safetyCopy}>
            <Text style={styles.safetyTitle}>Your safety matters</Text>
            <Text style={styles.safetyText}>
              Reports are private. The reported player is never told who submitted the report.
            </Text>
          </View>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactEyebrow}>DIRECT SUPPORT</Text>
          <Text style={styles.contactTitle}>Support contact is coming soon</Text>
          <Text style={styles.contactText}>
            A verified support channel will appear here once it is configured. Until then, use in-app reporting for
            safety concerns.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.gutter, paddingTop: theme.spacing.s, paddingBottom: theme.spacing.xxl },

  hero: {
    minHeight: 220,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroGlow: {
    position: 'absolute',
    top: -80,
    width: 220,
    height: 180,
    borderRadius: 110,
    backgroundColor: 'rgba(69,240,106,0.08)',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  heroTitle: { ...theme.typography.h2, fontSize: 22, marginTop: theme.spacing.l },
  heroText: { ...theme.typography.bodySmall, textAlign: 'center', marginTop: theme.spacing.s, maxWidth: 300 },

  sectionLabel: { ...theme.typography.label, color: theme.colors.primary, marginTop: theme.spacing.xl, marginBottom: theme.spacing.m },

  topicList: { gap: theme.spacing.s },
  topic: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  topicOpen: { borderColor: theme.colors.primarySoft, backgroundColor: 'rgba(69,240,106,0.035)' },
  topicTop: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  topicIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  topicTitle: { ...theme.typography.title, fontSize: 14, flex: 1 },
  topicAnswer: {
    ...theme.typography.bodySmall,
    paddingLeft: 58,
    paddingRight: theme.spacing.s,
    marginTop: theme.spacing.s,
  },

  safetyCard: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    marginTop: theme.spacing.l,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
  },
  safetyIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(69,240,106,0.12)',
  },
  safetyCopy: { flex: 1, minWidth: 0 },
  safetyTitle: { ...theme.typography.title, fontSize: 14 },
  safetyText: { ...theme.typography.bodySmall, marginTop: 5 },

  contactCard: {
    marginTop: theme.spacing.m,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contactEyebrow: { ...theme.typography.label, color: theme.colors.textMuted },
  contactTitle: { ...theme.typography.title, fontSize: 16, marginTop: theme.spacing.s },
  contactText: { ...theme.typography.bodySmall, marginTop: theme.spacing.s },
});
