export type IntegrationErrorCode =
  | 'integration_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'upstream_validation_error'
  | 'upstream_not_found_error'
  | 'upstream_conflict_error'
  | 'upstream_rate_limit_error'
  | 'upstream_unavailable_error'
  | 'upstream_timeout_error'
  | 'upstream_malformed_response_error'
  | 'upstream_unknown_error';

export type IntegrationErrorOptions = {
  message: string;
  sourceSystem: string;
  operation: string;
  httpStatus?: number;
  upstreamStatus?: number;
  retryable?: boolean;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  cause?: unknown;
};

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;
  readonly sourceSystem: string;
  readonly operation: string;
  readonly httpStatus?: number;
  readonly upstreamStatus?: number;
  readonly retryable: boolean;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly cause?: unknown;

  constructor(code: IntegrationErrorCode, options: IntegrationErrorOptions) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = code;
    this.sourceSystem = options.sourceSystem;
    this.operation = options.operation;
    this.httpStatus = options.httpStatus;
    this.upstreamStatus = options.upstreamStatus;
    this.retryable = options.retryable ?? false;
    this.correlationId = options.correlationId;
    this.metadata = options.metadata;
    this.cause = options.cause;
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('authentication_error', { ...options, retryable: false });
  }
}

export class AuthorizationError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('authorization_error', { ...options, retryable: false });
  }
}

export class UpstreamValidationError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('upstream_validation_error', { ...options, retryable: false });
  }
}

export class UpstreamNotFoundError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('upstream_not_found_error', { ...options, retryable: false });
  }
}

export class UpstreamConflictError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('upstream_conflict_error', { ...options, retryable: false });
  }
}

export class UpstreamRateLimitError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('upstream_rate_limit_error', { ...options, retryable: true });
  }
}

export class UpstreamUnavailableError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('upstream_unavailable_error', { ...options, retryable: true });
  }
}

export class UpstreamTimeoutError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('upstream_timeout_error', { ...options, retryable: true });
  }
}

export class UpstreamMalformedResponseError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('upstream_malformed_response_error', { ...options, retryable: false });
  }
}

export class UpstreamUnknownError extends IntegrationError {
  constructor(options: IntegrationErrorOptions) {
    super('upstream_unknown_error', { ...options, retryable: options.retryable ?? false });
  }
}

export function toIntegrationError(input: {
  sourceSystem: string;
  operation: string;
  error: unknown;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): IntegrationError {
  if (input.error instanceof IntegrationError) {
    return input.error;
  }

  if (input.error instanceof Error && input.error.name === 'AbortError') {
    return new UpstreamTimeoutError({
      message: `${input.sourceSystem} request timed out during ${input.operation}`,
      sourceSystem: input.sourceSystem,
      operation: input.operation,
      correlationId: input.correlationId,
      metadata: input.metadata,
      cause: input.error,
    });
  }

  return new UpstreamUnknownError({
    message: `${input.sourceSystem} request failed during ${input.operation}`,
    sourceSystem: input.sourceSystem,
    operation: input.operation,
    correlationId: input.correlationId,
    metadata: input.metadata,
    cause: input.error,
  });
}
