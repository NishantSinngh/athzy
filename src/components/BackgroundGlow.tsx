import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, Circle } from 'react-native-svg';
import { theme } from '../theme';

export const BackgroundGlow = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient id="topGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="bottomGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.09" />
            <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={theme.colors.background} />
        <Circle cx="8%" cy="2%" r="52%" fill="url(#topGlow)" />
        <Circle cx="92%" cy="68%" r="62%" fill="url(#bottomGlow)" />
      </Svg>
    </View>
  );
};
