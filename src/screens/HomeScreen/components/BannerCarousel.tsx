import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import imagePath from '../../../assets/imagePath';
import { theme } from '../../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const banners = [imagePath.banner1, imagePath.banner2, imagePath.banner3];

const extendedBanners = [banners[banners.length - 1], ...banners, banners[0]];

const Dot = React.memo(
  ({
    index,
    scrollX,
  }: {
    index: number;
    scrollX: Animated.SharedValue<number>;
  }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const currentIndex = scrollX.value / SCREEN_WIDTH;

      const pos1 = index + 1;
      const pos2 =
        index === 0
          ? extendedBanners.length - 1
          : index === banners.length - 1
          ? 0
          : -1;

      const dist1 = Math.abs(currentIndex - pos1);
      const dist2 = Math.abs(currentIndex - pos2);
      const minDistance = Math.min(dist1, dist2);

      const progress = 1 - Math.max(0, Math.min(1, minDistance));

      return {
        width: 8 + progress * 12,
        backgroundColor: interpolateColor(
          progress,
          [0, 1],
          [theme.colors.border || '#D4D4D8', theme.colors.primary || '#000000'],
        ),
      };
    });

    return <Animated.View style={[styles.dot, animatedStyle]} />;
  },
);

const BannerCarousel = React.memo(() => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(SCREEN_WIDTH);
  const activeIndexRef = useRef(1);
  const isInteractingRef = useRef(false);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: false });
    }, 0);
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    let newIndex = Math.round(offsetX / SCREEN_WIDTH);

    if (newIndex === 0) {
      newIndex = banners.length;
      scrollViewRef.current?.scrollTo({
        x: newIndex * SCREEN_WIDTH,
        animated: false,
      });
    } else if (newIndex === extendedBanners.length - 1) {
      newIndex = 1;
      scrollViewRef.current?.scrollTo({
        x: newIndex * SCREEN_WIDTH,
        animated: false,
      });
    }

    activeIndexRef.current = newIndex;
  }, []);

  useEffect(() => {
    if (isInteracting) return;

    const timer = setInterval(() => {
      let nextIndex = activeIndexRef.current + 1;

      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      activeIndexRef.current = nextIndex;

      if (nextIndex === extendedBanners.length - 1) {
        setTimeout(() => {
          if (!isInteractingRef.current) {
            scrollViewRef.current?.scrollTo({
              x: SCREEN_WIDTH,
              animated: false,
            });
            activeIndexRef.current = 1;
          }
        }, 500);
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isInteracting]);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
          setIsInteracting(true);
        }}
        onScrollEndDrag={() => {
          isInteractingRef.current = false;
          setIsInteracting(false);
        }}
        style={styles.scrollView}
      >
        {extendedBanners.map((item, index) => (
          <View key={`banner-${index}`} style={styles.slideWrapper}>
            <Image source={item} style={styles.image} resizeMode="stretch" />
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.paginationContainer}>
        {banners.map((_, index) => (
          <Dot key={`dot-${index}`} index={index} scrollX={scrollX} />
        ))}
      </View>
    </View>
  );
});

export default BannerCarousel;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollView: {
    flexGrow: 0,
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH - 16,
    height: SCREEN_HEIGHT * 0.2,
    borderRadius: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    // marginTop: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
