import { Pressable, StyleSheet, View } from 'react-native';

import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RetainerSummary } from '@/types/api';
import { formatDate } from '@/utils/date';

export function RetainerRow({ retainer, onPress }: { retainer: RetainerSummary; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${retainer.clientName}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View style={styles.rowTop}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.clientName}>
          {retainer.clientName}
        </ThemedText>
        <StatusBadge kind="health" status={retainer.health.status} />
      </View>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        Lead: {retainer.leadEngineer}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Latest check-in: {formatDate(retainer.latestCheckInDate)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 8,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  rowTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  clientName: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
