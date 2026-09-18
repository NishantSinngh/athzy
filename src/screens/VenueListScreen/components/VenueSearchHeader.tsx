import React, { useCallback } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { FilterChip } from '../../../components/FilterChip';
import { PressableScale } from '../../../components/PressableScale';
import { theme } from '../../../theme';
import { ACCENT, sportFilters, styles } from '../styles';
import { TrendingVenueRow } from './VenueCards';

export const VenueSearchHeader = React.memo(
  ({
    query,
    setQuery,
    searching,
    setSearching,
    submitSearch,
    recentSearches,
    clearRecentSearches,
    filter,
    setFilter,
    visibleVenues,
    onVenuePress,
  }: any) => {
    const handleCancelSearch = useCallback(() => {
      setSearching(false);
      setQuery('');
    }, [setSearching, setQuery]);

    const handleClearQuery = useCallback(() => {
      setQuery('');
    }, [setQuery]);

    const handleRecentPress = useCallback(
      (item: string) => {
        setQuery(item);
        setSearching(false);
      },
      [setQuery, setSearching],
    );

    const handlePopularPress = useCallback(
      (item: string) => {
        setFilter(item);
        setQuery(item);
        setSearching(false);
      },
      [setFilter, setQuery, setSearching],
    );

    return (
      <>
        <View style={styles.searchRow}>
          <View style={[styles.search, searching && styles.searchActive]}>
            <Ionicons
              name="search"
              size={19}
              color={searching ? ACCENT.base : theme.colors.textMuted}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearching(true)}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              placeholder="Search venues or cities"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.searchInput}
              selectionColor={theme.colors.primary}
              accessibilityLabel="Search venues"
            />
            {query ? (
              <PressableScale
                onPress={handleClearQuery}
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
          {searching ? (
            <PressableScale
              onPress={handleCancelSearch}
              haptic="selection"
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
            >
              <Text style={styles.cancel}>Cancel</Text>
            </PressableScale>
          ) : null}
        </View>

        {searching ? (
          <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)}>
            {recentSearches.length ? (
              <>
                <View style={styles.headingRow}>
                  <Text style={styles.heading}>Recent searches</Text>
                  <PressableScale
                    onPress={clearRecentSearches}
                    haptic="selection"
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear recent searches"
                  >
                    <Text style={styles.clear}>Clear all</Text>
                  </PressableScale>
                </View>
                {recentSearches.map((item: string) => (
                  <PressableScale
                    key={item}
                    style={styles.recent}
                    scaleTo={0.99}
                    onPress={() => handleRecentPress(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Search ${item}`}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={theme.colors.textMuted}
                    />
                    <Text style={styles.recentText}>{item}</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={15}
                      color={theme.colors.textMuted}
                    />
                  </PressableScale>
                ))}
              </>
            ) : null}

            <Text style={styles.heading}>Popular sports</Text>
            <View style={styles.popular}>
              {sportFilters.slice(1).map((item: string) => (
                <PressableScale
                  key={item}
                  style={styles.popularChip}
                  scaleTo={0.94}
                  onPress={() => handlePopularPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${item} venues`}
                >
                  <Ionicons
                    name="football-outline"
                    size={15}
                    color={ACCENT.base}
                  />
                  <Text style={styles.popularText}>{item}</Text>
                </PressableScale>
              ))}
            </View>

            {visibleVenues.length ? (
              <>
                <Text style={styles.heading}>Top rated</Text>
                {visibleVenues.slice(0, 4).map((venue: any) => (
                  <TrendingVenueRow
                    key={venue.id}
                    venue={venue}
                    onPress={onVenuePress}
                  />
                ))}
              </>
            ) : null}
          </Animated.View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {sportFilters.map(item => (
                <FilterChip
                  key={item}
                  accent={ACCENT}
                  label={item}
                  active={filter === item}
                  onPress={() => setFilter(item)}
                />
              ))}
            </ScrollView>

            <Text style={styles.count}>Venues</Text>
          </>
        )}
      </>
    );
  },
);
