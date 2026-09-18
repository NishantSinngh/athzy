import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { theme } from '../theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  description?: string;
  children: React.ReactNode;
  /** Let the body scroll when the content can overflow. */
  scrollable?: boolean;
}

/**
 * Standard bottom sheet: scrim, grab handle, titled header, close button.
 * Replaces the ad-hoc modals each screen was building for the same job.
 */
export function BottomSheet({ visible, onClose, title, eyebrow, description, children, scrollable = true }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const Body = scrollable ? ScrollView : View;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)} exiting={FadeOut.duration(theme.motion.duration.fast)} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            entering={SlideInDown.duration(theme.motion.duration.normal).easing(Easing.out(Easing.cubic))}
            exiting={SlideOutDown.duration(theme.motion.duration.fast).easing(Easing.in(Easing.cubic))}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, theme.spacing.gutter) }]}
            accessibilityViewIsModal
          >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title} accessibilityRole="header">{title}</Text>
            </View>
            <PressableScale style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={21} color={theme.colors.text} />
            </PressableScale>
          </View>
          {description ? <Text style={styles.description}>{description}</Text> : null}
          <Body
            style={scrollable ? styles.body : undefined}
            contentContainerStyle={scrollable ? styles.bodyContent : undefined}
            showsVerticalScrollIndicator={false}
          >
            {children}
            </Body>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheetWrap: { justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: theme.colors.scrim },
  sheet: {
    maxHeight: '88%',
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.m,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.colors.border,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: theme.colors.surfaceLight,
    marginBottom: theme.spacing.m,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.m },
  headerCopy: { flex: 1 },
  eyebrow: { ...theme.typography.label, color: theme.colors.primary, marginBottom: 5 },
  title: { ...theme.typography.h2, fontSize: 22 },
  close: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  description: { ...theme.typography.bodySmall, marginTop: theme.spacing.m },
  body: { flexShrink: 1, marginTop: theme.spacing.l },
  bodyContent: { gap: theme.spacing.s, paddingBottom: theme.spacing.s },
});
