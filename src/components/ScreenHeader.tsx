import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { theme } from '../theme';

interface ScreenHeaderProps {
  navigation: any;
  title?: string;
  subtitle?: string;
  /** Node rendered on the trailing side (share, filter, etc). */
  right?: React.ReactNode;
  /** Hairline under the header — use when content scrolls beneath it. */
  bordered?: boolean;
  onBack?: () => void;
  /** Hide the back button when the screen is the root of a tab. */
  showBack?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Back button + title row shared by every pushed screen. */
export const ScreenHeader = ({
  navigation,
  title,
  subtitle,
  right,
  bordered,
  onBack,
  showBack = true,
  style,
}: ScreenHeaderProps) => (
  <View style={[styles.header, bordered && styles.bordered, style]}>
    {showBack ? (
      <PressableScale
        style={styles.back}
        scaleTo={0.9}
        onPress={onBack ?? (() => navigation.goBack())}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
      </PressableScale>
    ) : null}

    <View style={[styles.copy, !showBack && styles.copyFlush]}>
      {title ? <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </View>

    <View style={styles.right}>{right}</View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    gap: theme.spacing.m,
  },
  bordered: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  copy: { flex: 1, minWidth: 0 },
  /** Tab roots have no back button, so the title owns the leading edge. */
  copyFlush: { marginLeft: 4 },
  title: { ...theme.typography.h3 },
  subtitle: { ...theme.typography.caption, marginTop: 2 },
  right: { minWidth: theme.hitTarget, alignItems: 'flex-end' },
});
