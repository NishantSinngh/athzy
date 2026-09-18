import { Platform, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export type DiscoverTab = 'EVENTS' | 'TOURNAMENTS';
export type DateFilter = 'All dates' | 'Today' | 'Tomorrow' | 'This weekend';

export const dateFilters: DateFilter[] = [
  'All dates',
  'Today',
  'Tomorrow',
  'This weekend',
];

/** Discover owns amber — scheduled, anticipatory. */
export const ACCENT = theme.accents.discover;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.s,
  },

  title: { ...theme.typography.h1 },
  subtitle: {
    ...theme.typography.bodySmall,
    marginTop: 5,
    marginBottom: theme.spacing.l,
  },

  segments: {
    flexDirection: 'row',
    height: 52,
    padding: 5,
    gap: 5,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.m,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: theme.borderRadius.m,
  },
  segmentActive: {
    backgroundColor: ACCENT.muted,
    borderWidth: 1,
    borderColor: ACCENT.soft,
  },
  segmentText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontFamily: theme.font.semibold,
    fontSize: 13,
  },
  segmentTextActive: { color: ACCENT.base, fontFamily: theme.font.bold },

  search: {
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
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.font.regular,
    fontSize: 15,
    padding: 0,
  },

  chips: { gap: theme.spacing.s, paddingVertical: theme.spacing.s },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  resultTitle: { ...theme.typography.h3, flexShrink: 1 },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: theme.spacing.s,
  },
  clearText: {
    ...theme.typography.caption,
    color: ACCENT.base,
    fontFamily: theme.font.bold,
  },

  list: { gap: theme.spacing.m },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.m },
  blockHeading: {
    ...theme.typography.h3,
    fontSize: 17,
    marginBottom: theme.spacing.m,
  },

  featured: {
    height: 260,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredTop: {
    position: 'absolute',
    top: theme.spacing.m,
    left: theme.spacing.m,
  },
  featuredFlag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: ACCENT.base,
  },
  featuredFlagText: {
    ...theme.typography.caption,
    fontSize: 10,
    color: ACCENT.on,
    fontFamily: theme.font.extrabold,
    letterSpacing: 0.6,
  },
  featuredBody: { padding: theme.spacing.m },
  featuredTitle: { ...theme.typography.h3, fontSize: 21 },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: theme.spacing.s,
  },
  featuredMetaText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    flexShrink: 1,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    marginTop: theme.spacing.m,
  },
  featuredEntrants: { flexShrink: 1 },
  featuredCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredCountText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontFamily: theme.font.semibold,
  },
  featuredCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primary,
  },
  featuredCtaText: { ...theme.typography.button, fontSize: 14 },

  gameList: { gap: theme.spacing.s },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gameThumb: {
    width: 54,
    height: 54,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surfaceLight,
  },
  gameCopy: { flex: 1, minWidth: 0, gap: 2 },
  gameTitle: { ...theme.typography.title, fontSize: 14 },
  gameSport: {
    ...theme.typography.caption,
    fontSize: 11,
    letterSpacing: 0.6,
    color: theme.colors.textMuted,
  },
  gameWhen: { ...theme.typography.caption, fontSize: 11 },
  gamePill: {
    maxWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.surfaceLight,
  },
  gamePillOpen: { backgroundColor: theme.colors.primaryMuted },
  gamePillWarn: { backgroundColor: ACCENT.muted },
  gamePillText: {
    ...theme.typography.caption,
    fontSize: 11,
    fontFamily: theme.font.bold,
    color: theme.colors.textSecondary,
  },
  gamePillTextOpen: { color: theme.colors.primary },
  gamePillTextWarn: { color: ACCENT.base },

  skeletonCard: {
    flex: 1,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skeletonBody: { padding: theme.spacing.s, gap: 6 },
  gridCell: { width: '47%', flexGrow: 1 },
  columnWrapper: { gap: theme.spacing.m, marginBottom: theme.spacing.m },

  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: theme.spacing.m,
  },
  inlineErrorText: { ...theme.typography.caption, color: theme.colors.warning },
});
