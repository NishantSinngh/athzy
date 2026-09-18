import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { theme } from '../theme';

interface SectionHeaderProps {
  title: string;
  /** Small uppercase kicker above the title. */
  eyebrow?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Title + optional "View All" row used between every home/profile section.
 * The action is a real 44px target rather than bare text, which it was before.
 */
export function SectionHeader({ title, eyebrow, subtitle, actionLabel, onAction, style }: SectionHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <PressableScale
          style={styles.action}
          onPress={onAction}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}, ${title}`}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={15} color={theme.colors.textSecondary} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
    gap: theme.spacing.m,
  },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { ...theme.typography.label, color: theme.colors.textMuted, marginBottom: 5 },
  title: { ...theme.typography.h3 },
  subtitle: { ...theme.typography.caption, marginTop: 4 },
  action: {
    minHeight: theme.hitTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingLeft: theme.spacing.s,
  },
  actionText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontFamily: theme.font.bold },
});
