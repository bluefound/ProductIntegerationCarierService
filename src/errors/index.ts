/**
 * Custom error classes for structured error handling across the carrier integration service.
 * Follows a hierarchical pattern for easy error categorization and handling.
 */

import type { CarrierName } from '../domain/types.js';

/**
 * Base error class for all carrier-related errors.
 * Provides carrier name, error code, and context for structured error handling.
 */
export class CarrierError extends Error {
    /** Error code for programmatic handling */
    readonly code: string;
    /** Carrier that produced the error (optional for non-carrier-specific errors) */
    readonly carrier: CarrierName | undefined;
    /** Additional context for debugging */
    readonly context: Record<string, unknown> | undefined;
    /** Timestamp when the error occurred */
    readonly timestamp: string;

    constructor(
        message: string,
        code: string,
        options?: {
            carrier?: CarrierName;
            context?: Record<string, unknown>;
            cause?: Error;
        }
    ) {
        super(message, { cause: options?.cause });
        this.name = 'CarrierError';
        this.code = code;
        this.carrier = options?.carrier;
        this.context = options?.context;
        this.timestamp = new Date().toISOString();

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CarrierError);
        }
    }

    /**
     * Convert error to a structured JSON object for logging/serialization.
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            carrier: this.carrier,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack,
            cause: this.cause instanceof Error ? this.cause.message : undefined,
        };
    }
}

/**
 * Error thrown when OAuth authentication fails.
 */
export class AuthenticationError extends CarrierError {
    constructor(
        message: string,
        options?: {
            carrier?: CarrierName;
            context?: Record<string, unknown>;
            cause?: Error;
        }
    ) {
        super(message, 'AUTH_ERROR', options);
        this.name = 'AuthenticationError';
    }
}

/**
 * Error thrown when a request is rate limited by the carrier API.
 * Includes retry-after information when available.
 */
export class RateLimitError extends CarrierError {
    /** Seconds to wait before retrying */
    readonly retryAfterSeconds: number | undefined;

    constructor(
        message: string,
        options?: {
            carrier?: CarrierName;
            retryAfterSeconds?: number;
            context?: Record<string, unknown>;
            cause?: Error;
        }
    ) {
        super(message, 'RATE_LIMIT_ERROR', options);
        this.name = 'RateLimitError';
        this.retryAfterSeconds = options?.retryAfterSeconds;
    }

    override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            retryAfterSeconds: this.retryAfterSeconds,
        };
    }
}

/**
 * Error thrown when request validation fails.
 * Includes field-level validation errors for detailed feedback.
 */
export class ValidationError extends CarrierError {
    /** Field-level validation errors */
    readonly fieldErrors: Record<string, string[]>;

    constructor(
        message: string,
        fieldErrors: Record<string, string[]>,
        options?: {
            carrier?: CarrierName;
            context?: Record<string, unknown>;
            cause?: Error;
        }
    ) {
        super(message, 'VALIDATION_ERROR', options);
        this.name = 'ValidationError';
        this.fieldErrors = fieldErrors;
    }

    override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            fieldErrors: this.fieldErrors,
        };
    }
}

/**
 * Error thrown when a network request fails (timeout, connection refused, etc.).
 */
export class NetworkError extends CarrierError {
    /** Whether the request timed out */
    readonly isTimeout: boolean;

    constructor(
        message: string,
        options?: {
            carrier?: CarrierName;
            isTimeout?: boolean;
            context?: Record<string, unknown>;
            cause?: Error;
        }
    ) {
        super(message, 'NETWORK_ERROR', options);
        this.name = 'NetworkError';
        this.isTimeout = options?.isTimeout ?? false;
    }

    override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            isTimeout: this.isTimeout,
        };
    }
}

/**
 * Error thrown when the carrier API returns an error response.
 */
export class CarrierApiError extends CarrierError {
    /** HTTP status code from the carrier API */
    readonly statusCode: number | undefined;
    /** Raw response body from the carrier API */
    readonly responseBody: unknown | undefined;

    constructor(
        message: string,
        options?: {
            carrier?: CarrierName;
            statusCode?: number;
            responseBody?: unknown;
            context?: Record<string, unknown>;
            cause?: Error;
        }
    ) {
        super(message, 'CARRIER_API_ERROR', options);
        this.name = 'CarrierApiError';
        this.statusCode = options?.statusCode;
        this.responseBody = options?.responseBody;
    }

    override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            statusCode: this.statusCode,
            responseBody: this.responseBody,
        };
    }
}

/**
 * Error thrown when a requested operation is not implemented.
 */
export class NotImplementedError extends CarrierError {
    constructor(
        operation: string,
        options?: {
            carrier?: CarrierName;
            context?: Record<string, unknown>;
        }
    ) {
        super(`Operation '${operation}' is not implemented`, 'NOT_IMPLEMENTED', options);
        this.name = 'NotImplementedError';
    }
}

/**
 * Error thrown when configuration is invalid or missing.
 */
export class ConfigurationError extends CarrierError {
    /** Missing or invalid configuration keys */
    readonly missingKeys: string[];

    constructor(
        message: string,
        missingKeys: string[],
        options?: {
            context?: Record<string, unknown>;
            cause?: Error;
        }
    ) {
        super(message, 'CONFIGURATION_ERROR', options);
        this.name = 'ConfigurationError';
        this.missingKeys = missingKeys;
    }

    override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            missingKeys: this.missingKeys,
        };
    }
}

/**
 * Type guard to check if an error is a CarrierError.
 */
export function isCarrierError(error: unknown): error is CarrierError {
    return error instanceof CarrierError;
}

/**
 * Type guard to check if an error is retryable (network errors, rate limits).
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof NetworkError) {
        return true;
    }
    if (error instanceof RateLimitError) {
        return true;
    }
    if (error instanceof CarrierApiError && error.statusCode !== undefined) {
        // 5xx errors are typically retryable
        return error.statusCode >= 500 && error.statusCode < 600;
    }
    return false;
}
