import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listRetainers } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useRootStore } from '@/app/stores/rootStore';
import type { HealthFilter, RetainerListSortMode } from '@/app/stores/retainerListStore';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RetainerSummary } from '@/types/api';

const healthFilters: HealthFilter[] = ['all', 'red', 'amber', 'green'];
const sortModes: RetainerListSortMode[] = ['health', 'latestCheckIn', 'clientName'];
const healthRank: Record<Exclude<HealthFilter, 'all'>, number> = { red: 0, amber: 1, green: 2 };

const RetainerListScreen = observer(function RetainerListScreen() {
  const theme = useTheme();
  const { retainerList } = useRootStore();
  const { data = [], error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.retainers.list(),
    queryFn: listRetainers,
  });

  const visibleRetainers = useMemo(() => {
    const search = retainerList.searchText.trim().toLowerCase();

    // TanStack Query owns the API array. MobX owns only the view preferences;
    // filtering derives a new view and never copies server records into MobX.
    return data
      .filter((retainer) => retainerList.showArchived || retainer.status !== 'archived')
      .filter(
        (retainer) =>
          retainerList.healthFilter === 'all' ||
          retainer.health.status === retainerList.healthFilter,
      )
      .filter(
        (retainer) =>
          !search ||
          retainer.clientName.toLowerCase().includes(search) ||
          retainer.leadEngineer.toLowerCase().includes(search),
      )
      .toSorted((a, b) => compareRetainers(a, b, retainerList.sortMode));
  }, [
    data,
    retainerList.healthFilter,
    retainerList.searchText,
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
    // Pull-to-refresh refetches the same query so cache state and observers stay in sync.
    void refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <ScreenShell>
        <View style={styles.centerState}>
          <ActivityIndicator />
          <ThemedText themeColor="textSecondary">Loading retainers...</ThemedText>
        </View>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <View style={styles.centerState}>
          <ThemedText type="subtitle" style={styles.centerText}>
            Could not load retainers
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
        <ControlGroup label="Health" values={healthFilters}>
          {(value) => (
            <Chip
              key={value}
              label={value}
              selected={retainerList.healthFilter === value}
              onPress={() => retainerList.setHealthFilter(value)}
            />
          )}
        </ControlGroup>
        <View style={styles.switchRow}>
          <ThemedText>Show archived</ThemedText>
          <Switch value={retainerList.showArchived} onValueChange={retainerList.setShowArchived} />
        </View>
        <ControlGroup label="Sort" values={sortModes}>
          {(value) => (
            <Chip
              key={value}
              label={sortLabel(value)}
              selected={retainerList.sortMode === value}
              onPress={() => retainerList.setSortMode(value)}
            />
          )}
        </ControlGroup>
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
              action={retainerList.hasActiveFilters ? retainerList.resetFilters : undefined}
            />
          )
        }
        refreshing={isRefetching && !isLoading}
        onRefresh={onRefresh}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
      />
    </ScreenShell>
  );
});

export default RetainerListScreen;

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </ThemedView>
  );
}

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
        <ThemedText type="smallBold" style={styles.clientName}>
          {retainer.clientName}
        </ThemedText>
        <HealthBadge status={retainer.health.status} />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Lead: {retainer.leadEngineer}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Latest check-in: {formatDate(retainer.latestCheckInDate)}
      </ThemedText>
    </Pressable>
  );
}

function HealthBadge({ status }: { status: Exclude<HealthFilter, 'all'> }) {
  return (
    <View style={[styles.badge, styles[`${status}Badge`]]}>
      <ThemedText type="code" style={styles.badgeText}>
        {status.toUpperCase()}
      </ThemedText>
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.text : theme.backgroundElement,
        },
      ]}>
      <ThemedText type="small" style={{ color: selected ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
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

function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <ThemedText type="smallBold" style={styles.centerText}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
        {message}
      </ThemedText>
      {action ? <Button label="Clear filters" onPress={action} /> : null}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function compareRetainers(
  a: RetainerSummary,
  b: RetainerSummary,
  sortMode: RetainerListSortMode,
) {
  if (sortMode === 'health') {
    return healthRank[a.health.status] - healthRank[b.health.status] || compareClientName(a, b);
  }

  if (sortMode === 'latestCheckIn') {
    // Null dates sort first with oldest check-ins so neglected retainers stay visible.
    return (
      latestCheckInMs(a.latestCheckInDate) - latestCheckInMs(b.latestCheckInDate) ||
      compareClientName(a, b)
    );
  }

  return compareClientName(a, b);
}

function latestCheckInMs(date: string | null) {
  return date ? new Date(date).getTime() : 0;
}

function compareClientName(a: RetainerSummary, b: RetainerSummary) {
  return a.clientName.localeCompare(b.clientName);
}

function formatDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString() : 'None';
}

function sortLabel(sortMode: RetainerListSortMode) {
  if (sortMode === 'latestCheckIn') return 'latest check-in';
  if (sortMode === 'clientName') return 'client name';
  return sortMode;
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
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  controlGroup: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 44,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
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
  badge: {
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
    minHeight: 44,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.75,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    justifyContent: 'center',
    padding: Spacing.four,
  },
});
