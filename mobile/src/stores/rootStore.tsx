import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import { RetainerListStore } from '@/stores/retainerListStore';

class RootStore {
  // State ownership: MobX keeps client-only UI preferences; TanStack Query owns
  // API data/loading/errors; React Hook Form owns form state; Expo Router owns routes.
  retainerList = new RetainerListStore();
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
