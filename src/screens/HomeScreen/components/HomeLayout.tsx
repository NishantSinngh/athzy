import React, { useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '../../../components/PressableScale';
import { Skeleton, SkeletonCard } from '../../../components/Skeleton';
import { theme } from '../../../theme';
import { styles } from '../styles';

export const Section = React.memo(
  ({ children, delay }: { children: React.ReactNode; delay: number }) => (
    <Animated.View
      style={styles.section}
      entering={FadeInDown.delay(theme.motion.stagger * delay).duration(
        theme.motion.duration.normal,
      )}
    >
      {children}
    </Animated.View>
  ),
);

export const Carousel = React.memo(
  ({
    data,
    itemWidth,
    renderItem,
  }: {
    data: any[];
    itemWidth: number;
    renderItem: (item: any) => React.ReactNode;
  }) => {
    const keyExtractor = useCallback(
      (item: any, index: number) => (item.id ? String(item.id) : String(index)),
      [],
    );

    return (
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemWidth + theme.spacing.m}
        snapToAlignment="start"
        contentContainerStyle={styles.rail}
        ItemSeparatorComponent={() => <View style={styles.carouselSeparator} />}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth }}>{renderItem(item)}</View>
        )}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
      />
    );
  },
);

export const StaleBanner = React.memo(
  ({ onRetry }: { onRetry: () => void }) => (
    <PressableScale style={styles.staleBanner} onPress={onRetry}>
      <Ionicons
        name="cloud-offline-outline"
        size={16}
        color={theme.colors.warning}
      />
      <Text style={styles.staleText}>Showing saved results. Tap to retry.</Text>
    </PressableScale>
  ),
);

export const HomeSkeleton = React.memo(() => (
  <View style={styles.skeleton}>
    <Skeleton height={132} radius={theme.borderRadius.xl} />
    <View style={styles.skeletonActions}>
      {[0, 1, 2, 3].map(key => (
        <View key={key} style={styles.skeletonAction}>
          <Skeleton width={52} height={52} radius={theme.borderRadius.l} />
          <Skeleton width={44} height={10} radius={theme.borderRadius.xs} />
        </View>
      ))}
    </View>
    <Skeleton height={280} radius={theme.borderRadius.xl} />
    <View style={styles.skeletonRail}>
      <SkeletonCard width={240} />
      <SkeletonCard width={240} />
    </View>
  </View>
));
