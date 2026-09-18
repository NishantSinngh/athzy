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

export function SignUpScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async () => {
    try {
      setLoading(true);
      setMessage('');
      await BackendAPI.signup({ fullName, email, username, password });
    } catch (e: any) {
      setMessage(e.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.center}
      >
        <BrandMark />
        <Text style={styles.title}>Create account</Text>
        <View style={styles.form}>
          <Input
            label="Name"
            value={fullName}
            onChangeText={setFullName}
            icon="person-outline"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            icon="mail-outline"
          />
          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            icon="at-outline"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock-closed-outline"
            onSubmitEditing={submit}
            hint="At least 8 characters"
          />
          <Text style={styles.error}>{message}</Text>
          <Button
            title="Create account"
            onPress={submit}
            loading={loading}
            fullWidth
          />
          <Button
            title="I already have an account"
            onPress={() => navigation.goBack()}
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
  form: { gap: 12, marginTop: 28 },
  error: {
    ...theme.typography.caption,
    color: theme.colors.error,
    minHeight: 18,
  },
});
