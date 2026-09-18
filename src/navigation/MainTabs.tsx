import React, { useCallback, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
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
import {
  ChatInboxScreen,
  CommunityScreen,
  EventsListScreen,
  HomeScreen,
  VenueListScreen,
} from '../screens';

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
const TabItem = React.memo(({ route, focused, options, navigation }: any) => {
  const progress = useSharedValue(focused ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, theme.motion.spring.gentle);
  }, [focused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -2]) },
      {
        scale:
          interpolate(progress.value, [0, 1], [1, 1.05]) *
          interpolate(press.value, [0, 1], [1, 0.88]),
      },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(interpolate(progress.value, [0, 1], [0.6, 1]), {
      duration: theme.motion.duration.fast,
    }),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -1]) }],
  }));

  const label = options.tabBarLabel ?? options.title ?? route.name;
  const accessibilityLabel = options.tabBarAccessibilityLabel ?? `${label} tab`;

  const onPressIn = useCallback(() => {
    press.value = withSpring(1, theme.motion.spring.press);
  }, [press]);

  const onPressOut = useCallback(() => {
    press.value = withSpring(0, theme.motion.spring.press);
  }, [press]);

  const onPress = useCallback(() => {
    if (!focused) triggerHaptic('selection');

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!focused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  }, [focused, navigation, route.key, route.name, route.params]);

  const onLongPress = useCallback(() => {
    navigation.emit({ type: 'tabLongPress', target: route.key });
  }, [navigation, route.key]);

  return (
    <Pressable
      style={styles.tabItem}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
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
          focused && tabAccents[route.name]
            ? { color: tabAccents[route.name] }
            : null,
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
});

const TabBar = React.memo(({ state, descriptors, navigation }: any) => {
  return (
    <View style={[styles.barWrap, { paddingBottom: 10 }]}>
      {/* Blur only lands on native; the solid backdrop underneath covers web. */}
      {Platform.OS === 'web' ? null : (
        <BlurView intensity={44} tint="dark" style={StyleSheet.absoluteFill} />
      )}

      <View style={styles.barRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          return (
            <TabItem
              key={route.key}
              route={route}
              options={options}
              focused={focused}
              navigation={navigation}
            />
          );
        })}
      </View>
    </View>
  );
});

export const MainTabs = () => {
  const renderTabBar = useCallback((props: any) => <TabBar {...props} />, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
      tabBar={renderTabBar}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Events"
        component={EventsListScreen}
        options={{ tabBarLabel: 'Discover' }}
      />
      {/* <Tab.Screen name="Community" component={CommunityScreen} /> */}
      <Tab.Screen name="Chat" component={ChatInboxScreen} />
      {/* <Tab.Screen name="Venues" component={VenueListScreen} initialParams={{ tabRoot: true }} /> */}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 20,
    borderRadius: 40,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor:
      Platform.OS === 'web' ? theme.colors.surface : 'rgba(13,13,13,0.9)',
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
    gap: 4,
  },
  tabLabel: {
    ...theme.typography.caption,
    fontSize: 11,
    fontFamily: theme.font.medium,
    color: theme.colors.textMuted,
  },
  tabLabelActive: { color: theme.colors.text, fontFamily: theme.font.bold },
});
