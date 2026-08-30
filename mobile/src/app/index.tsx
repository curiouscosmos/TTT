import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { listRetainers } from '@/api/client';
import { getQueryErrorMessage } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import {
  defaultFilterDraft,
  FilterSortModal,
  type FilterDraft,
} from '@/components/FilterSortModal';
import { RetainerRow } from '@/components/RetainerRow';
import { EmptyState, ErrorState, InlineErrorState, LoadingState } from '@/components/screen-state';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ScreenShell } from '@/components/ui/screen-shell';
import { Separator } from '@/components/ui/separator';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRootStore } from '@/stores/rootStore';
import type { RetainerSummary } from '@/types/api';
import { filterAndSortRetainers } from '@/utils/retainerList';

const RetainerListScreen = observer(function RetainerListScreen() {
  const theme = useTheme();
  const { retainerList } = useRootStore();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(defaultFilterDraft);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data = [], error, isFetching, isPending, refetch } = useQuery({
    queryKey: queryKeys.retainers.list(),
    queryFn: listRetainers,
  });

  const visibleRetainers = useMemo(() => {
    // TanStack Query owns the API array. MobX owns only the view preferences;
    // local filtering is fine for this challenge's ~300 records and avoids
    // adding API filter plumbing before the product needs it.
    return filterAndSortRetainers(data, {
      searchText: retainerList.searchText,
      healthFilter: retainerList.healthFilter,
      showActive: retainerList.showActive,
      showArchived: retainerList.showArchived,
      sortMode: retainerList.sortMode,
    });
  }, [
    data,
    retainerList.healthFilter,
    retainerList.searchText,
    retainerList.showActive,
    retainerList.showArchived,
    retainerList.sortMode,
  ]);

  const openRetainer = useCallback((id: string) => {
    router.push({ pathname: '/retainers/[id]', params: { id } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: RetainerSummary }) => (
      <RetainerRow retainer={item} onPress={() => openRetainer(item.id)} />
    ),
    [openRetainer],
  );

  const keyExtractor = useCallback((item: RetainerSummary) => item.id, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Pull-to-refresh is user-initiated, so it gets its own spinner instead of
    // reusing isFetching, which also becomes true for background refetches.
    void refetch().finally(() => setIsRefreshing(false));
  }, [refetch]);

  const openFilterModal = useCallback(() => {
    setFilterDraft({
      healthFilter: retainerList.healthFilter,
      showActive: retainerList.showActive,
      showArchived: retainerList.showArchived,
      sortMode: retainerList.sortMode,
    });
    setIsFilterModalOpen(true);
  }, [
    retainerList.healthFilter,
    retainerList.showActive,
    retainerList.showArchived,
    retainerList.sortMode,
  ]);

  const applyFilterDraft = useCallback(() => {
    retainerList.setHealthFilter(filterDraft.healthFilter);
    retainerList.setShowActive(filterDraft.showActive);
    retainerList.setShowArchived(filterDraft.showArchived);
    retainerList.setSortMode(filterDraft.sortMode);
    setIsFilterModalOpen(false);
  }, [filterDraft, retainerList]);

  // TanStack Query v5 can be fetching with cached data. isPending is the
  // initial no-data state; isFetching below is only non-blocking background work.
  if (isPending) {
    return (
      <ScreenShell padded>
        <LoadingState message="Loading retainers..." />
      </ScreenShell>
    );
  }

  if (error && data.length === 0) {
    return (
      <ScreenShell padded>
        <ErrorState
          title="Could not load retainers"
          message={getQueryErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell padded>
      <View style={styles.header}>
        <ThemedText type="subtitle">Retainers</ThemedText>
        <TextInput
          accessibilityLabel="Search retainers"
          placeholder="Search clients or leads"
          placeholderTextColor={theme.textSecondary}
          value={retainerList.searchText}
          onChangeText={retainerList.setSearchText}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
            },
          ]}
        />
        <View style={styles.headerActions}>
          <Button label="Filter & Sort" onPress={openFilterModal} />
          {retainerList.hasActiveFilters ? (
            <Button label="Clear" onPress={retainerList.resetFilters} variant="secondary" />
          ) : null}
        </View>
      </View>

      <FlatList
        data={visibleRetainers}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          data.length === 0 ? (
            <EmptyState title="No retainers yet" message="Create a retainer to start tracking health." />
          ) : (
            <EmptyState
              title="No matches"
              message="Clear filters or adjust your search."
              actionLabel="Clear filters"
              onAction={retainerList.hasActiveFilters ? retainerList.resetFilters : undefined}
            />
          )
        }
        ListHeaderComponent={
          error && data.length > 0 ? (
            <InlineErrorState message={getQueryErrorMessage(error)} onRetry={() => void refetch()} />
          ) : isFetching && !isRefreshing ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.backgroundStatus}>
              Refreshing...
            </ThemedText>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
      />
      <FilterSortModal
        visible={isFilterModalOpen}
        draft={filterDraft}
        onChangeDraft={setFilterDraft}
        onApply={applyFilterDraft}
        onCancel={() => setIsFilterModalOpen(false)}
      />
    </ScreenShell>
  );
});

export default RetainerListScreen;

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  backgroundStatus: {
    paddingBottom: Spacing.two,
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.four,
  },
});
