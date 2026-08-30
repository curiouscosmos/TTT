import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
      {actionLabel && onAction ? <ActionButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

function RetryButton({ onPress }: { onPress: () => void }) {
  return <ActionButton label="Retry" onPress={onPress} />;
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.text }]}>
      <ThemedText type="smallBold" style={{ color: theme.background }}>
        {label}
      </ThemedText>
    </Pressable>
  );
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
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
});
