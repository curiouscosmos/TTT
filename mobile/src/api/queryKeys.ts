export const queryKeys = {
  retainers: {
    // Centralized keys keep later mutation invalidation precise without each
    // screen hand-writing cache key arrays.
    all: ['retainers'] as const,
    lists: () => [...queryKeys.retainers.all, 'list'] as const,
    list: () => [...queryKeys.retainers.lists()] as const,
    atRisk: ['retainers', 'list', 'at-risk'] as const,
    detail: (id: string) => [...queryKeys.retainers.all, 'detail', id] as const,
    checkIns: (retainerId: string) =>
      [...queryKeys.retainers.detail(retainerId), 'check-ins'] as const,
  },
};
