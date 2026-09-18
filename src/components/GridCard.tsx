import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppImage } from './AppImage';
import { PressableScale } from './PressableScale';
import { theme, type Accent } from '../theme';

interface GridCardProps {
  imageUrl?: string | null;
  fallback?: 'event' | 'venue' | 'tournament';
  /** Small tag over the image, e.g. the sport. */
  tag?: string;
  /** Status pill over the image bottom, e.g. "Available today". */
  status?: { label: string; tone: 'good' | 'warn' };
  title: string;
  subtitle?: string;
  /** Place/venue line with a pin. */
  place?: string;
  /** Small label above the price, e.g. "STARTING PRICE". */
  priceLabel?: string;
  price?: string;
  priceSuffix?: string;
  rating?: number;
  accent: Accent;
  onPress: () => void;
}

/**
 * The half-width card from the Discover/Venues designs.
 *
 * Two of these sit side by side, so everything is single-line and the image
 * carries the recognition. Anything that needs more room belongs on the detail
 * screen, not here.
 */
export function GridCard({
  imageUrl,
  fallback = 'event',
  tag,
  status,
  title,
  subtitle,
  place,
  priceLabel,
  price,
  priceSuffix,
  rating,
  accent,
  onPress,
}: GridCardProps) {
  return (
    <PressableScale
      style={styles.card}
      scaleTo={0.97}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, place, price].filter(Boolean).join(', ')}
    >
      <View style={styles.imageWrap}>
        <AppImage uri={imageUrl} fallback={fallback} style={styles.image} />
        <LinearGradient colors={theme.gradients.imageScrim} style={StyleSheet.absoluteFill} />

        {tag ? (
          <View style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>{tag.toUpperCase()}</Text>
          </View>
        ) : null}

        {status ? (
          <View
            style={[
              styles.status,
              { backgroundColor: status.tone === 'good' ? theme.colors.primary : theme.colors.warning },
            ]}
          >
            <Text style={styles.statusText} numberOfLines={1}>{status.label.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}

        {place ? (
          <View style={styles.placeRow}>
            <Ionicons name="location-outline" size={12} color={theme.colors.textMuted} />
            <Text style={styles.place} numberOfLines={1}>{place}</Text>
          </View>
        ) : null}

        {price ? (
          <View style={styles.priceRow}>
            <View style={styles.priceBlock}>
              {priceLabel ? <Text style={styles.priceLabel}>{priceLabel}</Text> : null}
              <Text style={[styles.price, { color: accent.base }]} numberOfLines={1}>
                {price}
                {priceSuffix ? <Text style={styles.priceSuffix}>{priceSuffix}</Text> : null}
              </Text>
            </View>
            {typeof rating === 'number' ? (
              <View style={styles.rating}>
                <Ionicons name="star" size={11} color={theme.colors.warning} />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imageWrap: { height: 108, backgroundColor: theme.colors.surfaceLight },
  image: { width: '100%', height: '100%' },

  tag: {
    position: 'absolute',
    top: 8,
    left: 8,
    maxWidth: '75%',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: 'rgba(10,10,10,0.72)',
  },
  tagText: { ...theme.typography.caption, fontSize: 10, color: theme.colors.text, fontFamily: theme.font.bold, letterSpacing: 0.5 },

  status: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    maxWidth: '85%',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.xs,
  },
  statusText: { ...theme.typography.caption, fontSize: 10, color: theme.colors.onPrimary, fontFamily: theme.font.extrabold, letterSpacing: 0.4 },

  body: { padding: theme.spacing.s, gap: 3 },
  title: { ...theme.typography.title, fontSize: 13 },
  subtitle: { ...theme.typography.caption, fontSize: 11 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  place: { ...theme.typography.caption, fontSize: 11, flexShrink: 1 },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 5,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  priceBlock: { flexShrink: 1 },
  priceLabel: { ...theme.typography.caption, fontSize: 10, letterSpacing: 0.4 },
  price: { ...theme.typography.title, fontSize: 14 },
  priceSuffix: { ...theme.typography.caption, fontSize: 11, fontFamily: theme.font.medium },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { ...theme.typography.caption, fontSize: 11, color: theme.colors.text, fontFamily: theme.font.bold },
});
