import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AvatarStack } from './Avatar';
import { PressableScale } from './PressableScale';
import { theme } from '../theme';

export interface FriendGoing {
  id: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

interface FriendsGoingProps {
  friends: FriendGoing[];
  /** Total attending, when more than the avatars shown. */
  friendCount?: number;
  /** Overrides the generated sentence. */
  label?: string;
  onPress?: () => void;
  compact?: boolean;
}

/**
 * "Ana and 3 others are going" — social proof for an event.
 *
 * Renders `null` when no friends are attending. That is the whole contract:
 * this is proof, not a status field, so "none of your friends are going" is
 * noise and the section should disappear instead. Every caller can therefore
 * mount it unconditionally.
 */
export function FriendsGoing({ friends, friendCount, label, onPress, compact = false }: FriendsGoingProps) {
  if (!friends?.length) return null;

  const total = friendCount ?? friends.length;
  const firstName = (friends[0].fullName || 'A friend').split(' ')[0];
  const others = total - 1;
  const sentence =
    label ??
    (others <= 0
      ? `${firstName} is going`
      : others === 1
        ? `${firstName} and 1 other are going`
        : `${firstName} and ${others} others are going`);

  const body = (
    <View style={[styles.row, compact && styles.compact]}>
      <AvatarStack users={friends} total={total} size={compact ? 24 : 28} max={3} />
      <Text style={[styles.text, compact && styles.textCompact]} numberOfLines={1}>{sentence}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} /> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <PressableScale
      scaleTo={0.985}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sentence}
    >
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compact: { padding: theme.spacing.s, gap: theme.spacing.s, borderRadius: theme.borderRadius.m },
  text: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1 },
  textCompact: { ...theme.typography.caption, fontSize: 12 },
});
