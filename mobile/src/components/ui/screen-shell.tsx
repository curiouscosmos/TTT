import { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export function ScreenShell({
  children,
  padded = true,
}: PropsWithChildren<{ padded?: boolean }>) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, padded && styles.padded]}>{children}</SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  padded: {
    paddingHorizontal: Spacing.three,
  },
});
