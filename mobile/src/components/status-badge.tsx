import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { HealthStatus } from '@/types/api';

const statusLabels: Record<HealthStatus, string> = {
  green: 'Green',
  amber: 'Amber',
  red: 'Red',
};

export function StatusBadge({ kind, status }: { kind: 'health' | 'rag'; status: HealthStatus }) {
  const label = `${kind === 'health' ? 'Health' : 'RAG'}: ${statusLabels[status]}`;

  return (
    // Health and check-in RAG share colors and values, but the kind keeps the
    // visible/accessibility text from accidentally calling a check-in "health".
    <View accessible accessibilityLabel={label} style={[styles.badge, styles[status]]}>
      <ThemedText type="code" style={styles.badgeText}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  green: {
    backgroundColor: '#148a48',
  },
  amber: {
    backgroundColor: '#a46300',
  },
  red: {
    backgroundColor: '#c12a2a',
  },
  badgeText: {
    color: '#ffffff',
  },
});
