import type { HealthFilter, RetainerListSortMode } from '@/stores/retainerListStore';
import type { RetainerSummary } from '@/types/api';

const healthRank: Record<Exclude<HealthFilter, 'all'>, number> = { red: 0, amber: 1, green: 2 };

export function filterAndSortRetainers(
  retainers: RetainerSummary[],
  options: {
    searchText: string;
    healthFilter: HealthFilter;
    showActive: boolean;
    showArchived: boolean;
    sortMode: RetainerListSortMode;
  },
) {
  const search = options.searchText.trim().toLowerCase();

  return retainers
    .filter(
      (retainer) =>
        (retainer.status === 'active' && options.showActive) ||
        (retainer.status === 'archived' && options.showArchived),
    )
    .filter(
      (retainer) =>
        options.healthFilter === 'all' || retainer.health.status === options.healthFilter,
    )
    .filter(
      (retainer) =>
        !search ||
        retainer.clientName.toLowerCase().includes(search) ||
        retainer.leadEngineer.toLowerCase().includes(search),
    )
    .slice()
    .sort((a, b) => compareRetainers(a, b, options.sortMode));
}

export function sortLabel(sortMode: RetainerListSortMode) {
  if (sortMode === 'latestCheckInNewest') return 'Latest check-in newest';
  if (sortMode === 'latestCheckInOldest') return 'Latest check-in oldest';
  if (sortMode === 'clientName') return 'Client name A-Z';
  return 'Health severity';
}

function compareRetainers(a: RetainerSummary, b: RetainerSummary, sortMode: RetainerListSortMode) {
  if (sortMode === 'health') {
    return healthRank[a.health.status] - healthRank[b.health.status] || compareClientName(a, b);
  }

  if (sortMode === 'latestCheckInNewest') {
    return (
      latestCheckInMs(b.latestCheckInDate, Number.NEGATIVE_INFINITY) -
        latestCheckInMs(a.latestCheckInDate, Number.NEGATIVE_INFINITY) || compareClientName(a, b)
    );
  }

  if (sortMode === 'latestCheckInOldest') {
    // Null dates sort first with oldest check-ins so neglected retainers stay visible.
    return (
      latestCheckInMs(a.latestCheckInDate, 0) - latestCheckInMs(b.latestCheckInDate, 0) ||
      compareClientName(a, b)
    );
  }

  return compareClientName(a, b);
}

function latestCheckInMs(date: string | null, fallback: number) {
  return date ? new Date(date).getTime() : fallback;
}

function compareClientName(a: RetainerSummary, b: RetainerSummary) {
  return a.clientName.localeCompare(b.clientName);
}
