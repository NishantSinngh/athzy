import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Helper text under the field; hidden while an error is showing. */
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export const Input = ({
  label,
  error,
  hint,
  icon,
  isPassword,
  style,
  onFocus,
  onBlur,
  selectionColor = theme.colors.primary,
  ...props
}: InputProps) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);
  const focus = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      error
        ? theme.colors.error
        : focus.value
          ? theme.colors.primarySoft
          : 'rgba(255,255,255,0.10)',
      { duration: theme.motion.duration.fast },
    ),
  }));

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Animated.View style={[styles.field, borderStyle, focused && styles.fieldFocused]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={19}
            color={focused ? theme.colors.primary : theme.colors.textMuted}
            style={styles.icon}
          />
        ) : null}

        <TextInput
          ref={inputRef}
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={selectionColor}
          secureTextEntry={isPassword && !showPassword}
          accessibilityLabel={label}
          {...props}
          onFocus={(event) => {
            setFocused(true);
            focus.value = 1;
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            focus.value = 0;
            onBlur?.(event);
          }}
        />

        {isPassword ? (
          <PressableScale
            onPress={() => setShowPassword((value) => !value)}
            style={styles.eye}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={theme.colors.textMuted} />
          </PressableScale>
        ) : null}
      </Animated.View>

      {error ? (
        <View style={styles.message}>
          <Ionicons name="alert-circle" size={13} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.m },
  label: {
    ...theme.typography.label,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.s,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  fieldFocused: { backgroundColor: theme.colors.surfaceRaised },
  icon: { marginRight: theme.spacing.s },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
    fontFamily: theme.font.regular,
    fontSize: 15,
  },
  eye: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  message: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  errorText: { ...theme.typography.caption, color: theme.colors.error, flex: 1 },
  hintText: { ...theme.typography.caption, marginTop: 6 },
});
