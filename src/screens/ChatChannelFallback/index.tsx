import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { theme } from '../../theme';

/**
 * Expo Go can't load Stream's native modules, so the chat surfaces degrade to
 * this rather than crashing. Development and preview builds get the real thing.
 */
export function ChatChannelFallback({ navigation, route }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader navigation={navigation} title={route.params?.title || 'Conversation'} bordered />
      <View style={styles.body}>
        <EmptyState
          icon="phone-portrait-outline"
          title="Open an Athzy build for chat"
          message="Expo Go cannot load Stream's native chat modules. Realtime conversations work in development and preview builds."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  body: { flex: 1, justifyContent: 'center' },
});
