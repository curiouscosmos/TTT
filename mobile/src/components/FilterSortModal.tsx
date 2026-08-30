import { useCallback, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HealthFilter, RetainerListSortMode } from '@/stores/retainerListStore';
import { sortLabel } from '@/utils/retainerList';

const healthFilters: HealthFilter[] = ['all', 'red', 'amber', 'green'];
const sortModes: RetainerListSortMode[] = [
  'health',
  'latestCheckInNewest',
  'latestCheckInOldest',
  'clientName',
];

export type FilterDraft = {
  healthFilter: HealthFilter;
  showActive: boolean;
  showArchived: boolean;
  sortMode: RetainerListSortMode;
};

export const defaultFilterDraft: FilterDraft = {
  healthFilter: 'all',
  showActive: true,
  showArchived: false,
  sortMode: 'health',
};

export function FilterSortModal({
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
          <View style={[styles.controlGroup, {marginTop: Spacing.three}]}>
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

function ControlGroup<T extends string>({
  label,
  values,
  children,
}: {
  label: string;
  values: T[];
  children: (value: T) => ReactNode;
}) {
  return (
    <View style={styles.controlGroup}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={styles.chipRow}>{values.map(children)}</View>
    </View>
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
  controlGroup: {
    width: '100%',
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: '#999999',
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  modalActions: {
    marginTop: Spacing.four,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'center',
  },
});
