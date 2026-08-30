import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listAtRiskRetainers } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AtRiskRetainer, HealthStatus } from '@/types/api';

export default function AtRiskScreen() {
  const { data = [], error, isLoading, isRefetching, refetch } = useQuery({
    // This endpoint has different membership and ordering than the full list,
    // so it gets a dedicated key and can be invalidated independently.
    queryKey: queryKeys.retainers.atRisk,
    queryFn: listAtRiskRetainers,
  });

  const openRetainer = useCallback((id: string) => {
    router.push({ pathname: '/retainers/[id]', params: { id } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AtRiskRetainer }) => (
      <AtRiskRow retainer={item} onPress={() => openRetainer(item.id)} />
    ),
    [openRetainer],
  );

  const keyExtractor = useCallback((item: AtRiskRetainer) => item.id, []);

  const onRefresh = useCallback(() => {
    // Pull-to-refresh refetches this query so the existing cache updates in place.
    void refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <ScreenShell>
        <View style={styles.centerState}>
          <ActivityIndicator />
          <ThemedText themeColor="textSecondary">Loading at-risk retainers...</ThemedText>
        </View>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <View style={styles.centerState}>
          <ThemedText type="subtitle" style={styles.centerText}>
            Could not load at-risk retainers
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            {error instanceof Error ? error.message : 'Something went wrong.'}
          </ThemedText>
          <Button label="Retry" onPress={() => void refetch()} />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <View style={styles.header}>
        <ThemedText type="subtitle">At-Risk</ThemedText>
        <ThemedText themeColor="textSecondary">
          Red and amber retainers that need attention.
        </ThemedText>
      </View>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText type="smallBold" style={styles.centerText}>
              No retainers currently need attention.
            </ThemedText>
          </View>
        }
        refreshing={isRefetching && !isLoading}
        onRefresh={onRefresh}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
      />
    </ScreenShell>
  );
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </ThemedView>
  );
}

function AtRiskRow({ retainer, onPress }: { retainer: AtRiskRetainer; onPress: () => void }) {
  const theme = useTheme();

  // The API owns severity/staleness ordering; the UI preserves that order
  // instead of duplicating backend business rules.
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
        <ThemedText type="smallBold" style={styles.clientName}>
          {retainer.clientName}
        </ThemedText>
        <HealthBadge status={retainer.health.status} />
      </View>
      <ThemedText>{retainer.health.reason}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Latest check-in: {formatDate(retainer.latestCheckInDate)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Lead: {retainer.leadEngineer}
      </ThemedText>
    </Pressable>
  );
}

function HealthBadge({ status }: { status: HealthStatus }) {
  return (
    <View style={[styles.badge, styles[`${status}Badge`]]}>
      <ThemedText type="code" style={styles.badgeText}>
        {status.toUpperCase()}
      </ThemedText>
    </View>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
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

function Separator() {
  return <View style={styles.separator} />;
}

function formatDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString() : 'None';
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
    paddingHorizontal: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.four,
  },
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
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  greenBadge: {
    backgroundColor: '#148a48',
  },
  amberBadge: {
    backgroundColor: '#a46300',
  },
  redBadge: {
    backgroundColor: '#c12a2a',
  },
  badgeText: {
    color: '#ffffff',
  },
  separator: {
    height: Spacing.two,
  },
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  pressed: {
    opacity: 0.75,
  },
});
