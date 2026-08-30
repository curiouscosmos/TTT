import { makeAutoObservable } from 'mobx';

export type HealthFilter = 'all' | 'green' | 'amber' | 'red';
export type RetainerListSortMode =
  | 'health'
  | 'latestCheckInNewest'
  | 'latestCheckInOldest'
  | 'clientName';

export class RetainerListStore {
  searchText = '';
  healthFilter: HealthFilter = 'all';
  showActive = true;
  showArchived = false;
  sortMode: RetainerListSortMode = 'health';

  constructor() {
    makeAutoObservable(this);
  }

  // These are local list controls, not server state. Query responses must stay
  // in TanStack Query and must not be copied into MobX.
  get hasActiveFilters() {
    return (
      this.searchText.trim().length > 0 ||
      this.healthFilter !== 'all' ||
      !this.showActive ||
      this.showArchived
    );
  }

  setSearchText(searchText: string) {
    this.searchText = searchText;
  }

  setHealthFilter(healthFilter: HealthFilter) {
    this.healthFilter = healthFilter;
  }

  setShowActive(showActive: boolean) {
    this.showActive = showActive;
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
    this.showActive = true;
    // The default list hides archived retainers, so showing them counts as an active filter.
    this.showArchived = false;
    this.sortMode = 'health';
  }
}
