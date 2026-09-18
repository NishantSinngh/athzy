import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AppImage } from './AppImage';
import { theme } from '../theme';

/** Deterministic initials so a user without a photo still gets a stable mark. */
function initialsOf(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  /** Squircle by default, matching the cards; pass true for chat/DM contexts. */
  circle?: boolean;
  /** Green ring — use for the signed-in user or a live participant. */
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ uri, name, size = 44, circle = false, ring = false, style }: AvatarProps) {
  const radius = circle ? size / 2 : Math.round(size * 0.32);
  const shape = { width: size, height: size, borderRadius: radius };

  return (
    <View style={[shape, ring && styles.ring, style]}>
      {/* Initials sit behind the photo, so a failed load degrades to them
          instead of leaving a hole. There is no stock-photo fallback: showing
          a stranger's face in place of a missing avatar is worse than nothing. */}
      <View style={[shape, styles.initials, StyleSheet.absoluteFill]}>
        <Text style={[styles.initialsText, { fontSize: Math.max(12, Math.round(size * 0.36)) }]}>
          {initialsOf(name)}
        </Text>
      </View>
      {uri ? (
        <AppImage uri={uri} fallback="avatar" style={shape} accessibilityLabel={name ? `${name}'s photo` : undefined} />
      ) : null}
    </View>
  );
}

interface AvatarStackProps {
  users: { avatarUrl?: string | null; fullName?: string | null }[];
  size?: number;
  max?: number;
  /** Total count, when it exceeds what's shown (e.g. "+42"). */
  total?: number;
}

/**
 * Overlapping attendee faces with a "+N" cap — the social-proof cue the home
 * and event mockups lead with.
 */
export function AvatarStack({ users, size = 30, max = 3, total }: AvatarStackProps) {
  const shown = users.slice(0, max);
  const remainder = (total ?? users.length) - shown.length;

  return (
    <View style={styles.stack}>
      {shown.map((user, index) => (
        <Avatar
          key={index}
          uri={user.avatarUrl}
          name={user.fullName}
          size={size}
          circle
          style={[styles.stacked, { marginLeft: index === 0 ? 0 : -size * 0.34, zIndex: max - index }]}
        />
      ))}
      {remainder > 0 ? (
        <View
          style={[
            styles.stacked,
            styles.remainder,
            { width: size, height: size, borderRadius: size / 2, marginLeft: shown.length ? -size * 0.34 : 0 },
          ]}
        >
          <Text style={styles.remainderText}>+{remainder > 99 ? '99' : remainder}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2, borderColor: theme.colors.primarySoft },
  initials: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  initialsText: { color: theme.colors.textSecondary, fontFamily: theme.font.bold },
  stack: { flexDirection: 'row', alignItems: 'center' },
  stacked: { borderWidth: 2, borderColor: theme.colors.background },
  remainder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  remainderText: { color: theme.colors.text, fontFamily: theme.font.bold, fontSize: 11 },
});
