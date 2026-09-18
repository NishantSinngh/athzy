import React from 'react';
import { StyleProp, ImageStyle } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { theme } from '../theme';

/**
 * Shared imagery fallbacks. These used to be copy-pasted Unsplash URLs in six
 * different screens, which meant a broken event card looked different depending
 * on where you hit it.
 */
export const IMAGE_FALLBACKS = {
  event: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800',
  venue: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
  tournament: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800',
  /** Deliberately blank: `Avatar` draws initials instead. Substituting a
   *  stock photo of a real person for a missing avatar is worse than nothing. */
  avatar: '',
} as const;

interface AppImageProps {
  uri?: string | null;
  fallback?: keyof typeof IMAGE_FALLBACKS;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  /** Crossfade duration once the bytes land. */
  transition?: number;
  /** Disk+memory caching. Turn down only for content that must always be fresh. */
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  accessibilityLabel?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Every remote image in the app goes through here. `expo-image` gives us disk
 * caching and a crossfade for free, so pictures stop popping in and lists stop
 * re-downloading the same photo on every focus.
 */
export function AppImage({
  uri,
  fallback = 'event',
  style,
  contentFit = 'cover',
  transition = theme.motion.duration.normal,
  cachePolicy = 'memory-disk',
  accessibilityLabel,
  priority = 'normal',
}: AppImageProps) {
  return (
    <Image
      source={{ uri: uri || IMAGE_FALLBACKS[fallback] }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      cachePolicy={cachePolicy}
      priority={priority}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      placeholderContentFit="cover"
      recyclingKey={uri || fallback}
    />
  );
}

/** Warm the cache for images that are about to scroll into view. */
export function prefetchImages(uris: (string | null | undefined)[]) {
  const valid = uris.filter((uri): uri is string => Boolean(uri));
  if (valid.length) Image.prefetch(valid, { cachePolicy: 'memory-disk' }).catch(() => undefined);
}
