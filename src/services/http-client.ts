/**
 * HTTP client wrapper with error handling and interceptors.
 * Provides a consistent interface for making carrier API requests.
 */

import axios, {
    AxiosInstance,
    AxiosError,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
    AxiosResponse,
} from 'axios';
import {
    NetworkError,
    CarrierApiError,
    RateLimitError,
    AuthenticationError,
} from '../errors/index.js';
import type { CarrierName } from '../domain/types.js';

/**
 * HTTP client configuration options.
 */
export interface HttpClientConfig {
    /** Base URL for all requests */
    readonly baseUrl: string;
    /** Request timeout in milliseconds */
    readonly timeoutMs?: number;
    /** Default headers to include in all requests */
    readonly defaultHeaders?: Record<string, string>;
    /** Carrier name for error context */
    readonly carrier: CarrierName;
    /** Enable request/response logging */
    readonly enableLogging?: boolean;
}

/**
 * Logger interface for HTTP client.
 */
export interface HttpLogger {
    debug(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Default no-op logger.
 */
const noopLogger: HttpLogger = {
    debug: () => { },
    error: () => { },
};

/**
 * HTTP client wrapper with structured error handling.
 * 
 * Features:
 * - Automatic error transformation to domain errors
 * - Request/response logging (optional)
 * - Timeout handling
 * - Rate limit detection
 */
export class HttpClient {
    readonly client: AxiosInstance;
    private readonly config: HttpClientConfig;
    private readonly logger: HttpLogger;
    private authTokenProvider?: () => Promise<string>;

    constructor(config: HttpClientConfig, logger: HttpLogger = noopLogger) {
        this.config = config;
        this.logger = logger;

        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeoutMs ?? 30000,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...config.defaultHeaders,
            },
        });

        this.setupInterceptors();
    }

    /**
     * Set the auth token provider for automatic Authorization header injection.
     */
    setAuthTokenProvider(provider: () => Promise<string>): void {
        this.authTokenProvider = provider;
    }

    /**
     * Make a GET request.
     */
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.get<T>(url, config);
            return response.data;
        } catch (error) {
            throw this.transformError(error);
        }
    }

    /**
     * Make a POST request.
     */
    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.post<T>(url, data, config);
            return response.data;
        } catch (error) {
            throw this.transformError(error);
        }
    }

    /**
     * Make a PUT request.
     */
    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.put<T>(url, data, config);
            return response.data;
        } catch (error) {
            throw this.transformError(error);
        }
    }

    /**
     * Make a DELETE request.
     */
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.delete<T>(url, config);
            return response.data;
        } catch (error) {
            throw this.transformError(error);
        }
    }

    /**
     * Set up request/response interceptors.
     */
    private setupInterceptors(): void {
        // Request interceptor for logging and auth
        this.client.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                // Inject auth token if provider is set
                if (this.authTokenProvider && !config.headers['Authorization']) {
                    try {
                        const token = await this.authTokenProvider();
                        config.headers['Authorization'] = `Bearer ${token}`;
                    } catch (error) {
                        this.logger.error('Failed to get auth token', { error });
                        throw error;
                    }
                }

                if (this.config.enableLogging) {
                    this.logger.debug('HTTP Request', {
                        method: config.method?.toUpperCase(),
                        url: config.url,
                        baseURL: config.baseURL,
                    });
                }

                return config;
            },
            (error: AxiosError) => {
                this.logger.error('Request interceptor error', { error: error.message });
                return Promise.reject(error);
            }
        );

        // Response interceptor for logging
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                if (this.config.enableLogging) {
                    this.logger.debug('HTTP Response', {
                        status: response.status,
                        url: response.config.url,
                    });
                }
                return response;
            },
            (error: AxiosError) => {
                if (this.config.enableLogging) {
                    this.logger.error('HTTP Error Response', {
                        status: error.response?.status,
                        url: error.config?.url,
                        message: error.message,
                    });
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Transform Axios errors into domain errors.
     */
    private transformError(error: unknown): Error {
        if (!this.isAxiosError(error)) {
            if (error instanceof Error) {
                return new NetworkError(`Request failed: ${error.message}`, {
                    carrier: this.config.carrier,
                    cause: error,
                });
            }
            return new NetworkError('Request failed with unknown error', {
                carrier: this.config.carrier,
            });
        }

        // Handle timeout
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return new NetworkError('Request timed out', {
                carrier: this.config.carrier,
                isTimeout: true,
                cause: error,
            });
        }

        // Handle network errors (no response)
        if (!error.response) {
            return new NetworkError(`Network error: ${error.message}`, {
                carrier: this.config.carrier,
                cause: error,
                context: { code: error.code },
            });
        }

        const status = error.response.status;
        const data = error.response.data as Record<string, unknown> | undefined;

        // Handle authentication errors
        if (status === 401) {
            return new AuthenticationError('Authentication failed', {
                carrier: this.config.carrier,
                context: { responseData: data },
                cause: error,
            });
        }

        // Handle rate limiting
        if (status === 429) {
            const retryAfter = this.parseRetryAfter(error.response.headers);
            return new RateLimitError('Rate limit exceeded', {
                carrier: this.config.carrier,
                retryAfterSeconds: retryAfter,
                context: { responseData: data },
                cause: error,
            });
        }

        // Handle other API errors
        const message = this.extractErrorMessage(data) ?? `API error with status ${status}`;
        return new CarrierApiError(message, {
            carrier: this.config.carrier,
            statusCode: status,
            responseBody: data,
            cause: error,
        });
    }

    /**
     * Type guard for Axios errors.
     */
    private isAxiosError(error: unknown): error is AxiosError {
        return axios.isAxiosError(error);
    }

    /**
     * Parse Retry-After header value.
     */
    private parseRetryAfter(headers: Record<string, unknown>): number | undefined {
        const retryAfter = headers['retry-after'];
        if (typeof retryAfter === 'string') {
            const seconds = parseInt(retryAfter, 10);
            return isNaN(seconds) ? undefined : seconds;
        }
        return undefined;
    }

    /**
     * Extract error message from response body.
     */
    private extractErrorMessage(data: Record<string, unknown> | undefined): string | undefined {
        if (!data) return undefined;

        // Common error message fields
        const messageFields = ['message', 'error', 'error_description', 'errorMessage'];
        for (const field of messageFields) {
            if (typeof data[field] === 'string') {
                return data[field];
            }
        }

        // Handle nested errors
        if (typeof data['errors'] === 'object' && data['errors'] !== null) {
            const errors = data['errors'] as Record<string, unknown>;
            if (Array.isArray(errors)) {
                const firstError = errors[0];
                if (typeof firstError === 'object' && firstError !== null) {
                    const errorObj = firstError as Record<string, unknown>;
                    if (typeof errorObj['message'] === 'string') {
                        return errorObj['message'];
                    }
                }
            }
        }

        return undefined;
    }
}

/**
 * Create a pre-configured HTTP client instance.
 */
export function createHttpClient(config: HttpClientConfig, logger?: HttpLogger): HttpClient {
    return new HttpClient(config, logger);
}
