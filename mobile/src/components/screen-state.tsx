import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

export function LoadingState({ message }: { message: string }) {
  return (
    <View accessibilityRole="progressbar" style={styles.centerState}>
      <ActivityIndicator />
      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        {message}
      </ThemedText>
    </View>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <ThemedText type="subtitle" style={styles.centerText}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        {message}
      </ThemedText>
      <RetryButton onPress={onRetry} />
    </View>
  );
}

export function InlineErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.inlineError}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.inlineErrorText}>
        {message}
      </ThemedText>
      <Button label="Retry" onPress={onRetry} />
    </View>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <ThemedText type="smallBold" style={styles.centerText}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {message}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

function RetryButton({ onPress }: { onPress: () => void }) {
  return <Button label="Retry" onPress={onPress} />;
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  inlineError: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  inlineErrorText: {
    textAlign: 'center',
  },
});
