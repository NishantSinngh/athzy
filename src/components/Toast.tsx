import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { PressableScale, triggerHaptic } from './PressableScale';
import { theme } from '../theme';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** Milliseconds on screen. Errors linger longer by default. */
  duration?: number;
  action?: { label: string; onPress: () => void };
}

type Listener = (toast: ToastOptions & { id: number }) => void;

let listener: Listener | null = null;
let nextId = 1;

/**
 * Imperative, prop-drill-free toast. Screens call `showToast(...)` for anything
 * that used to be an `Alert.alert` — a blocking native modal is the wrong
 * weight for "couldn't refresh" or "post published".
 *
 * Genuine decisions (delete account, cancel a booking) should stay as `Alert`
 * with real buttons; this is for feedback, not confirmation.
 */
export function showToast(options: ToastOptions) {
  triggerHaptic(options.tone === 'error' ? 'heavy' : 'light');
  listener?.({ ...options, id: nextId++ });
}

const tones: Record<ToastTone, { icon: keyof typeof Ionicons.glyphMap; color: string; background: string; border: string }> = {
  success: {
    icon: 'checkmark-circle',
    color: theme.colors.primary,
    background: 'rgba(20,32,23,0.96)',
    border: theme.colors.primarySoft,
  },
  error: {
    icon: 'alert-circle',
    color: theme.colors.error,
    background: 'rgba(34,19,19,0.96)',
    border: 'rgba(240,68,68,0.32)',
  },
  info: {
    icon: 'information-circle',
    color: theme.colors.info,
    background: 'rgba(20,24,32,0.96)',
    border: 'rgba(59,130,246,0.30)',
  },
};

/** Mount once, near the root, above the navigator. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  useEffect(() => {
    listener = (next) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(next);
      timer.current = setTimeout(() => setToast(null), next.duration ?? (next.tone === 'error' ? 5000 : 3200));
    };
    return () => {
      listener = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!toast) return null;
  const palette = tones[toast.tone ?? 'info'];

  return (
    <Animated.View
      key={toast.id}
      entering={FadeInUp.duration(theme.motion.duration.fast)}
      exiting={FadeOutUp.duration(theme.motion.duration.fast)}
      style={[styles.wrap, { top: insets.top + theme.spacing.s }]}
      pointerEvents="box-none"
    >
      <View
        style={[styles.toast, { backgroundColor: palette.background, borderColor: palette.border }]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Ionicons name={palette.icon} size={20} color={palette.color} />
        <Text style={styles.message} numberOfLines={3}>{toast.message}</Text>
        {toast.action ? (
          <PressableScale
            onPress={() => { toast.action!.onPress(); dismiss(); }}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={toast.action.label}
          >
            <Text style={[styles.actionText, { color: palette.color }]}>{toast.action.label}</Text>
          </PressableScale>
        ) : (
          <PressableScale onPress={dismiss} hitSlop={10} haptic="none" accessibilityRole="button" accessibilityLabel="Dismiss">
            <Ionicons name="close" size={17} color={theme.colors.textMuted} />
          </PressableScale>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: theme.spacing.m,
    right: theme.spacing.m,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    ...theme.elevation.high,
  },
  message: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1 },
  action: { minHeight: 32, justifyContent: 'center', paddingHorizontal: theme.spacing.s },
  actionText: { ...theme.typography.caption, fontFamily: theme.font.bold },
});
