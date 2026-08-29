export type HealthStatus = 'green' | 'amber' | 'red';
export type RetainerStatus = 'active' | 'archived';

export type HealthResult = {
  status: HealthStatus;
  reason: string;
};

// API dates arrive as JSON strings. Keep conversion at the UI/form boundary so
// this transport layer does not hide timezone behavior from screen code.
export type Retainer = {
  id: string;
  clientName: string;
  startDate: string;
  status: RetainerStatus;
  leadEngineer: string;
  createdAt: string;
  updatedAt: string;
};

export type RetainerSummary = Pick<
  Retainer,
  'id' | 'clientName' | 'startDate' | 'status' | 'leadEngineer'
> & {
  latestCheckInDate: string | null;
  health: HealthResult;
};

export type CheckIn = {
  id: string;
  retainerId: string;
  date: string;
  summary: string;
  ragStatus: HealthStatus;
  riskNote: string | null;
  createdAt: string;
};

export type RetainerDetail = RetainerSummary &
  Pick<Retainer, 'createdAt' | 'updatedAt'> & {
    checkIns: CheckIn[];
  };

export type AtRiskRetainer = Pick<
  RetainerSummary,
  'id' | 'clientName' | 'leadEngineer' | 'latestCheckInDate' | 'health'
>;

export type CreateRetainerInput = {
  clientName: string;
  startDate: string;
  status?: RetainerStatus;
  leadEngineer: string;
};

export type UpdateRetainerInput = Partial<CreateRetainerInput>;

export type CreateCheckInInput = {
  date: string;
  summary: string;
  ragStatus: HealthStatus;
  riskNote?: string;
};
