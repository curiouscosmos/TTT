import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listAtRiskRetainers } from '@/api/client';
import { getQueryErrorMessage } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { EmptyState, ErrorState, InlineErrorState, LoadingState } from '@/components/screen-state';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AtRiskRetainer } from '@/types/api';

export default function AtRiskScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data = [], error, isFetching, isPending, refetch } = useQuery({
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
    setIsRefreshing(true);
    void refetch().finally(() => setIsRefreshing(false));
  }, [refetch]);

  if (isPending) {
    return (
      <ScreenShell>
        <LoadingState message="Loading at-risk retainers..." />
      </ScreenShell>
    );
  }

  if (error && data.length === 0) {
    return (
      <ScreenShell>
        <ErrorState
          title="Could not load at-risk retainers"
          message={getQueryErrorMessage(error)}
          onRetry={() => void refetch()}
        />
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
        ListHeaderComponent={
          error && data.length > 0 ? (
            <InlineErrorState message={getQueryErrorMessage(error)} onRetry={() => void refetch()} />
          ) : isFetching && !isRefreshing ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.backgroundStatus}>
              Refreshing...
            </ThemedText>
          ) : null
        }
        ListEmptyComponent={<EmptyState title="No retainers currently need attention." />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
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
        <StatusBadge kind="health" status={retainer.health.status} />
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
  backgroundStatus: {
    paddingBottom: Spacing.two,
    textAlign: 'center',
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
  separator: {
    height: Spacing.two,
  },
  pressed: {
    opacity: 0.75,
  },
});
