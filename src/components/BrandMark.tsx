import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { theme } from '../theme';

export const BrandMark = () => (
  <View style={styles.container}>
    <Image source={require('../../Athzy Logo mark .png')} style={styles.image} resizeMode="contain" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(69,240,106,0.20)',
    overflow: 'hidden',
  },
  image: {
    width: 44,
    height: 44,
  },
});
