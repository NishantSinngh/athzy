import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedIcon, type IconName } from '../components/AnimatedIcon';
import { triggerHaptic } from '../components/PressableScale';
import { theme } from '../theme';
import { ChatInboxScreen, CommunityScreen, EventsListScreen, HomeScreen, VenueListScreen } from '../screens';

const Tab = createBottomTabNavigator();

const icons: Record<string, IconName> = {
  Home: 'home',
  Events: 'discover',
  Community: 'community',
  Chat: 'chat',
  Venues: 'venue',
};

/**
 * Each tab lights up in the colour its section owns, so the bar previews where
 * you are about to land. Home has no section of its own and stays white.
 */
const tabAccents: Record<string, string> = {
  Events: theme.accents.discover.base,
  Community: theme.accents.community.base,
  Chat: theme.accents.chat.base,
  Venues: theme.accents.venue.base,
};

/**
 * A single tab.
 *
 * There is deliberately no indicator bar or pill: the icon's own animation and
 * a white-vs-grey weight shift carry the selected state. Green is reserved for
 * primary actions elsewhere in the app, so it never appears here.
 */
function TabItem({ route, focused, onPress, onLongPress, label, accessibilityLabel }: any) {
  const progress = useSharedValue(focused ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, theme.motion.spring.gentle);
  }, [focused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -2]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.05]) * interpolate(press.value, [0, 1], [1, 0.88]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(interpolate(progress.value, [0, 1], [0.6, 1]), { duration: theme.motion.duration.fast }),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -1]) }],
  }));

  return (
    <Pressable
      style={styles.tabItem}
      onPressIn={() => { press.value = withSpring(1, theme.motion.spring.press); }}
      onPressOut={() => { press.value = withSpring(0, theme.motion.spring.press); }}
      onPress={() => {
        if (!focused) triggerHaptic('selection');
        onPress();
      }}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      // Kills the Android ripple that was bleeding outside the icon.
      android_ripple={null}
      hitSlop={6}
    >
      <Animated.View style={iconStyle}>
        <AnimatedIcon
          name={icons[route.name] ?? 'home'}
          active={focused}
          size={25}
          color={theme.colors.textMuted}
          activeColor={tabAccents[route.name] ?? theme.colors.text}
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.tabLabel,
          focused && styles.tabLabelActive,
          focused && tabAccents[route.name] ? { color: tabAccents[route.name] } : null,
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function TabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* Blur only lands on native; the solid backdrop underneath covers web. */}
      {Platform.OS === 'web' ? null : <BlurView intensity={44} tint="dark" style={StyleSheet.absoluteFill} />}
      <View style={styles.hairline} />

      <View style={styles.barRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = options.tabBarLabel ?? options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              focused={focused}
              label={label}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? `${label} tab`}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            />
          );
        })}
      </View>
    </View>
  );
}

export const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.colors.background } }}
    tabBar={(props) => <TabBar {...props} />}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Events" component={EventsListScreen} options={{ tabBarLabel: 'Discover' }} />
    <Tab.Screen name="Community" component={CommunityScreen} />
    <Tab.Screen name="Chat" component={ChatInboxScreen} />
    {/* Profile moved to the avatar in the Home header; venues earned the slot. */}
    <Tab.Screen name="Venues" component={VenueListScreen} initialParams={{ tabRoot: true }} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    backgroundColor: Platform.OS === 'web' ? theme.colors.surface : 'rgba(13,13,13,0.86)',
    overflow: 'hidden',
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.borderSoft,
  },
  barRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tabItem: {
    flex: 1,
    minHeight: theme.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabLabel: {
    ...theme.typography.caption,
    fontSize: 11,
    fontFamily: theme.font.medium,
    color: theme.colors.textMuted,
  },
  tabLabelActive: { color: theme.colors.text, fontFamily: theme.font.bold },
});
