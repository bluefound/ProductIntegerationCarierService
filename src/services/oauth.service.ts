/**
 * OAuth 2.0 service for managing carrier API authentication.
 * Implements client credentials flow with token caching and refresh.
 */

import type { AxiosInstance } from 'axios';
import { AuthenticationError } from '../errors/index.js';
import type { CarrierName } from '../domain/types.js';

/**
 * OAuth token with metadata.
 */
export interface OAuthToken {
    /** Access token value */
    readonly accessToken: string;
    /** Token type (typically 'Bearer') */
    readonly tokenType: string;
    /** Expiration timestamp in milliseconds */
    readonly expiresAt: number;
    /** Scope of the token (if provided) */
    readonly scope?: string | undefined;
}

/**
 * OAuth service configuration.
 */
export interface OAuthServiceConfig {
    /** OAuth token endpoint URL */
    readonly tokenUrl: string;
    /** Client ID for authentication */
    readonly clientId: string;
    /** Client secret for authentication */
    readonly clientSecret: string;
    /** Additional headers to include (e.g., x-merchant-id) */
    readonly additionalHeaders?: Record<string, string>;
    /** Buffer time in seconds before expiry to trigger refresh */
    readonly refreshBufferSeconds?: number;
    /** Carrier name for error context */
    readonly carrier: CarrierName;
}

/**
 * OAuth token response from the authorization server.
 */
interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope?: string;
}

/**
 * OAuth 2.0 service implementing client credentials flow with caching.
 * 
 * Features:
 * - Token caching in memory
 * - Automatic refresh before expiry
 * - Thread-safe refresh (prevents concurrent token requests)
 * - Structured error handling
 */
export class OAuthService {
    private readonly config: OAuthServiceConfig;
    private readonly httpClient: AxiosInstance;
    private cachedToken: OAuthToken | null = null;
    private refreshPromise: Promise<OAuthToken> | null = null;

    constructor(httpClient: AxiosInstance, config: OAuthServiceConfig) {
        this.httpClient = httpClient;
        this.config = {
            ...config,
            refreshBufferSeconds: config.refreshBufferSeconds ?? 300,
        };
    }

    /**
     * Get a valid access token, refreshing if necessary.
     * 
     * @returns Promise resolving to a valid OAuth token
     * @throws {AuthenticationError} If token acquisition fails
     */
    async getToken(): Promise<OAuthToken> {
        // Return cached token if still valid
        if (this.isTokenValid()) {
            return this.cachedToken!;
        }

        // If a refresh is already in progress, wait for it
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        // Start a new refresh
        this.refreshPromise = this.refreshToken();

        try {
            const token = await this.refreshPromise;
            return token;
        } finally {
            this.refreshPromise = null;
        }
    }

    /**
     * Force a token refresh regardless of current token validity.
     * 
     * @returns Promise resolving to a new OAuth token
     * @throws {AuthenticationError} If token acquisition fails
     */
    async forceRefresh(): Promise<OAuthToken> {
        this.cachedToken = null;
        return this.getToken();
    }

    /**
     * Clear the cached token.
     */
    clearCache(): void {
        this.cachedToken = null;
        this.refreshPromise = null;
    }

    /**
     * Check if the current token is valid and not expiring soon.
     */
    private isTokenValid(): boolean {
        if (!this.cachedToken) {
            return false;
        }

        const bufferMs = (this.config.refreshBufferSeconds ?? 300) * 1000;
        const expiryThreshold = Date.now() + bufferMs;

        return this.cachedToken.expiresAt > expiryThreshold;
    }

    /**
     * Request a new token from the authorization server.
     */
    private async refreshToken(): Promise<OAuthToken> {
        try {
            // Create Base64-encoded credentials
            const credentials = Buffer.from(
                `${this.config.clientId}:${this.config.clientSecret}`
            ).toString('base64');

            const response = await this.httpClient.post<TokenResponse>(
                this.config.tokenUrl,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Basic ${credentials}`,
                        ...this.config.additionalHeaders,
                    },
                }
            );

            const token = this.parseTokenResponse(response.data);
            this.cachedToken = token;

            return token;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    /**
     * Parse the token response into our OAuthToken structure.
     */
    private parseTokenResponse(response: TokenResponse): OAuthToken {
        const expiresAt = Date.now() + response.expires_in * 1000;

        return {
            accessToken: response.access_token,
            tokenType: response.token_type,
            expiresAt,
            scope: response.scope,
        };
    }

    /**
     * Transform authentication errors into structured AuthenticationError.
     */
    private handleAuthError(error: unknown): AuthenticationError {
        if (error instanceof AuthenticationError) {
            return error;
        }

        // Handle Axios errors
        if (this.isAxiosError(error)) {
            const status = error.response?.status;
            const data = error.response?.data as Record<string, unknown> | undefined;

            if (status === 401) {
                return new AuthenticationError('Invalid client credentials', {
                    carrier: this.config.carrier,
                    context: { responseData: data },
                    cause: error as Error,
                });
            }

            if (status === 400) {
                const errorDesc = data?.['error_description'] ?? data?.['error'] ?? 'Bad request';
                return new AuthenticationError(`OAuth request failed: ${String(errorDesc)}`, {
                    carrier: this.config.carrier,
                    context: { responseData: data },
                    cause: error as Error,
                });
            }

            return new AuthenticationError(`OAuth request failed with status ${status ?? 'unknown'}`, {
                carrier: this.config.carrier,
                context: { status, responseData: data },
                cause: error as Error,
            });
        }

        // Handle network errors
        if (error instanceof Error) {
            return new AuthenticationError(`OAuth request failed: ${error.message}`, {
                carrier: this.config.carrier,
                cause: error,
            });
        }

        return new AuthenticationError('OAuth request failed with unknown error', {
            carrier: this.config.carrier,
        });
    }

    /**
     * Type guard for Axios errors.
     */
    private isAxiosError(
        error: unknown
    ): error is { response?: { status?: number; data?: unknown }; message: string } {
        return (
            typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof (error as { message: unknown }).message === 'string'
        );
    }
}
