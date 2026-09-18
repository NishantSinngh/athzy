import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

export const GlassCard = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <BlurView intensity={22} tint="dark" style={[styles.card, style]}>
    {children}
  </BlurView>
);

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: 'rgba(28,28,28,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
});
