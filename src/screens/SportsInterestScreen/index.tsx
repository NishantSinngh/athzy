import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { BackgroundGlow } from '../../components/BackgroundGlow';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { GlassCard } from '../../components/GlassCard';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { Skeleton } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';

const MINIMUM = 3;

const iconBySlug: Record<string, keyof typeof Ionicons.glyphMap> = {
  cricket: 'baseball-outline',
  football: 'football-outline',
  basketball: 'basketball-outline',
  tennis: 'tennisball-outline',
  badminton: 'tennisball-outline',
  running: 'walk-outline',
  swimming: 'water-outline',
  cycling: 'bicycle-outline',
  padel: 'tennisball-outline',
  volleyball: 'football-outline',
  golf: 'golf-outline',
};

export const SportsInterestScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [sports, setSports] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const editing = Boolean(route.params?.editing);

  const load = () => {
    setError('');
    setLoading(true);
    Promise.all([BackendAPI.getSports(), BackendAPI.getMe()])
      .then(([data, me]) => {
        setSports(data.sports ?? []);
        setSelected(new Set((me.profile.sports || []).map((item: any) => item.sport.id)));
      })
      .catch((requestError) => setError(requestError.message || 'Unable to load sports.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = (id: string) => {
    triggerHaptic('selection');
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size < MINIMUM) return;
    setSubmitting(true);
    try {
      await BackendAPI.updateUserSports([...selected]);
      if (editing) {
        showToast({ message: 'Your sports are updated.', tone: 'success' });
        navigation.goBack();
      } else {
        navigation.replace('Location');
      }
    } catch (requestError: any) {
      showToast({ message: requestError.message || 'Could not save your sports.', tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MINIMUM - selected.size;

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGlow />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 220 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>{editing ? 'YOUR PROFILE' : 'STEP 3 OF 5'}</Text>
        </View>

        <Text style={styles.title}>{editing ? 'Manage your sports' : 'Choose your sports'}</Text>
        <Text style={styles.subtitle}>
          Pick at least three. This shapes the events, teams and community feed you see.
        </Text>

        {loading ? (
          <View style={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} height={56} radius={theme.borderRadius.round} style={{ width: '47%' }} />
            ))}
          </View>
        ) : error ? (
          <EmptyState
            icon="cloud-offline-outline"
            tone="error"
            title="Unable to load sports"
            message={error}
            actionLabel="Try again"
            onAction={load}
          />
        ) : (
          <View style={styles.grid}>
            {sports.map((sport, index) => {
              const active = selected.has(sport.id);
              return (
                <Animated.View
                  key={sport.id}
                  entering={FadeInDown.delay(Math.min(index, 10) * 40).duration(theme.motion.duration.normal)}
                >
                  <PressableScale
                    style={[styles.sport, active && styles.sportActive]}
                    onPress={() => toggle(sport.id)}
                    haptic="none"
                    scaleTo={0.95}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={sport.name}
                  >
                    <View style={[styles.sportIcon, active && styles.sportIconActive]}>
                      <Ionicons
                        name={iconBySlug[sport.slug] ?? 'fitness-outline'}
                        size={20}
                        color={active ? theme.colors.onPrimary : theme.colors.text}
                      />
                    </View>
                    <Text style={[styles.sportName, active && styles.sportNameActive]} numberOfLines={1}>
                      {sport.name}
                    </Text>
                    <View style={[styles.check, active && styles.checkActive]}>
                      {active ? <Ionicons name="checkmark" size={13} color={theme.colors.onPrimary} /> : null}
                    </View>
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <GlassCard style={[styles.panel, { paddingBottom: Math.max(insets.bottom, theme.spacing.l) }]}>
        <View style={styles.panelTop}>
          <View style={styles.panelCopy}>
            <Text style={styles.panelLabel}>SELECTED</Text>
            <Text style={styles.panelCount}>
              {selected.size} {selected.size === 1 ? 'sport' : 'sports'}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (selected.size / MINIMUM) * 100)}%` },
              ]}
            />
          </View>
        </View>

        <Button
          title={
            remaining > 0
              ? `Select ${remaining} more`
              : editing
                ? 'Save sports'
                : 'Continue'
          }
          trailingIconName={remaining > 0 ? undefined : 'arrow-forward'}
          onPress={submit}
          disabled={remaining > 0}
          loading={submitting}
          fullWidth
        />
      </GlassCard>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.l },

  stepPill: {
    alignSelf: 'flex-start',
    height: 32,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  stepText: { ...theme.typography.label, color: theme.colors.primary },

  title: { ...theme.typography.h1 },
  subtitle: { ...theme.typography.bodyLarge, maxWidth: 350, marginTop: theme.spacing.s, marginBottom: theme.spacing.xl },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.m },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.m },

  sport: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sportActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sportIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  sportIconActive: { backgroundColor: 'rgba(10,10,10,0.16)' },
  sportName: { ...theme.typography.bodySmall, color: theme.colors.text, fontFamily: theme.font.semibold, fontSize: 14 },
  sportNameActive: { color: theme.colors.onPrimary },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.textMuted,
  },
  checkActive: { backgroundColor: 'rgba(10,10,10,0.2)', borderColor: 'rgba(10,10,10,0.2)' },

  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.l,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
  },
  panelTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l, marginBottom: theme.spacing.l },
  panelCopy: { minWidth: 96 },
  panelLabel: { ...theme.typography.label },
  panelCount: { ...theme.typography.h3, marginTop: 4 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceLight, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: theme.colors.primary },
});
