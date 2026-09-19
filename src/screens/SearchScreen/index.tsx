import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { FilterChip } from '../../components/FilterChip';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { SkeletonRow } from '../../components/Skeleton';
import { theme, type Accent } from '../../theme';
import { formatDayBadge, formatMoney } from '../../utils/format';

type Scope = 'All' | 'Events' | 'Tournaments' | 'Venues';
const scopes: Scope[] = ['All', 'Events', 'Tournaments', 'Venues'];

type Hit =
  | { kind: 'event'; id: string; item: any }
  | { kind: 'tournament'; id: string; item: any }
  | { kind: 'venue'; id: string; item: any };

const accentFor: Record<Hit['kind'], Accent> = {
  event: theme.accents.discover,
  tournament: theme.accents.discover,
  venue: theme.accents.venue,
};

/** Recent searches live for the session only — no store to persist them yet. */
let recentMemory: string[] = [];

/**
 * One search across events, tournaments and venues.
 *
 * There is no unified search endpoint, so this pulls the three lists once on
 * mount and filters locally. That keeps typing instant and offline-tolerant;
 * the trade-off is it searches what the list endpoints return rather than the
 * whole catalogue, which is the right call until a `/search` route exists.
 */
export function SearchScreen({ navigation, route }: any) {
  const [query, setQuery] = useState(route?.params?.query ?? '');
  const [scope, setScope] = useState<Scope>('All');
  const [events, setEvents] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recents, setRecents] = useState<string[]>(recentMemory);
  const inputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [e, t, v] = await Promise.allSettled([
      BackendAPI.getEvents(),
      BackendAPI.getTournaments({ take: 50 }),
      BackendAPI.getVenues(),
    ]);
    if (e.status === 'fulfilled')
      setEvents((e.value.events || []).filter((item: any) => !item.tournament));
    if (t.status === 'fulfilled') setTournaments(t.value.tournaments || []);
    if (v.status === 'fulfilled') setVenues(v.value.venues || []);
    if (
      e.status === 'rejected' &&
      t.status === 'rejected' &&
      v.status === 'rejected'
    ) {
      setError('Search is unavailable right now.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);

  const normalized = query.trim().toLowerCase();

  const hits = useMemo<Hit[]>(() => {
    if (!normalized) return [];

    const match = (...parts: (string | undefined | null)[]) =>
      parts.filter(Boolean).join(' ').toLowerCase().includes(normalized);

    const out: Hit[] = [];
    if (scope === 'All' || scope === 'Events') {
      events
        .filter(item =>
          match(
            item.title,
            item.sport?.name,
            item.venue?.name,
            item.venue?.city,
          ),
        )
        .forEach(item => out.push({ kind: 'event', id: item.id, item }));
    }
    if (scope === 'All' || scope === 'Tournaments') {
      tournaments
        .filter(item =>
          match(
            item.title,
            item.sport?.name,
            item.format,
            item.venue?.name,
            item.venue?.city,
          ),
        )
        .forEach(item => out.push({ kind: 'tournament', id: item.id, item }));
    }
    if (scope === 'All' || scope === 'Venues') {
      venues
        .filter(item =>
          match(
            item.name,
            item.city,
            item.address,
            (item.sports || []).join(' '),
          ),
        )
        .forEach(item => out.push({ kind: 'venue', id: item.id, item }));
    }
    return out;
  }, [events, normalized, scope, tournaments, venues]);

  const counts = useMemo(
    () => ({
      All: hits.length,
      Events: hits.filter(h => h.kind === 'event').length,
      Tournaments: hits.filter(h => h.kind === 'tournament').length,
      Venues: hits.filter(h => h.kind === 'venue').length,
    }),
    [hits],
  );

  const remember = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    recentMemory = [
      trimmed,
      ...recentMemory.filter(item => item !== trimmed),
    ].slice(0, 6);
    setRecents(recentMemory);
  };

  const open = (hit: Hit) => {
    remember(query);
    if (hit.kind === 'event')
      navigation.navigate('EventDetails', { eventId: hit.id });
    else if (hit.kind === 'tournament')
      navigation.navigate('TournamentDetails', { tournamentId: hit.id });
    else navigation.navigate('VenueDetails', { venueId: hit.id });
  };

  /** Suggestions shown before the user types anything. */
  const suggestions = useMemo(() => {
    const sports = new Set<string>();
    [...events, ...tournaments].forEach(
      item => item.sport?.name && sports.add(item.sport.name),
    );
    return [...sports].slice(0, 6);
  }, [events, tournaments]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchRow}>
        <PressableScale
          style={styles.back}
          scaleTo={0.9}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close search"
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </PressableScale>

        <View style={styles.field}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => remember(query)}
            returnKeyType="search"
            placeholder="Events, tournaments, venues"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            selectionColor={theme.colors.primary}
            autoCorrect={false}
            accessibilityLabel="Search Athzy"
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
      </View>

      {normalized ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scopes}
        >
          {scopes.map(item => (
            <FilterChip
              key={item}
              accent={theme.accents.discover}
              label={item}
              count={counts[item]}
              active={scope === item}
              onPress={() => setScope(item)}
            />
          ))}
        </ScrollView>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!normalized ? (
          <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)}>
            {recents.length ? (
              <>
                <View style={styles.headingRow}>
                  <Text style={styles.heading}>Recent</Text>
                  <PressableScale
                    onPress={() => {
                      recentMemory = [];
                      setRecents([]);
                    }}
                    haptic="selection"
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear recent searches"
                  >
                    <Text style={styles.clear}>Clear</Text>
                  </PressableScale>
                </View>
                {recents.map(item => (
                  <PressableScale
                    key={item}
                    style={styles.recent}
                    scaleTo={0.99}
                    onPress={() => setQuery(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Search ${item}`}
                  >
                    <Ionicons
                      name="time-outline"
                      size={17}
                      color={theme.colors.textMuted}
                    />
                    <Text style={styles.recentText} numberOfLines={1}>
                      {item}
                    </Text>
                    <Ionicons
                      name="arrow-up-outline"
                      size={15}
                      color={theme.colors.textMuted}
                      style={styles.recentArrow}
                    />
                  </PressableScale>
                ))}
              </>
            ) : null}

            {suggestions.length ? (
              <>
                <Text style={styles.heading}>Browse by sport</Text>
                <View style={styles.suggestions}>
                  {suggestions.map(item => (
                    <PressableScale
                      key={item}
                      style={styles.suggestion}
                      scaleTo={0.94}
                      onPress={() => {
                        triggerHaptic('selection');
                        setQuery(item);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Search ${item}`}
                    >
                      <Text style={styles.suggestionText}>{item}</Text>
                    </PressableScale>
                  ))}
                </View>
              </>
            ) : null}

            {loading ? (
              <View style={styles.loadingHint}>
                <ActivityIndicator color={theme.colors.textMuted} />
              </View>
            ) : null}
          </Animated.View>
        ) : loading ? (
          <View style={styles.list}>
            {[0, 1, 2, 3].map(key => (
              <View key={key} style={styles.skeletonCard}>
                <SkeletonRow avatarSize={54} />
              </View>
            ))}
          </View>
        ) : error ? (
          <EmptyState
            icon="cloud-offline-outline"
            tone="error"
            title="Search unavailable"
            message={error}
            actionLabel="Try again"
            onAction={load}
          />
        ) : !hits.length ? (
          <EmptyState
            icon="search-outline"
            title={`No results for "${query.trim()}"`}
            message="Try a sport, a venue name, or a city."
            actionLabel="Clear search"
            onAction={() => setQuery('')}
          />
        ) : (
          <View style={styles.list}>
            {hits.map((hit, index) => (
              <Animated.View
                key={`${hit.kind}-${hit.id}`}
                entering={FadeInDown.delay(
                  Math.min(index, 8) * theme.motion.stagger,
                ).duration(theme.motion.duration.normal)}
              >
                <ResultRow hit={hit} onPress={() => open(hit)} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultRow({ hit, onPress }: { hit: Hit; onPress: () => void }) {
  const accent = accentFor[hit.kind];
  const item = hit.item;

  const isVenue = hit.kind === 'venue';
  const title = isVenue ? item.name : item.title;
  const meta = isVenue
    ? [item.city, (item.sports || []).slice(0, 2).join(' · ')]
        .filter(Boolean)
        .join(' · ')
    : [formatDayBadge(item.startsAt), item.venue?.name]
        .filter(Boolean)
        .join(' · ');
  const trailing = isVenue
    ? `${formatMoney(item.basePriceMinor, item.currency)}/hr`
    : item.registrationFeeMinor
    ? formatMoney(
        item.registrationFeeMinor + (item.serviceFeeMinor || 0),
        item.currency,
      )
    : item.paymentPolicy === 'FREE' || !item.totalFeeMinor
    ? 'Free'
    : formatMoney(item.totalFeeMinor, item.currency);

  return (
    <PressableScale
      style={styles.row}
      scaleTo={0.985}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${hit.kind}`}
    >
      <AppImage
        uri={item.imageUrl}
        fallback={
          isVenue ? 'venue' : hit.kind === 'tournament' ? 'tournament' : 'event'
        }
        style={styles.rowImage}
      />
      <View style={styles.rowCopy}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          <Badge
            label={
              hit.kind === 'tournament'
                ? 'Tournament'
                : hit.kind === 'venue'
                ? 'Venue'
                : 'Event'
            }
            tone="neutral"
            caps={false}
          />
        </View>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {meta}
        </Text>
        <Text style={[styles.rowTrailing, { color: accent.base }]}>
          {trailing}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.colors.textMuted}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
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
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    height: 48,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.font.regular,
    fontSize: 15,
    padding: 0,
  },

  scopes: {
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.gutter,
    paddingBottom: theme.spacing.m,
  },
  content: {
    paddingHorizontal: theme.spacing.gutter,
    paddingBottom: theme.spacing.xxl,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
  },
  heading: {
    ...theme.typography.h3,
    fontSize: 16,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  clear: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontFamily: theme.font.bold,
  },

  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    minHeight: 48,
  },
  recentText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    flex: 1,
  },
  recentArrow: { transform: [{ rotate: '45deg' }] },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  suggestion: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  suggestionText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.font.semibold,
  },

  loadingHint: { paddingVertical: theme.spacing.xl, alignItems: 'center' },

  list: { gap: theme.spacing.s },
  skeletonCard: {
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surfaceLight,
  },
  rowCopy: { flex: 1, minWidth: 0, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  rowTitle: { ...theme.typography.title, fontSize: 14, flexShrink: 1 },
  rowMeta: { ...theme.typography.caption },
  rowTrailing: { ...theme.typography.caption, fontFamily: theme.font.bold },
});
