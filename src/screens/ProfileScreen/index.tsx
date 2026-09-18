import React, { useCallback, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { BottomSheet } from '../../components/BottomSheet';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { SectionHeader } from '../../components/SectionHeader';
import { Skeleton } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { normalizeUsername, USERNAME_PATTERN, USERNAME_REQUIREMENT } from '../../auth/username';
import { unregisterPushToken } from '../../notifications/PushRegistration';
import { theme } from '../../theme';
import { formatRelative } from '../../utils/format';
import { clearAuthToken } from '../../api/authToken';

type ProfileTab = 'Stats' | 'Posts' | 'Media';

const sportImages: Record<string, string> = {
  football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=700',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=700',
  tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=700',
  cricket: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=700',
};

export const ProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('Stats');
  const [refreshing, setRefreshing] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    const [me, community] = await Promise.all([BackendAPI.getMe(), BackendAPI.getCommunityPosts()]);
    setProfile(me.profile);
    setName(me.profile.fullName || '');
    setUsername(me.profile.username || '');
    setPosts((community.posts || []).filter((post: any) => post.user?.id === me.profile.id));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => setLoadError(error.message));
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (error: any) {
      showToast({ message: error.message || 'Could not refresh your profile.', tone: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) return;
    const normalized = normalizeUsername(username);
    if (!USERNAME_PATTERN.test(normalized)) {
      setUsernameError(USERNAME_REQUIREMENT);
      return;
    }
    setUsernameError('');
    setSaving(true);
    try {
      const result = await BackendAPI.updateProfile({ fullName: name.trim(), username: normalized });
      setProfile((current: any) => ({ ...current, ...result.profile }));
      setUsername(result.profile.username || normalized);
      setEditVisible(false);
      showToast({ message: 'Profile updated.', tone: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Could not update your profile.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // A real, irreversible decision — this one keeps a blocking confirm.
  const deleteAccount = () =>
    Alert.alert(
      'Delete account permanently?',
      'This removes your profile, bookings, posts, and authentication account. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await BackendAPI.deleteAccount();
              await unregisterPushToken();
            } catch (error: any) {
              showToast({ message: error.message || 'Could not delete your account.', tone: 'error' });
            }
          },
        },
      ],
    );

  const handleSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await unregisterPushToken();
          await clearAuthToken();
        },
      },
    ]);

  const shareProfile = () =>
    Share.share({
      message: `Find ${profile?.fullName || 'me'}${profile?.username ? ` (@${profile.username})` : ''} on Athzy.`,
    }).catch(() => undefined);

  if (!profile && loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Unable to load profile"
          message={loadError}
          actionLabel="Try again"
          onAction={() => load().catch((error) => setLoadError(error.message))}
        />
      </SafeAreaView>
    );
  }

  if (!profile) return <ProfileSkeleton />;

  const stats = profile.stats || {};
  const location = [profile.locationCity, profile.locationState].filter(Boolean).join(', ') || 'Location not set';
  const mediaPosts = posts.filter((post) => post.imageUrl);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        {/* Profile is pushed from the Home avatar now, so it owns a back button. */}
        <PressableScale
          style={styles.topButton}
          scaleTo={0.9}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </PressableScale>

        <Text style={styles.handle} numberOfLines={1}>
          {profile.username ? `@${profile.username}` : profile.email}
        </Text>

        <View style={styles.topActions}>
          <PressableScale
            style={styles.topButton}
            onPress={shareProfile}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Share profile"
          >
            <Ionicons name="share-social-outline" size={19} color={theme.colors.text} />
          </PressableScale>
          <PressableScale
            style={styles.topButton}
            onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Go to settings"
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
          </PressableScale>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <Animated.View entering={FadeIn.duration(theme.motion.duration.normal)} style={styles.identity}>
          <View>
            <Avatar uri={profile.avatarUrl} name={profile.fullName} size={112} ring />
            <View style={styles.identityBadge}>
              <Ionicons name="flash" size={14} color={theme.colors.onPrimary} />
            </View>
          </View>
          <Text style={styles.name}>{profile.fullName || 'Player'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.colors.primary} />
            <Text style={styles.location}>{location}</Text>
          </View>
          {profile.sports?.length ? (
            <Text style={styles.bio} numberOfLines={2}>
              Plays {profile.sports.map((item: any) => item.sport.name).join(' · ')}
            </Text>
          ) : null}
        </Animated.View>

        <View style={styles.primaryActions}>
          <Button title="Edit profile" iconName="create-outline" size="medium" onPress={() => setEditVisible(true)} style={styles.flex} />
          <Button
            title="My tickets"
            variant="secondary"
            size="medium"
            iconName="ticket-outline"
            onPress={() => navigation.navigate('MyBookings')}
            style={styles.flex}
          />
        </View>

        <View style={styles.shortcuts}>
          <Shortcut icon="people-outline" label="Connections" onPress={() => navigation.navigate('Connections')} />
          <Shortcut icon="notifications-outline" label="Alerts" onPress={() => navigation.navigate('Notifications')} />
          <Shortcut icon="football-outline" label="My sports" onPress={() => navigation.navigate('SportsInterest', { editing: true })} />
          <Shortcut icon="headset-outline" label="Support" onPress={() => navigation.navigate('Support')} />
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Events joined" value={stats.eventsJoined ?? 0} icon="calendar-outline" />
          <StatCard label="Tournaments" value={stats.tournamentsEntered ?? 0} icon="trophy-outline" />
          <StatCard label="Posts" value={stats.posts ?? 0} icon="chatbubble-outline" />
          <StatCard label="Connections" value={stats.connections ?? 0} icon="people-outline" />
        </View>

        <View style={styles.tabs}>
          {(['Stats', 'Posts', 'Media'] as ProfileTab[]).map((tab) => {
            const active = activeTab === tab;
            const count = tab === 'Posts' ? posts.length : tab === 'Media' ? mediaPosts.length : undefined;
            return (
              <PressableScale
                key={tab}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => { triggerHaptic('selection'); setActiveTab(tab); }}
                haptic="none"
                scaleTo={0.96}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${tab} tab`}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab}{count !== undefined ? ` ${count}` : ''}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        {activeTab === 'Stats' ? (
          <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)}>
            <SectionHeader
              title="My sports"
              actionLabel="Manage"
              onAction={() => navigation.navigate('SportsInterest', { editing: true })}
            />
            {(profile.sports || []).length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsRow}>
                {profile.sports.map((item: any) => (
                  <View key={item.sport.id} style={styles.sportCard}>
                    <AppImage uri={sportImages[item.sport.slug] || sportImages.football} style={styles.sportImage} />
                    <LinearGradient colors={theme.gradients.imageScrim} style={StyleSheet.absoluteFill} />
                    <View style={styles.sportBadge}><Badge label="Active" tone="primary" /></View>
                    <View style={styles.sportCopy}>
                      <Text style={styles.sportName}>{item.sport.name}</Text>
                      <Text style={styles.sportLevel}>Community level</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <EmptyState
                compact
                icon="football-outline"
                title="No sports yet"
                message="Pick the sports you play so Athzy can find the right games."
                actionLabel="Choose sports"
                onAction={() => navigation.navigate('SportsInterest', { editing: true })}
              />
            )}

            <View style={styles.block}>
              <SectionHeader title="Recent activity" />
              {(profile.registrations || []).length ? (
                <View style={styles.activityList}>
                  {profile.registrations.slice(0, 4).map((registration: any, index: number) => (
                    <Animated.View
                      key={registration.id}
                      entering={FadeInDown.delay(index * theme.motion.stagger).duration(theme.motion.duration.normal)}
                    >
                      <PressableScale
                        style={styles.activity}
                        scaleTo={0.985}
                        onPress={() =>
                          navigation.navigate('BookingDetails', {
                            kind: registration.kind === 'TOURNAMENT' ? 'tournament' : 'event',
                            bookingId: registration.id,
                          })
                        }
                        accessibilityRole="button"
                        accessibilityLabel={registration.event.title}
                      >
                        <View style={styles.activityIcon}>
                          <Ionicons
                            name={registration.kind === 'TOURNAMENT' ? 'trophy-outline' : 'calendar-outline'}
                            size={20}
                            color={theme.colors.textSecondary}
                          />
                        </View>
                        <View style={styles.activityCopy}>
                          <Text style={styles.activityTitle} numberOfLines={1}>{registration.event.title}</Text>
                          <Text style={styles.activityMeta}>
                            {registration.kind === 'TOURNAMENT' ? 'Tournament' : 'Event'} · {registration.status.toLowerCase()}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                      </PressableScale>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  compact
                  icon="calendar-outline"
                  title="Nothing yet"
                  message="Your registrations and match history will show up here."
                  actionLabel="Find events"
                  onAction={() => navigation.navigate('MainTabs', { screen: 'Events' })}
                />
              )}
            </View>

            <View style={styles.block}>
              <SectionHeader title="Achievements" />
              <View style={styles.achievements}>
                <Achievement
                  icon="calendar-outline"
                  title="Events joined"
                  detail={`${stats.eventsJoined ?? 0} confirmed`}
                />
                <Achievement
                  icon="trophy-outline"
                  title="Tournaments"
                  detail={`${stats.tournamentsEntered ?? 0} entered`}
                />
              </View>
            </View>
          </Animated.View>
        ) : null}

        {activeTab === 'Posts' ? (
          <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)} style={styles.postList}>
            {posts.length ? (
              posts.map((post, index) => (
                <Animated.View
                  key={post.id}
                  entering={FadeInDown.delay(Math.min(index, 6) * theme.motion.stagger).duration(theme.motion.duration.normal)}
                >
                  <PressableScale
                    style={styles.post}
                    scaleTo={0.985}
                    onPress={() => navigation.navigate('PostDetails', { postId: post.id })}
                    accessibilityRole="button"
                    accessibilityLabel="Open post"
                  >
                    <Text style={styles.postDate}>{formatRelative(post.createdAt)}</Text>
                    <Text style={styles.postText} numberOfLines={4}>{post.content}</Text>
                    <View style={styles.postStats}>
                      <Ionicons name="heart-outline" size={14} color={theme.colors.textMuted} />
                      <Text style={styles.postStat}>{post.likes ?? 0}</Text>
                      <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textMuted} style={{ marginLeft: 12 }} />
                      <Text style={styles.postStat}>{post.comments ?? 0}</Text>
                    </View>
                  </PressableScale>
                </Animated.View>
              ))
            ) : (
              <EmptyState
                compact
                icon="create-outline"
                title="No posts yet"
                message="Share an update and it will appear on your profile."
                actionLabel="Write a post"
                onAction={() => navigation.navigate('CreatePost')}
              />
            )}
          </Animated.View>
        ) : null}

        {activeTab === 'Media' ? (
          <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)}>
            {mediaPosts.length ? (
              <View style={styles.mediaGrid}>
                {mediaPosts.map((post) => (
                  <PressableScale
                    key={post.id}
                    style={styles.mediaItem}
                    scaleTo={0.96}
                    onPress={() => navigation.navigate('PostDetails', { postId: post.id })}
                    accessibilityRole="button"
                    accessibilityLabel="Open post"
                  >
                    <AppImage uri={post.imageUrl} style={styles.media} />
                  </PressableScale>
                ))}
              </View>
            ) : (
              <EmptyState
                compact
                icon="images-outline"
                title="No photos yet"
                message="Photos from your community posts will appear here."
              />
            )}
          </Animated.View>
        ) : null}

        <View style={styles.settingsSection}>
          <SectionHeader title="Settings" />
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="notifications-outline"
              title="Notifications"
              detail="Activity and updates"
              onPress={() => navigation.navigate('Notifications')}
            />
            <SettingsRow
              icon="options-outline"
              title="Sports preferences"
              detail="Choose the sports you follow"
              onPress={() => navigation.navigate('SportsInterest', { editing: true })}
            />
            <SettingsRow
              icon="location-outline"
              title="Location"
              detail={location}
              onPress={() =>
                navigation.navigate('Location', {
                  editing: true,
                  city: profile.locationCity || '',
                  state: profile.locationState || '',
                  latitude: profile.latitude == null ? undefined : Number(profile.latitude),
                  longitude: profile.longitude == null ? undefined : Number(profile.longitude),
                })
              }
            />
            <SettingsRow
              icon="help-circle-outline"
              title="Help & support"
              detail="Quick answers and safety"
              onPress={() => navigation.navigate('Support')}
            />
            <SettingsRow icon="log-out-outline" title="Log out" detail="Sign out of this device" onPress={handleSignOut} last />
          </View>

          <PressableScale
            style={styles.deleteRow}
            onPress={deleteAccount}
            haptic="medium"
            accessibilityRole="button"
            accessibilityLabel="Delete account"
          >
            <Ionicons name="trash-outline" size={19} color={theme.colors.error} />
            <View style={styles.deleteCopy}>
              <Text style={styles.deleteTitle}>Delete account</Text>
              <Text style={styles.deleteDetail}>Permanently remove your Athzy account</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </PressableScale>
        </View>
      </ScrollView>

      <BottomSheet
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        eyebrow="YOUR PROFILE"
        title="Edit profile"
        description="This is how other players find and recognise you."
      >
        <Input label="Display name" placeholder="Your name" icon="person-outline" value={name} onChangeText={setName} />
        <Input
          label="Username"
          placeholder="alex_player"
          icon="at-outline"
          value={username}
          onChangeText={(value: string) => { setUsername(value); setUsernameError(''); }}
          autoCapitalize="none"
          autoCorrect={false}
          error={usernameError}
          hint={usernameError ? undefined : USERNAME_REQUIREMENT}
        />
        <Button title="Save changes" onPress={saveProfile} loading={saving} disabled={!name.trim()} />
      </BottomSheet>
    </SafeAreaView>
  );
};

function Shortcut({ icon, label, onPress }: any) {
  return (
    <PressableScale style={styles.shortcut} scaleTo={0.94} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.shortcutIcon}>
        <Ionicons name={icon} size={20} color={theme.colors.textSecondary} />
      </View>
      <Text style={styles.shortcutLabel} numberOfLines={1}>{label}</Text>
    </PressableScale>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Achievement({ icon, title, detail }: any) {
  return (
    <View style={styles.achievement}>
      <View style={styles.achievementIcon}>
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <Text style={styles.achievementTitle}>{title}</Text>
      <Text style={styles.achievementDetail}>{detail}</Text>
    </View>
  );
}

function SettingsRow({ icon, title, detail, onPress, last }: any) {
  return (
    <PressableScale
      style={[styles.settingsRow, last && styles.settingsRowLast]}
      scaleTo={0.99}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.settingsIcon}>
        <Ionicons name={icon} size={19} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.settingsCopy}>
        <Text style={styles.settingsTitle}>{title}</Text>
        <Text style={styles.settingsDetail} numberOfLines={1}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </PressableScale>
  );
}

function ProfileSkeleton() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.content, { gap: theme.spacing.l }]}>
        <View style={styles.identity}>
          <Skeleton width={112} height={112} radius={36} />
          <Skeleton width={160} height={24} radius={theme.borderRadius.xs} style={{ marginTop: theme.spacing.m }} />
          <Skeleton width={110} height={13} radius={theme.borderRadius.xs} style={{ marginTop: theme.spacing.s }} />
        </View>
        <View style={styles.primaryActions}>
          <Skeleton height={48} radius={theme.borderRadius.l} style={{ flex: 1 }} />
          <Skeleton height={48} radius={theme.borderRadius.l} style={{ flex: 1 }} />
        </View>
        <View style={styles.statsGrid}>
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} height={104} radius={theme.borderRadius.xl} style={{ width: '48%' }} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },

  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.gutter,
  },
  handle: { ...theme.typography.title, fontSize: 15, flex: 1, textAlign: "center" },
  topActions: { flexDirection: 'row', gap: theme.spacing.s },
  topButton: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  content: { paddingHorizontal: theme.spacing.gutter, paddingTop: theme.spacing.s },

  identity: { alignItems: 'center', paddingTop: theme.spacing.s },
  identityBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  name: { ...theme.typography.h1, fontSize: 27, marginTop: theme.spacing.m },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  location: { ...theme.typography.bodySmall },
  bio: { ...theme.typography.bodySmall, textAlign: 'center', maxWidth: 300, marginTop: theme.spacing.m },

  primaryActions: { flexDirection: 'row', gap: theme.spacing.s, marginTop: theme.spacing.l },

  shortcuts: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.s, marginTop: theme.spacing.l },
  shortcut: { flex: 1, alignItems: 'center', gap: 8 },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shortcutLabel: { ...theme.typography.caption, fontSize: 11 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    marginTop: theme.spacing.xl,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    gap: 6,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: { ...theme.typography.numeric, fontSize: 24 },
  statLabel: { ...theme.typography.caption, fontSize: 11 },

  tabs: {
    flexDirection: 'row',
    gap: 5,
    padding: 5,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: theme.borderRadius.m },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { ...theme.typography.caption, fontSize: 13, color: theme.colors.textSecondary, fontFamily: theme.font.semibold },
  tabTextActive: { color: theme.colors.onPrimary, fontFamily: theme.font.bold },

  block: { marginTop: theme.spacing.xl },
  sportsRow: { gap: theme.spacing.m, paddingBottom: theme.spacing.s },
  sportCard: {
    width: 220,
    height: 250,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.surface,
  },
  sportImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  sportBadge: { position: 'absolute', top: theme.spacing.m, left: theme.spacing.m },
  sportCopy: { padding: theme.spacing.m },
  sportName: { ...theme.typography.h3 },
  sportLevel: { ...theme.typography.caption, marginTop: 3 },

  activityList: { gap: theme.spacing.s },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activityIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  activityCopy: { flex: 1, minWidth: 0 },
  activityTitle: { ...theme.typography.title, fontSize: 14 },
  activityMeta: { ...theme.typography.caption, marginTop: 3, textTransform: 'capitalize' },

  achievements: { flexDirection: 'row', gap: theme.spacing.m },
  achievement: {
    flex: 1,
    gap: theme.spacing.s,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  achievementIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  achievementTitle: { ...theme.typography.title, fontSize: 14, marginTop: theme.spacing.s },
  achievementDetail: { ...theme.typography.caption },

  postList: { gap: theme.spacing.s },
  post: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  postDate: { ...theme.typography.caption, fontSize: 11 },
  postText: { ...theme.typography.bodySmall, color: theme.colors.text, marginTop: theme.spacing.s },
  postStats: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: theme.spacing.m },
  postStat: { ...theme.typography.caption, fontSize: 11 },

  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  mediaItem: { width: '48%' },
  media: { width: '100%', aspectRatio: 1, borderRadius: theme.borderRadius.l, backgroundColor: theme.colors.surfaceLight },

  settingsSection: { marginTop: theme.spacing.xxl },
  settingsCard: {
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingsRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsRowLast: { borderBottomWidth: 0 },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  settingsCopy: { flex: 1, minWidth: 0 },
  settingsTitle: { ...theme.typography.title, fontSize: 14 },
  settingsDetail: { ...theme.typography.caption, marginTop: 2 },

  deleteRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.errorMuted,
    borderWidth: 1,
    borderColor: 'rgba(240,68,68,0.20)',
  },
  deleteCopy: { flex: 1, minWidth: 0 },
  deleteTitle: { ...theme.typography.title, fontSize: 14, color: theme.colors.error },
  deleteDetail: { ...theme.typography.caption, marginTop: 2 },
});
