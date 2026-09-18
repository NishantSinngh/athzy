import React, { useCallback } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterChip } from '../../../components/FilterChip';
import { SportRail } from '../../../components/SportRail';
import {
  PressableScale,
  triggerHaptic,
} from '../../../components/PressableScale';
import { theme } from '../../../theme';
import {
  ACCENT,
  styles,
  dateFilters,
  DiscoverTab,
  DateFilter,
} from '../styles';

interface DiscoverHeaderProps {
  tab: DiscoverTab;
  setTab: (tab: DiscoverTab) => void;
  query: string;
  setQuery: (query: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  sport: string;
  setSport: (sport: string) => void;
  sports: string[];
  filtersActive: boolean;
  clearFilters: () => void;
}

export const DiscoverHeader = React.memo(
  ({
    tab,
    setTab,
    query,
    setQuery,
    dateFilter,
    setDateFilter,
    sport,
    setSport,
    sports,
    filtersActive,
    clearFilters,
  }: DiscoverHeaderProps) => {
    const handleTabPress = useCallback(
      (item: DiscoverTab) => {
        triggerHaptic('selection');
        setTab(item);
      },
      [setTab],
    );

    const handleDatePress = useCallback(
      (item: DateFilter) => {
        triggerHaptic('selection');
        setDateFilter(item);
      },
      [setDateFilter],
    );

    return (
      <>
        <Text style={styles.title} accessibilityRole="header">
          Discover
        </Text>
        <Text style={styles.subtitle}>
          Find games, leagues and tournaments near you
        </Text>

        <View style={styles.segments}>
          {(['EVENTS', 'TOURNAMENTS'] as DiscoverTab[]).map(item => {
            const active = tab === item;
            return (
              <PressableScale
                key={item}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => handleTabPress(item)}
                haptic="none"
                scaleTo={0.97}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={
                  item === 'EVENTS' ? 'Events' : 'Tournaments'
                }
              >
                <Ionicons
                  name={
                    item === 'EVENTS' ? 'calendar-outline' : 'trophy-outline'
                  }
                  size={17}
                  color={active ? ACCENT.base : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    active && styles.segmentTextActive,
                  ]}
                >
                  {item === 'EVENTS' ? 'Events' : 'Tournaments'}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.search}>
          <Ionicons name="search" size={19} color={theme.colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={
              tab === 'EVENTS'
                ? 'Search events, sports or venues'
                : 'Search tournaments or formats'
            }
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
            selectionColor={theme.colors.primary}
            accessibilityLabel="Search"
          />
          {query ? (
            <PressableScale
              onPress={() => setQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={theme.colors.textMuted}
              />
            </PressableScale>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {dateFilters.map(item => (
            <FilterChip
              key={item}
              accent={ACCENT}
              label={item}
              active={dateFilter === item}
              onPress={() => handleDatePress(item)}
            />
          ))}
        </ScrollView>

        <SportRail
          accent={ACCENT}
          sports={sports
            .filter(item => item !== 'All sports')
            .map(item => ({ id: item, name: item, slug: item }))}
          selected={sport === 'All sports' ? undefined : sport}
          onSelect={name => setSport(name ?? 'All sports')}
        />

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            {tab === 'EVENTS' ? 'Events' : 'Tournaments'}
          </Text>
          {filtersActive ? (
            <PressableScale
              style={styles.clear}
              onPress={clearFilters}
              haptic="none"
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <Ionicons name="close" size={13} color={ACCENT.base} />
              <Text style={styles.clearText}>Clear filters</Text>
            </PressableScale>
          ) : null}
        </View>
      </>
    );
  },
);
