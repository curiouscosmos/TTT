import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { listRetainers } from '@/api/client';
import { getQueryErrorMessage } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { EmptyState, ErrorState, InlineErrorState, LoadingState } from '@/components/screen-state';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ScreenShell } from '@/components/ui/screen-shell';
import { Separator } from '@/components/ui/separator';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HealthFilter, RetainerListSortMode } from '@/stores/retainerListStore';
import { useRootStore } from '@/stores/rootStore';
import type { RetainerSummary } from '@/types/api';
import { formatDate } from '@/utils/date';
import { filterAndSortRetainers, sortLabel } from '@/utils/retainerList';

const healthFilters: HealthFilter[] = ['all', 'red', 'amber', 'green'];
const sortModes: RetainerListSortMode[] = [
  'health',
  'latestCheckInNewest',
  'latestCheckInOldest',
  'clientName',
];
type FilterDraft = {
  healthFilter: HealthFilter;
  showActive: boolean;
  showArchived: boolean;
  sortMode: RetainerListSortMode;
};

const defaultFilterDraft: FilterDraft = {
  healthFilter: 'all',
  showActive: true,
  showArchived: false,
  sortMode: 'health',
};

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

function RetainerRow({ retainer, onPress }: { retainer: RetainerSummary; onPress: () => void }) {
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

function ControlGroup<T extends string>({
  label,
  values,
  children,
}: {
  label: string;
  values: T[];
  children: (value: T) => React.ReactNode;
}) {
  return (
    <View style={styles.controlGroup}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={styles.chipRow}>{values.map(children)}</View>
    </View>
  );
}

function FilterSortModal({
  visible,
  draft,
  onChangeDraft,
  onApply,
  onCancel,
}: {
  visible: boolean;
  draft: FilterDraft;
  onChangeDraft: (draft: FilterDraft) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const updateDraft = useCallback(
    (patch: Partial<FilterDraft>) => onChangeDraft({ ...draft, ...patch }),
    [draft, onChangeDraft],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close filter and sort"
          style={styles.modalBackdrop}
          onPress={onCancel}
        />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.modalHandle} />
          <ThemedText type="subtitle">Filter & Sort</ThemedText>
          {/* Draft state lets Cancel discard modal edits; Apply is the only path
              that commits these local UI preferences into MobX. */}
          <ControlGroup label="Filter" values={healthFilters}>
            {(value) => (
              <Chip
                key={value}
                label={value}
                selected={draft.healthFilter === value}
                onPress={() => updateDraft({ healthFilter: value })}
              />
            )}
          </ControlGroup>
          <View style={styles.controlGroup}>
            <ThemedText type="smallBold">Visibility</ThemedText>
            <SwitchRow
              label="Show Active"
              value={draft.showActive}
              onValueChange={(showActive) => updateDraft({ showActive })}
            />
            <SwitchRow
              label="Show Archived"
              value={draft.showArchived}
              onValueChange={(showArchived) => updateDraft({ showArchived })}
            />
          </View>
          <ControlGroup label="Sort" values={sortModes}>
            {(value) => (
              <Chip
                key={value}
                label={sortLabel(value)}
                selected={draft.sortMode === value}
                onPress={() => updateDraft({ sortMode: value })}
              />
            )}
          </ControlGroup>
          <View style={styles.modalActions}>
            <Button label="Reset" onPress={() => onChangeDraft(defaultFilterDraft)} variant="secondary" />
            <Button label="Cancel" onPress={onCancel} variant="secondary" />
            <Button label="Apply" onPress={onApply} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <ThemedText>{label}</ThemedText>
      <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} />
    </View>
  );
}

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
  controlGroup: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  switchRow: {
    minHeight: 44,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  pressed: {
    opacity: 0.75,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: Spacing.three,
    maxHeight: '88%',
    padding: Spacing.three,
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: '#999999',
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'flex-end',
  },
});
