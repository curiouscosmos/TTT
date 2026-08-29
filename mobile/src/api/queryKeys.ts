export const queryKeys = {
  retainers: ['retainers'] as const,
  atRiskRetainers: ['retainers', 'at-risk'] as const,
  retainer: (id: string) => ['retainers', id] as const,
  checkIns: (retainerId: string) => ['retainers', retainerId, 'check-ins'] as const,
};
