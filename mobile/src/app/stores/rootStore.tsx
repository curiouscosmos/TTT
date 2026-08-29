import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import { UiStore } from '@/app/stores/uiStore';

class RootStore {
  // MobX is reserved for local UI state. Retainers, check-ins, and API loading
  // state stay in TanStack Query so there is one server-state owner.
  ui = new UiStore();
}

const StoreContext = createContext<RootStore | null>(null);

export function StoreProvider({ children }: PropsWithChildren) {
  const store = useMemo(() => new RootStore(), []);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useRootStore() {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error('useRootStore must be used inside StoreProvider');
  }

  return store;
}
