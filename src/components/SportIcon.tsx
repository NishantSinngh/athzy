import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
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
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type SportIconName =
  | 'all'
  | 'football'
  | 'cricket'
  | 'basketball'
  | 'tennis'
  | 'badminton'
  | 'volleyball'
  | 'running'
  | 'swimming'
  | 'cycling'
  | 'golf'
  | 'generic';

interface SportIconProps {
  name: SportIconName;
  active: boolean;
  size?: number;
  color?: string;
  activeColor?: string;
  style?: ViewStyle;
}

/**
 * Sport glyphs drawn on a 24×24 grid to match `AnimatedIcon`.
 *
 * Each one animates on selection with a motion drawn from the sport itself —
 * the ball spins, the racket swings, the swimmer's wave rolls. Same rule as the
 * tab icons: transforms live on a wrapping view, and only colour, opacity and
 * numeric geometry are animated on SVG nodes.
 */
export function SportIcon({
  name,
  active,
  size = 24,
  color = theme.colors.textSecondary,
  activeColor = theme.colors.text,
  style,
}: SportIconProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, theme.motion.spring.gentle);
  }, [active, progress]);

  const Glyph = glyphs[name] ?? glyphs.generic;

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

/** Shared: stroke tint that blends toward the active colour. */
function useStroke(progress: SharedValue<number>, color: string, activeColor: string) {
  return useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
  }));
}

/** Shared: stroke plus a light fill wash once active. */
function useFilled(progress: SharedValue<number>, color: string, activeColor: string, to = 0.14) {
  return useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, to]),
  }));
}

/* --------------------------------------------------------------------- all */

/** Four tiles that fan out slightly — the "everything" option. */
function AllGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const box = useFilled(progress, color, activeColor);
  const spread = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  return (
    <Animated.View style={spread}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedRect x={3.4} y={3.4} width={7.4} height={7.4} rx={2.2} strokeWidth={1.9} animatedProps={box} />
        <AnimatedRect x={13.2} y={3.4} width={7.4} height={7.4} rx={2.2} strokeWidth={1.9} animatedProps={box} />
        <AnimatedRect x={3.4} y={13.2} width={7.4} height={7.4} rx={2.2} strokeWidth={1.9} animatedProps={box} />
        <AnimatedRect x={13.2} y={13.2} width={7.4} height={7.4} rx={2.2} strokeWidth={1.9} animatedProps={box} />
      </Svg>
    </Animated.View>
  );
}

/* ---------------------------------------------------------------- football */

/** The ball rolls a half turn and its panel darkens. */
function FootballGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const ball = useFilled(progress, color, activeColor, 0.12);
  const panel = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 0.9]),
  }));
  const roll = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <Animated.View style={roll}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedCircle cx={12} cy={12} r={8.8} strokeWidth={1.9} animatedProps={ball} />
        <AnimatedPath
          d="M12 7.2l3.4 2.5-1.3 4h-4.2l-1.3-4z"
          strokeWidth={1.6}
          strokeLinejoin="round"
          animatedProps={panel}
        />
        <AnimatedPath
          d="M12 3.2v4M20.4 9.7l-3.9 2.8M17.6 19.4l-1.5-4.3M6.4 19.4l1.5-4.3M3.6 9.7l3.9 2.8"
          strokeWidth={1.5}
          strokeLinecap="round"
          animatedProps={ball}
        />
      </Svg>
    </Animated.View>
  );
}

/* ----------------------------------------------------------------- cricket */

/** Bat swings through as the ball lights up. */
function CricketGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const bat = useFilled(progress, color, activeColor, 0.4);
  const stroke = useStroke(progress, color, activeColor);
  const ball = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    r: interpolate(progress.value, [0, 0.5, 1], [2, 2.6, 2.2]),
  }));
  const swing = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, -18])}deg` }],
  }));

  return (
    <Animated.View style={swing}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedRect
          x={12.6}
          y={3.2}
          width={6.2}
          height={11.4}
          rx={3.1}
          strokeWidth={1.9}
          transform="rotate(22 15.7 8.9)"
          animatedProps={bat}
        />
        <AnimatedPath d="M11.4 15.2l-3.6 5.2" strokeWidth={2} strokeLinecap="round" animatedProps={stroke} />
        <AnimatedCircle cx={5.4} cy={14.6} animatedProps={ball} />
      </Svg>
    </Animated.View>
  );
}

/* -------------------------------------------------------------- basketball */

/** Ball spins; the seams stay put so the rotation reads. */
function BasketballGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const ball = useFilled(progress, color, activeColor, 0.12);
  const seams = useStroke(progress, color, activeColor);
  const spin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 200])}deg` }],
  }));

  return (
    <Animated.View style={spin}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedCircle cx={12} cy={12} r={8.8} strokeWidth={1.9} animatedProps={ball} />
        <AnimatedPath
          d="M12 3.2v17.6M3.2 12h17.6M5.8 5.8c3.4 3.4 3.4 9 0 12.4M18.2 5.8c-3.4 3.4-3.4 9 0 12.4"
          strokeWidth={1.5}
          strokeLinecap="round"
          animatedProps={seams}
        />
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------- tennis / badminton */

/** Racket swings and the ball pops. */
function RacketGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const head = useFilled(progress, color, activeColor, 0.16);
  const stroke = useStroke(progress, color, activeColor);
  const ball = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    r: interpolate(progress.value, [0, 0.5, 1], [1.6, 2.3, 1.9]),
  }));
  const swing = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 24])}deg` }],
  }));

  return (
    <Animated.View style={swing}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedEllipse cx={13.4} cy={8.4} rx={5.6} ry={6.4} strokeWidth={1.9} animatedProps={head} />
        <AnimatedPath d="M9.7 13.4L5.4 20.2" strokeWidth={2} strokeLinecap="round" animatedProps={stroke} />
        <AnimatedCircle cx={4.6} cy={7.6} animatedProps={ball} />
      </Svg>
    </Animated.View>
  );
}

/* -------------------------------------------------------------- volleyball */

/** Ball with curved seams, rocking as it activates. */
function VolleyballGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const ball = useFilled(progress, color, activeColor, 0.12);
  const seams = useStroke(progress, color, activeColor);
  const rock = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 0.5, 1], [0, -20, -140])}deg` }],
  }));

  return (
    <Animated.View style={rock}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedCircle cx={12} cy={12} r={8.8} strokeWidth={1.9} animatedProps={ball} />
        <AnimatedPath
          d="M12 3.2c-3 4.4-3 12.2 0 17.6M20.6 9.6c-5 1.4-11.2 4.6-14 9.4M3.4 9.6c5 1.4 11.2 4.6 14 9.4"
          strokeWidth={1.5}
          strokeLinecap="round"
          animatedProps={seams}
        />
      </Svg>
    </Animated.View>
  );
}

/* ----------------------------------------------------------------- running */

/** Runner leans forward and the motion trail brightens. */
function RunningGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const body = useStroke(progress, color, activeColor);
  const head = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [color, activeColor]),
  }));
  const trail = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    opacity: interpolate(progress.value, [0, 1], [0.35, 1]),
  }));
  const lean = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, 1.2]) }],
  }));

  return (
    <Animated.View style={lean}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedCircle cx={15.4} cy={4.8} r={2.2} animatedProps={head} />
        <AnimatedPath
          d="M16.6 9.2l-4 2.2 1.6 3.6-2.8 5.4M14.2 11.4l3.8 2.4.9 4.4M12.6 9.6L8.4 11"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={body}
        />
        <AnimatedPath d="M2.6 9.4h3.6M2.2 13.4h3" strokeWidth={1.6} strokeLinecap="round" animatedProps={trail} />
      </Svg>
    </Animated.View>
  );
}

/* ---------------------------------------------------------------- swimming */

/** The waves roll sideways while the swimmer holds position. */
function SwimmingGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const body = useStroke(progress, color, activeColor);
  const head = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [color, activeColor]),
  }));
  const wave = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    opacity: interpolate(progress.value, [0, 1], [0.45, 1]),
  }));
  // Transform belongs on the wrapper, never on an SVG node — the swimmer
  // drifting forward with the swell is the motion we want anyway.
  const roll = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 0.5, 1], [0, 1.6, 0]) }],
  }));

  return (
    <Animated.View style={roll}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedCircle cx={16.6} cy={6.4} r={2.2} animatedProps={head} />
        <AnimatedPath
          d="M3.6 12.4l5-2.6 4.4 2.2 3.8-2"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={body}
        />
        <AnimatedPath
          d="M2.6 17.4c1.9 0 1.9 1.6 3.8 1.6s1.9-1.6 3.8-1.6 1.9 1.6 3.8 1.6 1.9-1.6 3.8-1.6 1.9 1.6 3.8 1.6"
          strokeWidth={1.7}
          strokeLinecap="round"
          animatedProps={wave}
        />
      </Svg>
    </Animated.View>
  );
}

/* ----------------------------------------------------------------- cycling */

/** Wheels turn as it activates. */
function CyclingGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const wheels = useFilled(progress, color, activeColor, 0.1);
  const frame = useStroke(progress, color, activeColor);
  const turn = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <Animated.View style={turn}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedCircle cx={5.4} cy={16.6} r={4} strokeWidth={1.9} animatedProps={wheels} />
        <AnimatedCircle cx={18.6} cy={16.6} r={4} strokeWidth={1.9} animatedProps={wheels} />
        <AnimatedPath
          d="M5.4 16.6l4.4-7.2h5.2l3.6 7.2M9.8 9.4h4.6"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={frame}
        />
      </Svg>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------- golf */

/** Flag lifts on the pole and the hole fills. */
function GolfGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const flag = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 0.9]),
  }));
  const pole = useStroke(progress, color, activeColor);
  const hole = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
    fill: activeColor,
    fillOpacity: interpolate(progress.value, [0, 1], [0, 0.2]),
  }));
  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -1.4]) }],
  }));

  return (
    <Animated.View style={lift}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedPath d="M7.6 3.6v16.8" strokeWidth={1.9} strokeLinecap="round" animatedProps={pole} />
        <AnimatedPath d="M7.6 4.2l9 3-9 3z" strokeWidth={1.8} strokeLinejoin="round" animatedProps={flag} />
        <AnimatedEllipse cx={13} cy={19.6} rx={5.4} ry={1.9} strokeWidth={1.7} animatedProps={hole} />
      </Svg>
    </Animated.View>
  );
}

/* ----------------------------------------------------------------- generic */

/** Fallback for a sport with no bespoke glyph yet. */
function GenericGlyph({ progress, size, color, activeColor }: GlyphProps) {
  const ring = useFilled(progress, color, activeColor);
  const spark = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], [color, activeColor]),
  }));
  const pop = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.12, 1]) }],
  }));

  return (
    <Animated.View style={pop}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedCircle cx={12} cy={12} r={8.6} strokeWidth={1.9} animatedProps={ring} />
        <AnimatedPath
          d="M8.6 12.6l2.3 2.3 4.5-5.4"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={spark}
        />
      </Svg>
    </Animated.View>
  );
}

const glyphs: Record<SportIconName, React.ComponentType<GlyphProps>> = {
  all: AllGlyph,
  football: FootballGlyph,
  cricket: CricketGlyph,
  basketball: BasketballGlyph,
  tennis: RacketGlyph,
  badminton: RacketGlyph,
  volleyball: VolleyballGlyph,
  running: RunningGlyph,
  swimming: SwimmingGlyph,
  cycling: CyclingGlyph,
  golf: GolfGlyph,
  generic: GenericGlyph,
};

/** Map a sport slug or display name onto the closest bespoke glyph. */
export function sportIconFor(value?: string | null): SportIconName {
  const key = (value ?? '').toLowerCase().replace(/[\s_]+/g, '-');
  if (!key) return 'generic';
  if (key.includes('foot') || key.includes('soccer') || key.includes('futsal')) return 'football';
  if (key.includes('cricket')) return 'cricket';
  if (key.includes('basket')) return 'basketball';
  if (key.includes('tennis') && !key.includes('table')) return 'tennis';
  if (key.includes('badminton') || key.includes('padel') || key.includes('squash') || key.includes('table'))
    return 'badminton';
  if (key.includes('volley')) return 'volleyball';
  if (key.includes('run') || key.includes('marathon') || key.includes('athletic')) return 'running';
  if (key.includes('swim')) return 'swimming';
  if (key.includes('cycl') || key.includes('bike')) return 'cycling';
  if (key.includes('golf')) return 'golf';
  return 'generic';
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
