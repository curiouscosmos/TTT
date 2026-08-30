type ErrorMessageOptions = {
  notFoundMessage?: string;
  validationMessage?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Network unavailable. Check your connection and try again.');
    this.name = 'NetworkError';
  }
}

export function getQueryErrorMessage(error: unknown, options: ErrorMessageOptions = {}) {
  // Query failures block the screen's primary data, so callers show these in a
  // full-screen ErrorState with Retry instead of a transient alert/modal.
  return getUserFacingErrorMessage(error, {
    validationMessage: 'Request could not be completed. Please try again.',
    ...options,
  });
}

export function getMutationErrorMessage(error: unknown, options: ErrorMessageOptions = {}) {
  // Mutation failures happen after a user submits a form. Keep them inline so
  // users can correct input or retry without modal spam.
  return getUserFacingErrorMessage(error, {
    validationMessage: 'Please check the form and try again.',
    ...options,
  });
}

function getUserFacingErrorMessage(error: unknown, options: ErrorMessageOptions) {
  if (error instanceof NetworkError) {
    return error.message;
  }

  if (error instanceof ApiError) {
    if (error.status === 404) {
      return error.message || options.notFoundMessage || 'The requested retainer could not be found.';
    }

    if (error.status >= 400 && error.status < 500) {
      return error.message || options.validationMessage || 'Request could not be completed.';
    }

    if (error.status >= 500) {
      return 'Server error. Please try again.';
    }
  }

  return 'Something went wrong. Please try again.';
}
