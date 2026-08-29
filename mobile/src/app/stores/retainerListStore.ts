import { makeAutoObservable } from 'mobx';

export type HealthFilter = 'all' | 'green' | 'amber' | 'red';
export type RetainerListSortMode = 'health' | 'latestCheckIn' | 'clientName';

export class RetainerListStore {
  searchText = '';
  healthFilter: HealthFilter = 'all';
  showArchived = false;
  sortMode: RetainerListSortMode = 'health';

  constructor() {
    makeAutoObservable(this);
  }

  // These are local list controls, not server state. Query responses must stay
  // in TanStack Query and must not be copied into MobX.
  get hasActiveFilters() {
    return this.searchText.trim().length > 0 || this.healthFilter !== 'all' || this.showArchived;
  }

  setSearchText(searchText: string) {
    this.searchText = searchText;
  }

  setHealthFilter(healthFilter: HealthFilter) {
    this.healthFilter = healthFilter;
  }

  setShowArchived(showArchived: boolean) {
    this.showArchived = showArchived;
  }

  setSortMode(sortMode: RetainerListSortMode) {
    this.sortMode = sortMode;
  }

  resetFilters() {
    this.searchText = '';
    this.healthFilter = 'all';
    // The default list hides archived retainers, so showing them counts as an active filter.
    this.showArchived = false;
  }
}
