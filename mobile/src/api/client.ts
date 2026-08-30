import { ApiError, NetworkError } from '@/api/errors';
import { env } from '@/config/env';
import type {
  AtRiskRetainer,
  CheckIn,
  CreateCheckInInput,
  CreateRetainerInput,
  RetainerDetail,
  RetainerSummary,
  UpdateRetainerInput,
} from '@/types/api';

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

type ServerErrorBody = {
  message?: string;
};

const API_PREFIX = '/api/v1';

export async function apiRequest<TResponse, TBody = never>(
  path: string,
  options: Omit<ApiRequestOptions, 'body'> & { body?: TBody } = {},
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${env.apiUrl}${API_PREFIX}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    // Network errors mean fetch never received an HTTP response. API errors
    // below mean the server responded with a non-2xx status and optional JSON.
    throw new NetworkError();
  }

  const body = await parseJson(response);

  if (!response.ok) {
    // Normalize HTTP failures here so query hooks and screens can handle one
    // typed error shape while still showing backend validation/not-found text.
    throw new ApiError(getErrorMessage(body), response.status, body);
  }

  return body as TResponse;
}

export function listRetainers() {
  return apiRequest<RetainerSummary[]>('/retainers');
}

export function listAtRiskRetainers() {
  return apiRequest<AtRiskRetainer[]>('/retainers/at-risk');
}

export function getRetainer(id: string) {
  return apiRequest<RetainerDetail>(`/retainers/${id}`);
}

export function createRetainer(input: CreateRetainerInput) {
  return apiRequest<RetainerDetail, CreateRetainerInput>('/retainers', {
    method: 'POST',
    body: input,
  });
}

export function updateRetainer(id: string, input: UpdateRetainerInput) {
  return apiRequest<RetainerDetail, UpdateRetainerInput>(`/retainers/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function createCheckIn(retainerId: string, input: CreateCheckInInput) {
  return apiRequest<CheckIn, CreateCheckInInput>(`/retainers/${retainerId}/check-ins`, {
    method: 'POST',
    body: input,
  });
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getErrorMessage(body: unknown) {
  if (isServerErrorBody(body) && body.message) {
    return body.message;
  }

  return '';
}

function isServerErrorBody(body: unknown): body is ServerErrorBody {
  return typeof body === 'object' && body !== null && 'message' in body;
}
