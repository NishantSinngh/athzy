/**
 * Athzy design tokens.
 *
 * Mirrors `my_assets/UI Kit Foundation.png`. Every value a screen needs should
 * come from here — raw fontSize/color/radius literals in screens are the reason
 * the app drifted out of sync with the kit.
 */

const font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

const colors = {
  background: '#0A0A0A',
  surface: '#151515',
  surfaceRaised: '#1C1C1C',
  surfaceLight: '#262626',
  /** Pressed/hover wash for surfaces. */
  surfaceHover: '#2E2E2E',

  primary: '#45F06A',
  primaryHover: '#3BE05A',
  primaryPressed: '#2FC94B',
  primaryMuted: 'rgba(69, 240, 106, 0.10)',
  primarySoft: 'rgba(69, 240, 106, 0.18)',
  /** For text/icons sitting on top of `primary`. */
  onPrimary: '#0A0A0A',

  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#71717A',
  /** Lowest-emphasis text; use sparingly. */
  textFaint: '#52525B',

  border: '#262626',
  borderSoft: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',

  error: '#F04444',
  errorMuted: 'rgba(240,68,68,0.10)',
  warning: '#FB923C',
  warningMuted: 'rgba(251,146,60,0.12)',
  info: '#3B82F6',
  infoMuted: 'rgba(59,130,246,0.12)',
  success: '#45F06A',
  successMuted: 'rgba(69,240,106,0.10)',

  /** Scrim behind modals and bottom sheets. */
  scrim: 'rgba(0,0,0,0.72)',
  /** Wash over hero imagery so white text stays legible. */
  imageShade: 'rgba(10,10,10,0.55)',
} as const;

/**
 * Per-section accents.
 *
 * Athzy does four unrelated jobs — find a game, book a court, talk to your
 * team, hang out with the community — and one green for all of them made every
 * screen look the same. Each section gets a hue it owns, used only for
 * selection states, eyebrows and section chrome.
 *
 * Green stays the app-wide *action* colour: primary buttons and prices are
 * green on every screen regardless of section, so "this is the thing that
 * commits me" never moves.
 */
const accents = {
  /** Discover — events and tournaments. Amber: scheduled, anticipatory. */
  discover: {
    base: '#FFB020',
    muted: 'rgba(255,176,32,0.10)',
    soft: 'rgba(255,176,32,0.20)',
    on: '#0A0A0A',
  },
  /** Venues — courts and grounds. Cyan: spatial, map-like, "book a slot". */
  venue: {
    base: '#38BDF8',
    muted: 'rgba(56,189,248,0.10)',
    soft: 'rgba(56,189,248,0.20)',
    on: '#0A0A0A',
  },
  /** Community — posts and people. Violet: social, expressive. */
  community: {
    base: '#A78BFA',
    muted: 'rgba(167,139,250,0.10)',
    soft: 'rgba(167,139,250,0.20)',
    on: '#0A0A0A',
  },
  /** Chat — event channels and DMs. Green, because chat is where the app's
   *  core promise lives; keeping it on-brand ties the loop back to Athzy. */
  chat: {
    base: '#45F06A',
    muted: 'rgba(69,240,106,0.10)',
    soft: 'rgba(69,240,106,0.18)',
    on: '#0A0A0A',
  },
} as const;

export type AccentName = keyof typeof accents;
export type Accent = (typeof accents)[AccentName];

/** Gradient stop pairs, ready to spread into `<LinearGradient colors={...} />`. */
const gradients = {
  brandFade: ['rgba(69,240,106,0.20)', 'rgba(69,240,106,0)'] as const,
  surfaceFade: ['#1C1C1C', 'rgba(28,28,28,0)'] as const,
  /** Bottom-up scrim for text over photos. */
  imageScrim: ['transparent', 'rgba(10,10,10,0.35)', 'rgba(10,10,10,0.94)'] as const,
  /** Top-down scrim so back/share buttons stay visible over photos. */
  imageScrimTop: ['rgba(10,10,10,0.75)', 'transparent'] as const,
};

const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  /** Screen gutter — use instead of hand-picked 20/22 paddings. */
  gutter: 20,
} as const;

const borderRadius = {
  xs: 6,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  round: 9999,
} as const;

/**
 * Dark UI reads depth from luminance, not drop shadows, so elevation pairs a
 * lifted surface colour with a soft shadow rather than relying on either alone.
 */
const elevation = {
  none: {},
  low: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  high: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  /** Green bloom under primary CTAs. */
  glow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
} as const;

/**
 * Shared motion vocabulary. Durations are milliseconds; `spring` configs feed
 * Reanimated's `withSpring` so press feedback is consistent app-wide.
 */
const motion = {
  duration: {
    instant: 120,
    fast: 180,
    normal: 260,
    slow: 420,
  },
  /** Per-item delay for staggered list entrances. */
  stagger: 55,
  spring: {
    press: { damping: 18, stiffness: 420, mass: 0.6 },
    gentle: { damping: 20, stiffness: 180, mass: 1 },
    bouncy: { damping: 12, stiffness: 220, mass: 0.8 },
  },
  /** Scale a card/button settles to while held. */
  pressScale: 0.97,
} as const;

/**
 * Type scale from the UI kit. Body text bottoms out at 13px and labels at 11px —
 * anything smaller was the main reason the built app looked shrunken next to the
 * mockups, and sub-12px text is unreadable for a lot of people.
 */
const typography = {
  display: {
    fontFamily: font.extrabold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.2,
    color: colors.text,
  },
  h1: {
    fontFamily: font.extrabold,
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -0.8,
    color: colors.text,
  },
  h2: {
    fontFamily: font.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: colors.text,
  },
  h3: {
    fontFamily: font.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: colors.text,
  },
  /** Card and row titles. */
  title: {
    fontFamily: font.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
    color: colors.text,
  },
  /** Lead paragraphs and event descriptions. */
  bodyLarge: {
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  /** Supporting metadata under a title. */
  bodySmall: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  /** Timestamps, counts, helper text. Smallest body-weight token. */
  caption: {
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  /** Uppercase eyebrows and section kickers. */
  label: {
    fontFamily: font.bold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  /** Pill/badge text. Never goes below 11. */
  badge: {
    fontFamily: font.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    color: colors.text,
  },
  button: {
    fontFamily: font.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.onPrimary,
  },
  /** Tabular figures for scores, prices, countdowns. */
  numeric: {
    fontFamily: font.extrabold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.5,
    color: colors.text,
  },
} as const;

/** Minimum comfortable tap target (both platforms' HIG floor). */
const hitTarget = 44;

export const theme = {
  font,
  colors,
  accents,
  gradients,
  spacing,
  borderRadius,
  elevation,
  motion,
  typography,
  hitTarget,
};

export type Theme = typeof theme;
