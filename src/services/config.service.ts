/**
 * Configuration service for managing environment-based configuration.
 * Validates required environment variables on startup.
 */

import { z } from 'zod';
import { ConfigurationError } from '../errors/index.js';

/**
 * Schema for UPS-specific configuration.
 */
const UPSConfigSchema = z.object({
    clientId: z.string().min(1, 'UPS_CLIENT_ID is required'),
    clientSecret: z.string().min(1, 'UPS_CLIENT_SECRET is required'),
    merchantId: z.string().min(1, 'UPS_MERCHANT_ID is required'),
    baseUrl: z.string().url('UPS_BASE_URL must be a valid URL'),
    oauthUrl: z.string().url('UPS_OAUTH_URL must be a valid URL'),
});

export type UPSConfig = z.infer<typeof UPSConfigSchema>;

/**
 * Schema for application configuration.
 */
const AppConfigSchema = z.object({
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    requestTimeoutMs: z.coerce.number().positive().default(30000),
    tokenRefreshBufferSeconds: z.coerce.number().positive().default(300),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Complete configuration structure.
 */
export interface Config {
    readonly ups: UPSConfig;
    readonly app: AppConfig;
}

/**
 * Configuration service singleton.
 * Loads and validates configuration from environment variables.
 */
export class ConfigService {
    private static instance: ConfigService | null = null;
    private readonly config: Config;

    private constructor(config: Config) {
        this.config = config;
    }

    /**
     * Get the singleton ConfigService instance.
     * Initializes configuration from environment on first call.
     * 
     * @throws {ConfigurationError} If required environment variables are missing
     */
    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService(ConfigService.loadFromEnv());
        }
        return ConfigService.instance;
    }

    /**
     * Reset the singleton instance (useful for testing).
     */
    static resetInstance(): void {
        ConfigService.instance = null;
    }

    /**
     * Create a ConfigService with provided configuration (useful for testing).
     */
    static createWithConfig(config: Config): ConfigService {
        return new ConfigService(config);
    }

    /**
     * Load configuration from environment variables.
     * 
     * @throws {ConfigurationError} If required environment variables are missing or invalid
     */
    private static loadFromEnv(): Config {
        const missingKeys: string[] = [];

        // Check required UPS environment variables
        const requiredUpsVars = [
            'UPS_CLIENT_ID',
            'UPS_CLIENT_SECRET',
            'UPS_MERCHANT_ID',
        ] as const;

        for (const key of requiredUpsVars) {
            if (!process.env[key]) {
                missingKeys.push(key);
            }
        }

        if (missingKeys.length > 0) {
            throw new ConfigurationError(
                `Missing required environment variables: ${missingKeys.join(', ')}`,
                missingKeys
            );
        }

        // Parse UPS configuration
        const upsResult = UPSConfigSchema.safeParse({
            clientId: process.env['UPS_CLIENT_ID'],
            clientSecret: process.env['UPS_CLIENT_SECRET'],
            merchantId: process.env['UPS_MERCHANT_ID'],
            baseUrl: process.env['UPS_BASE_URL'] ?? 'https://wwwcie.ups.com',
            oauthUrl: process.env['UPS_OAUTH_URL'] ?? 'https://wwwcie.ups.com/security/v1/oauth/token',
        });

        if (!upsResult.success) {
            const invalidKeys = upsResult.error.issues.map((issue) => issue.path.join('.'));
            throw new ConfigurationError(
                `Invalid UPS configuration: ${upsResult.error.message}`,
                invalidKeys
            );
        }

        // Parse application configuration
        const appResult = AppConfigSchema.safeParse({
            nodeEnv: process.env['NODE_ENV'],
            logLevel: process.env['LOG_LEVEL'],
            requestTimeoutMs: process.env['REQUEST_TIMEOUT_MS'],
            tokenRefreshBufferSeconds: process.env['TOKEN_REFRESH_BUFFER_SECONDS'],
        });

        if (!appResult.success) {
            const invalidKeys = appResult.error.issues.map((issue) => issue.path.join('.'));
            throw new ConfigurationError(
                `Invalid application configuration: ${appResult.error.message}`,
                invalidKeys
            );
        }

        return {
            ups: upsResult.data,
            app: appResult.data,
        };
    }

    /**
     * Get UPS configuration.
     */
    get ups(): UPSConfig {
        return this.config.ups;
    }

    /**
     * Get application configuration.
     */
    get app(): AppConfig {
        return this.config.app;
    }

    /**
     * Check if running in production mode.
     */
    get isProduction(): boolean {
        return this.config.app.nodeEnv === 'production';
    }

    /**
     * Check if running in test mode.
     */
    get isTest(): boolean {
        return this.config.app.nodeEnv === 'test';
    }

    /**
     * Check if running in development mode.
     */
    get isDevelopment(): boolean {
        return this.config.app.nodeEnv === 'development';
    }
}
