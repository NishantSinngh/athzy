import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { theme } from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type IconName = 'home' | 'discover' | 'community' | 'chat' | 'venue' | 'ticket' | 'bell';

interface AnimatedIconProps {
  name: IconName;
  /** false = resting, true = active. Drives every per-icon animation. */
  active: boolean;
  size?: number;
  color?: string;
  activeColor?: string;
  style?: ViewStyle;
}

/**
 * Hand-drawn icon set on a 24×24 grid, animated with Reanimated.
 *
 * Each icon has its own idea of what "activating" means — the compass needle
 * swings, the chat dots ripple, the centre spot pulses — so switching tabs
 * reads as a small event rather than a colour swap. Stroke geometry is shared
 * (1.9 width, round joins) so the set holds together as one family.
 *
 * Animation is confined to what react-native-svg reliably animates: colour,
 * opacity, and numeric geometry (`r`). Anything needing a transform happens on
 * a wrapping `Animated.View`, never on an SVG node.
 */
export function AnimatedIcon({
  name,
  active,
  size = 24,
  color = theme.colors.textMuted,
  activeColor = theme.colors.text,
  style,
}: AnimatedIconProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, theme.motion.spring.gentle);
  }, [active, progress]);

  const Glyph = glyphs[name];

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size }, style]}>
      <Glyph progress={progress} size={size} color={color} activeColor={activeColor} />
    </Animated.View>
  );
}

interface GlyphProps {
  progress: SharedValue<number>;
  size: number;
  color: string;
  activeColor: string;
}

/* ------------------------------------------------------------------- home */

/** The house lifts a hair and the doorway fills in. */
function HomeGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const shell = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 0.14]),
  }));

  const door = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -1.2]) }],
  }));

  return (
    <Animated.View style={lift}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedPath
          d="M3.5 10.4 12 3.6l8.5 6.8V19a1.6 1.6 0 0 1-1.6 1.6H5.1A1.6 1.6 0 0 1 3.5 19z"
          strokeWidth={1.9}
          strokeLinejoin="round"
          animatedProps={shell}
        />
        <AnimatedPath
          d="M9.6 20.6v-5.4a2.4 2.4 0 0 1 4.8 0v5.4"
          strokeWidth={1.9}
          strokeLinejoin="round"
          animatedProps={door}
        />
      </Svg>
    </Animated.View>
  );
}

/* --------------------------------------------------------------- discover */

/** The needle swings a full turn and settles pointing north-east. */
function DiscoverGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const ring = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 0.12]),
  }));

  const needle = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const spin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 360])}deg` }],
  }));

  return (
    <Animated.View style={spin}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedCircle cx={12} cy={12} r={9} strokeWidth={1.9} animatedProps={ring} />
        <AnimatedPath
          d="M15.6 8.4 13.2 13.2 8.4 15.6l2.4-4.8z"
          strokeWidth={1.9}
          strokeLinejoin="round"
          animatedProps={needle}
        />
      </Svg>
    </Animated.View>
  );
}

/* -------------------------------------------------------------- community */

/** Two figures — the head fills first, then the companion brightens. */
function CommunityGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const head = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 0.6], [0, 1], 'clamp'),
    r: interpolate(progress.value, [0, 0.5, 1], [3.4, 3.7, 3.4]),
  }));

  const body = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
  }));

  const companion = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    opacity: interpolate(progress.value, [0, 0.4, 1], [0.7, 0.8, 1], 'clamp'),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedCircle cx={9.2} cy={8} strokeWidth={1.9} animatedProps={head} />
      <AnimatedPath
        d="M2.8 20.2a6.4 6.4 0 0 1 12.8 0"
        strokeWidth={1.9}
        strokeLinecap="round"
        animatedProps={body}
      />
      <AnimatedPath
        d="M16.4 5.2a3.4 3.4 0 0 1 0 6.6M18 14.4a6.4 6.4 0 0 1 3.2 5.8"
        strokeWidth={1.9}
        strokeLinecap="round"
        animatedProps={companion}
      />
    </Svg>
  );
}

/* ------------------------------------------------------------------- chat */

/** Bubble fills, and the three dots ripple left to right. */
function ChatGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const bubble = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 0.16]),
  }));

  // Three explicit hooks rather than a loop — hook order has to stay fixed.
  const dotOne = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    r: interpolate(progress.value, [0, 0.3, 0.6], [1.05, 1.5, 1.15], 'clamp'),
  }));
  const dotTwo = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    r: interpolate(progress.value, [0.2, 0.5, 0.8], [1.05, 1.5, 1.15], 'clamp'),
  }));
  const dotThree = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    r: interpolate(progress.value, [0.4, 0.7, 1], [1.05, 1.5, 1.15], 'clamp'),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedPath
        d="M4.4 5.4h15.2a1.6 1.6 0 0 1 1.6 1.6v8.2a1.6 1.6 0 0 1-1.6 1.6H9.6L4.4 21z"
        strokeWidth={1.9}
        strokeLinejoin="round"
        animatedProps={bubble}
      />
      <AnimatedCircle cx={8.6} cy={11.1} animatedProps={dotOne} />
      <AnimatedCircle cx={12} cy={11.1} animatedProps={dotTwo} />
      <AnimatedCircle cx={15.4} cy={11.1} animatedProps={dotThree} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ venue */

/** A pitch from above: the turf lights up and the centre spot pulses. */
function VenueGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const turf = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 0.14]),
  }));

  const markings = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
  }));

  const spot = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    r: interpolate(progress.value, [0, 0.5, 1], [0.7, 1.5, 1]),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedRect x={2.6} y={4.6} width={18.8} height={14.8} rx={2.6} strokeWidth={1.9} animatedProps={turf} />
      <AnimatedPath d="M12 4.6v14.8" strokeWidth={1.9} strokeLinecap="round" animatedProps={markings} />
      <AnimatedCircle cx={12} cy={12} r={2.5} strokeWidth={1.9} fill="none" animatedProps={markings} />
      <AnimatedCircle cx={12} cy={12} animatedProps={spot} />
    </Svg>
  );
}

/* ----------------------------------------------------------------- ticket */

/** Stub with a perforated fold; it tilts as it activates. */
function TicketGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const body = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 0.16]),
  }));

  const perforation = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
  }));

  const tilt = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, -8])}deg` }],
  }));

  return (
    <Animated.View style={tilt}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedPath
          d="M3.4 7.6a1.6 1.6 0 0 1 1.6-1.6h14a1.6 1.6 0 0 1 1.6 1.6v2a2.4 2.4 0 0 0 0 4.8v2a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6v-2a2.4 2.4 0 0 0 0-4.8z"
          strokeWidth={1.9}
          strokeLinejoin="round"
          animatedProps={body}
        />
        <AnimatedPath
          d="M14.4 6.6v10.8"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeDasharray="1.6 1.9"
          animatedProps={perforation}
        />
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------- bell */

/** Rings: the whole bell rocks once when it turns active. */
function BellGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const body = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 0.16]),
  }));

  const clapper = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
  }));

  const swing = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 0.4, 0.7, 1], [0, 12, -8, 0])}deg` }],
  }));

  return (
    <Animated.View style={swing}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedPath
          d="M12 3.2a6 6 0 0 1 6 6v3.4l1.6 3.2H4.4L6 12.6V9.2a6 6 0 0 1 6-6z"
          strokeWidth={1.9}
          strokeLinejoin="round"
          animatedProps={body}
        />
        <AnimatedPath
          d="M9.8 18.4a2.3 2.3 0 0 0 4.4 0"
          strokeWidth={1.9}
          strokeLinecap="round"
          animatedProps={clapper}
        />
      </Svg>
    </Animated.View>
  );
}

const glyphs: Record<IconName, React.ComponentType<GlyphProps>> = {
  home: HomeGlyph,
  discover: DiscoverGlyph,
  community: CommunityGlyph,
  chat: ChatGlyph,
  venue: VenueGlyph,
  ticket: TicketGlyph,
  bell: BellGlyph,
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
