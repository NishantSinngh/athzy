import { StyleSheet, Platform } from 'react-native';
import { theme } from '../../theme';

export const sportFilters = [
  'All',
  'Football',
  'Cricket',
  'Basketball',
  'Tennis',
];
export const ACCENT = theme.accents.venue;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: theme.spacing.gutter,
    paddingBottom: theme.spacing.xxl,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    height: 52,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchActive: {
    borderColor: ACCENT.soft,
    backgroundColor: theme.colors.surfaceRaised,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.font.regular,
    fontSize: 15,
    padding: 0,
  },
  cancel: {
    ...theme.typography.bodySmall,
    color: ACCENT.base,
    fontFamily: theme.font.semibold,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    marginTop: theme.spacing.l,
  },
  heading: {
    ...theme.typography.h3,
    fontSize: 16,
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  clear: {
    ...theme.typography.caption,
    color: ACCENT.base,
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

  popular: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  popularText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.font.semibold,
  },

  trending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.s,
    marginBottom: theme.spacing.s,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  trendingImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surfaceLight,
  },
  trendingCopy: { flex: 1, minWidth: 0 },
  trendingTitle: { ...theme.typography.title, fontSize: 14 },
  trendingMeta: {
    ...theme.typography.caption,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  trendingRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: theme.spacing.s,
  },
  trendingRatingText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.font.bold,
  },

  filters: { gap: theme.spacing.s, paddingVertical: theme.spacing.s },
  count: {
    ...theme.typography.h3,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },

  list: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.m },
  gridCell: { width: '47%', flexGrow: 1 },
  columnWrapper: { gap: theme.spacing.m, marginBottom: theme.spacing.m },
  skeletonBody: { padding: theme.spacing.s, gap: 6 },
  card: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
