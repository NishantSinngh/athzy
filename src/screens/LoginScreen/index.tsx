import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackendAPI } from '../../api/backend';
import { BrandMark } from '../../components/BrandMark';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../theme';
import { PUBLIC_API_BASE_URL } from '@env';

export function LoginScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async () => {
    try {
      setLoading(true);
      setMessage('');
      await BackendAPI.login(identifier, password);
    } catch (e: any) {
      setMessage(e.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };
  const API_BASE_URL = PUBLIC_API_BASE_URL

  console.log(API_BASE_URL,"<><><><><><><><><>>><>><>");
  
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.center}
      >
        <BrandMark />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.copy}>Sign in to Athzy to continue.</Text>
        <View style={styles.form}>
          <Input
            label="Email or username"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            icon="person-outline"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock-closed-outline"
            onSubmitEditing={submit}
          />
          <Text style={styles.error}>{message}</Text>
          <Button
            title="Sign in"
            onPress={submit}
            loading={loading}
            fullWidth
          />
          <Button
            title="Create an account"
            onPress={() => navigation.navigate('SignUp')}
            variant="ghost"
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.gutter },
  title: { ...theme.typography.h1, marginTop: 28 },
  copy: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  form: { gap: 14, marginTop: 32 },
  error: {
    ...theme.typography.caption,
    color: theme.colors.error,
    minHeight: 18,
  },
});
