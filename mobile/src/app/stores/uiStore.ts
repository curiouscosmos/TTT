import { makeAutoObservable } from 'mobx';

export class UiStore {
  selectedRiskFilter = 'all';

  constructor() {
    makeAutoObservable(this);
  }

  setSelectedRiskFilter(filter: string) {
    this.selectedRiskFilter = filter;
  }
}
