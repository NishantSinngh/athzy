import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackendAPI } from '../../api/backend';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { ScreenHeader } from '../../components/ScreenHeader';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';

const MAX_LENGTH = 500;

export const CreatePostScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [sports, setSports] = useState<any[]>([]);
  const [sportSlug, setSportSlug] = useState<string>();
  const [profile, setProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([BackendAPI.getSports(), BackendAPI.getMe()])
      .then(([sportData, me]) => {
        setSports(sportData.sports || []);
        setProfile(me.profile);
      })
      .catch((error) => showToast({ message: error.message || 'Could not prepare the composer.', tone: 'error' }));
  }, []);

  const remaining = MAX_LENGTH - content.length;
  const nearLimit = remaining <= 50;

  const publish = async () => {
    const text = content.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await BackendAPI.createCommunityPost({ content: text, sportSlug });
      setContent('');
      setSportSlug(undefined);
      showToast({ message: 'Your post is live.', tone: 'success' });
      navigation.navigate('MainTabs', { screen: 'Community', params: { refreshAt: Date.now() } });
    } catch (error: any) {
      showToast({ message: error.message || 'Could not publish your post.', tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader
          navigation={navigation}
          title="New post"
          subtitle="Visible to Athzy players"
          bordered
          right={
            <View style={[styles.counter, nearLimit && styles.counterWarn]}>
              <Text style={[styles.counterText, nearLimit && styles.counterTextWarn]}>{remaining}</Text>
            </View>
          }
        />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.identity}>
            <Avatar uri={profile?.avatarUrl} name={profile?.fullName} size={44} />
            <View style={styles.identityCopy}>
              <Text style={styles.identityName}>{profile?.fullName || 'Athzy Player'}</Text>
              <Text style={styles.identityMeta}>
                {sportSlug ? `Posting in ${sportSlug.replace(/-/g, ' ')}` : 'Posting to all sports'}
              </Text>
            </View>
          </View>

          <TextInput
            value={content}
            onChangeText={(value) => setContent(value.slice(0, MAX_LENGTH))}
            placeholder="What happened on the field?"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            autoFocus
            style={styles.editor}
            textAlignVertical="top"
            selectionColor={theme.colors.primary}
            accessibilityLabel="Post content"
          />

          <Text style={styles.label}>Tag a sport</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="All sports" active={!sportSlug} onPress={() => { triggerHaptic('selection'); setSportSlug(undefined); }} />
            {sports.map((sport) => (
              <Chip
                key={sport.id}
                label={sport.name}
                active={sportSlug === sport.slug}
                onPress={() => { triggerHaptic('selection'); setSportSlug(sport.slug); }}
              />
            ))}
          </ScrollView>

          <View style={styles.notice}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.noticeText}>
              Keep it useful, respectful and focused on local sport. Posts are public to signed-in members.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.m) }]}>
          <Button
            title="Publish post"
            trailingIconName="arrow-forward"
            onPress={publish}
            loading={submitting}
            disabled={!content.trim()}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function Chip({ label, active, onPress }: any) {
  return (
    <PressableScale
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      haptic="none"
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Tag ${label}`}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.gutter, paddingTop: theme.spacing.m },

  counter: {
    minWidth: 40,
    height: 32,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  counterWarn: { backgroundColor: theme.colors.warningMuted, borderColor: 'rgba(251,146,60,0.28)' },
  counterText: { ...theme.typography.caption, fontFamily: theme.font.bold },
  counterTextWarn: { color: theme.colors.warning },

  identity: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  identityCopy: { flex: 1, minWidth: 0 },
  identityName: { ...theme.typography.title, fontSize: 15 },
  identityMeta: { ...theme.typography.caption, marginTop: 2, textTransform: 'capitalize' },

  editor: {
    minHeight: 180,
    marginTop: theme.spacing.l,
    color: theme.colors.text,
    fontFamily: theme.font.medium,
    fontSize: 19,
    lineHeight: 28,
  },

  label: { ...theme.typography.label, marginTop: theme.spacing.l, marginBottom: theme.spacing.m },
  chips: { gap: theme.spacing.s, paddingBottom: theme.spacing.l },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontFamily: theme.font.semibold },
  chipTextActive: { color: theme.colors.onPrimary, fontFamily: theme.font.bold },

  notice: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.primaryMuted,
  },
  noticeText: { ...theme.typography.caption, flex: 1, lineHeight: 18 },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
