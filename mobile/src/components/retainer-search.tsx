import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RetainerListStore } from '@/stores/retainerListStore';
import { sortLabel } from '@/utils/retainerList';

export function RetainerSearch({
  retainerList,
  onOpenFilterModal,
}: {
  retainerList: RetainerListStore;
  onOpenFilterModal: () => void;
}) {
  const theme = useTheme();
  const activeFilterChips = [
    retainerList.searchText.trim()
      ? {
          key: 'search',
          label: `Search: ${retainerList.searchText.trim()} x`,
          onPress: () => retainerList.setSearchText(''),
        }
      : null,
    retainerList.healthFilter !== 'all'
      ? {
          key: 'health',
          label: `Health: ${retainerList.healthFilter} x`,
          onPress: () => retainerList.setHealthFilter('all'),
        }
      : null,
    !retainerList.showActive
      ? {
          key: 'showActive',
          label: 'Active hidden x',
          onPress: () => retainerList.setShowActive(true),
        }
      : null,
    retainerList.showArchived
      ? {
          key: 'showArchived',
          label: 'Archived shown x',
          onPress: () => retainerList.setShowArchived(false),
        }
      : null,
    retainerList.sortMode !== 'health'
      ? {
          key: 'sort',
          label: `Sort: ${sortLabel(retainerList.sortMode)} x`,
          onPress: () => retainerList.setSortMode('health'),
        }
      : null,
  ].filter((chip) => chip !== null);

  return (
    <View style={styles.header}>
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
      {activeFilterChips.length > 0 ? (
        <View style={styles.activeFilterChips}>
          {activeFilterChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} selected={false} onPress={chip.onPress} />
          ))}
        </View>
      ) : null}
      <View style={styles.headerActions}>
        <Button label="Filter & Sort" onPress={onOpenFilterModal} />
        {retainerList.hasActiveFilters ? (
          <Button label="Clear" onPress={retainerList.resetFilters} variant="secondary" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
    marginVertical: Spacing.five,
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
  activeFilterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
