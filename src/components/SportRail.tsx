import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PressableScale, triggerHaptic } from './PressableScale';
import { SportIcon, sportIconFor } from './SportIcon';
import { theme, type Accent } from '../theme';

export interface SportOption {
  id: string;
  name: string;
  slug?: string;
}

interface SportRailProps {
  sports: SportOption[];
  /** `undefined` means "all sports". */
  selected?: string;
  onSelect: (name?: string) => void;
  accent: Accent;
}

/**
 * Circular sport picker from the Discover design. Each disc carries a bespoke
 * animated glyph rather than a generic pictogram, so the row is scannable by
 * shape alone and selecting one is a small event.
 */
export function SportRail({ sports, selected, onSelect, accent }: SportRailProps) {
  const options: SportOption[] = [{ id: '__all', name: 'All' }, ...sports];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {options.map((sport) => {
        const isAll = sport.id === '__all';
        const active = isAll ? !selected : selected === sport.name;

        return (
          <PressableScale
            key={sport.id}
            style={styles.item}
            scaleTo={0.92}
            haptic="none"
            onPress={() => { triggerHaptic('selection'); onSelect(isAll ? undefined : sport.name); }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={isAll ? 'All sports' : sport.name}
          >
            <View style={[styles.disc, active && { borderColor: accent.base, backgroundColor: accent.muted }]}>
              <SportIcon
                name={isAll ? 'all' : sportIconFor(sport.slug || sport.name)}
                active={active}
                size={24}
                color={theme.colors.textSecondary}
                activeColor={accent.base}
              />
            </View>
            <Text
              style={[styles.label, active && { color: accent.base, fontFamily: theme.font.bold }]}
              numberOfLines={1}
            >
              {sport.name}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: { gap: theme.spacing.m, paddingHorizontal: theme.spacing.gutter, paddingVertical: theme.spacing.s },
  item: { width: 64, alignItems: 'center', gap: 7 },
  disc: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  label: { ...theme.typography.caption, fontSize: 11, textAlign: 'center' },
});
