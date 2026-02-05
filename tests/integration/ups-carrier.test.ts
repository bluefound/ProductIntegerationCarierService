/**
 * Integration tests for UPS Carrier.
 * Tests use mocked HTTP responses to verify carrier behavior.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import axios from 'axios';
import { UPSCarrier } from '../../src/carriers/ups/ups.carrier.js';
import { OAuthService } from '../../src/services/oauth.service.js';
import { HttpClient } from '../../src/services/http-client.js';
import {
    AuthenticationError,
    ValidationError,
    CarrierApiError,
    NetworkError,
    RateLimitError,
    NotImplementedError,
} from '../../src/errors/index.js';
import {
    successfulRateResponse,
    negotiatedRateResponse,
    validRateRequest,
    invalidRateRequest,
} from '../fixtures/ups-responses.js';
import { CarrierName } from '../../src/domain/enums.js';

// Mock axios for all tests
vi.mock('axios', async () => {
    const actual = await vi.importActual<typeof import('axios')>('axios');
    return {
        ...actual,
        default: {
            ...actual.default,
            create: vi.fn(() => ({
                get: vi.fn(),
                post: vi.fn(),
                put: vi.fn(),
                delete: vi.fn(),
                interceptors: {
                    request: { use: vi.fn() },
                    response: { use: vi.fn() },
                },
            })),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});

describe('UPSCarrier', () => {
    let upsCarrier: UPSCarrier;
    let httpClient: HttpClient;
    let oauthService: OAuthService;
    let mockAxiosInstance: {
        post: Mock;
        get: Mock;
        interceptors: { request: { use: Mock }; response: { use: Mock } };
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Get the mock axios instance
        mockAxiosInstance = {
            post: vi.fn(),
            get: vi.fn(),
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
        };

        (axios.create as Mock).mockReturnValue(mockAxiosInstance);

        // Create real instances with mocked axios
        httpClient = new HttpClient({
            baseUrl: 'https://wwwcie.ups.com',
            carrier: CarrierName.UPS,
            timeoutMs: 30000,
        });

        // Create OAuth service with a mock that returns the http client's axios instance
        const oauthHttpClient = axios.create({
            baseURL: 'https://wwwcie.ups.com',
        });

        oauthService = new OAuthService(oauthHttpClient as ReturnType<typeof axios.create>, {
            tokenUrl: 'https://wwwcie.ups.com/security/v1/oauth/token',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            carrier: CarrierName.UPS,
            additionalHeaders: {
                'x-merchant-id': '123456',
            },
        });

        // Create UPS carrier
        upsCarrier = new UPSCarrier(httpClient, oauthService, {
            accountNumber: '123456',
            useNegotiatedRates: false,
        });
    });

    describe('rate()', () => {
        it('should return rate quotes for a valid request', async () => {
            // Mock successful OAuth response
            mockAxiosInstance.post.mockResolvedValueOnce({
                data: {
                    access_token: 'test-access-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                },
            });

            // Mock successful rate response
            mockAxiosInstance.post.mockResolvedValueOnce({
                data: successfulRateResponse,
            });

            // Create a direct mock for the HttpClient
            vi.spyOn(httpClient, 'post').mockResolvedValueOnce(successfulRateResponse);
            vi.spyOn(oauthService, 'getToken').mockResolvedValueOnce({
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresAt: Date.now() + 3600000,
            });

            const response = await upsCarrier.rate(validRateRequest);

            expect(response).toBeDefined();
            expect(response.quotes).toBeInstanceOf(Array);
            expect(response.quotes.length).toBe(3);
            expect(response.request).toEqual(validRateRequest);
            expect(response.requestId).toBeDefined();
            expect(response.timestamp).toBeDefined();
        });

        it('should return quotes sorted by price (ascending)', async () => {
            vi.spyOn(httpClient, 'post').mockResolvedValueOnce(successfulRateResponse);
            vi.spyOn(oauthService, 'getToken').mockResolvedValueOnce({
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresAt: Date.now() + 3600000,
            });

            const response = await upsCarrier.rate(validRateRequest);

            // Verify quotes are sorted by price
            for (let i = 1; i < response.quotes.length; i++) {
                const prevQuote = response.quotes[i - 1];
                const currQuote = response.quotes[i];
                expect(prevQuote).toBeDefined();
                expect(currQuote).toBeDefined();
                expect(prevQuote!.totalPrice.amount).toBeLessThanOrEqual(currQuote!.totalPrice.amount);
            }
        });

        it('should include surcharges in rate quotes', async () => {
            vi.spyOn(httpClient, 'post').mockResolvedValueOnce(successfulRateResponse);
            vi.spyOn(oauthService, 'getToken').mockResolvedValueOnce({
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresAt: Date.now() + 3600000,
            });

            const response = await upsCarrier.rate(validRateRequest);

            // Ground service should have fuel and residential surcharges
            const groundQuote = response.quotes.find((q) => q.serviceCode === '03');
            expect(groundQuote).toBeDefined();
            expect(groundQuote!.surcharges.length).toBeGreaterThan(0);
            expect(groundQuote!.surcharges.some((s) => s.code === 'FUEL')).toBe(true);
        });

        it('should use negotiated rates when available', async () => {
            vi.spyOn(httpClient, 'post').mockResolvedValueOnce(negotiatedRateResponse);
            vi.spyOn(oauthService, 'getToken').mockResolvedValueOnce({
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresAt: Date.now() + 3600000,
            });

            const response = await upsCarrier.rate({
                ...validRateRequest,
                options: { negotiatedRates: true },
            });

            // Negotiated rate should be used (12.99 vs 15.99)
            const groundQuote = response.quotes.find((q) => q.serviceCode === '03');
            expect(groundQuote).toBeDefined();
            expect(groundQuote!.totalPrice.amount).toBe(12.99);
        });

        it('should include transit time information', async () => {
            vi.spyOn(httpClient, 'post').mockResolvedValueOnce(successfulRateResponse);
            vi.spyOn(oauthService, 'getToken').mockResolvedValueOnce({
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresAt: Date.now() + 3600000,
            });

            const response = await upsCarrier.rate(validRateRequest);

            const groundQuote = response.quotes.find((q) => q.serviceCode === '03');
            expect(groundQuote).toBeDefined();
            expect(groundQuote!.transitDays).toBe(5);
            expect(groundQuote!.estimatedDeliveryDate).toBe('2024-01-20');
        });

        it('should throw ValidationError for invalid request', async () => {
            await expect(upsCarrier.rate(invalidRateRequest as any)).rejects.toThrow(ValidationError);
        });

        it('should include field errors in ValidationError', async () => {
            try {
                await upsCarrier.rate(invalidRateRequest as any);
                expect.fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                const validationError = error as ValidationError;
                expect(validationError.fieldErrors).toBeDefined();
                expect(Object.keys(validationError.fieldErrors).length).toBeGreaterThan(0);
            }
        });
    });

    describe('track()', () => {
        it('should throw NotImplementedError', async () => {
            await expect(upsCarrier.track('1Z999AA10123456784')).rejects.toThrow(NotImplementedError);
        });

        it('should include carrier name in NotImplementedError', async () => {
            try {
                await upsCarrier.track('1Z999AA10123456784');
                expect.fail('Should have thrown NotImplementedError');
            } catch (error) {
                expect(error).toBeInstanceOf(NotImplementedError);
                expect((error as NotImplementedError).carrier).toBe(CarrierName.UPS);
            }
        });
    });

    describe('createLabel()', () => {
        it('should throw NotImplementedError', async () => {
            await expect(
                upsCarrier.createLabel({
                    origin: validRateRequest.origin,
                    destination: validRateRequest.destination,
                    packages: validRateRequest.packages,
                    serviceCode: '03',
                    carrier: CarrierName.UPS,
                })
            ).rejects.toThrow(NotImplementedError);
        });
    });

    describe('carrier properties', () => {
        it('should have name set to UPS', () => {
            expect(upsCarrier.name).toBe(CarrierName.UPS);
        });
    });
});

describe('OAuthService', () => {
    let oauthService: OAuthService;
    let mockAxiosInstance: {
        post: Mock;
        interceptors: { request: { use: Mock }; response: { use: Mock } };
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockAxiosInstance = {
            post: vi.fn(),
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
        };

        oauthService = new OAuthService(mockAxiosInstance as any, {
            tokenUrl: 'https://wwwcie.ups.com/security/v1/oauth/token',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            carrier: CarrierName.UPS,
            refreshBufferSeconds: 300,
        });
    });

    describe('getToken()', () => {
        it('should acquire a new token when cache is empty', async () => {
            mockAxiosInstance.post.mockResolvedValueOnce({
                data: {
                    access_token: 'new-access-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                },
            });

            const token = await oauthService.getToken();

            expect(token.accessToken).toBe('new-access-token');
            expect(token.tokenType).toBe('Bearer');
            expect(token.expiresAt).toBeGreaterThan(Date.now());
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
        });

        it('should reuse cached token when still valid', async () => {
            mockAxiosInstance.post.mockResolvedValueOnce({
                data: {
                    access_token: 'cached-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                },
            });

            // First call - acquires token
            await oauthService.getToken();

            // Second call - should use cache
            const token = await oauthService.getToken();

            expect(token.accessToken).toBe('cached-token');
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
        });

        it('should refresh token when near expiry', async () => {
            // First token expires soon (less than buffer)
            mockAxiosInstance.post.mockResolvedValueOnce({
                data: {
                    access_token: 'expiring-token',
                    token_type: 'Bearer',
                    expires_in: 60, // 60 seconds, less than 300s buffer
                },
            });

            await oauthService.getToken();

            // Second token
            mockAxiosInstance.post.mockResolvedValueOnce({
                data: {
                    access_token: 'refreshed-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                },
            });

            const token = await oauthService.getToken();

            expect(token.accessToken).toBe('refreshed-token');
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
        });

        it('should throw AuthenticationError on 401 response', async () => {
            mockAxiosInstance.post.mockRejectedValueOnce({
                response: {
                    status: 401,
                    data: { error: 'invalid_client' },
                },
                message: 'Request failed with status code 401',
            });

            await expect(oauthService.getToken()).rejects.toThrow(AuthenticationError);
        });

        it('should throw AuthenticationError on 400 response', async () => {
            mockAxiosInstance.post.mockRejectedValueOnce({
                response: {
                    status: 400,
                    data: {
                        error: 'invalid_grant',
                        error_description: 'The grant type is not supported',
                    },
                },
                message: 'Request failed with status code 400',
            });

            await expect(oauthService.getToken()).rejects.toThrow(AuthenticationError);
        });

        it('should prevent concurrent token refreshes', async () => {
            let resolveFirst: (value: unknown) => void;
            const firstPromise = new Promise((resolve) => {
                resolveFirst = resolve;
            });

            mockAxiosInstance.post.mockImplementationOnce(() => firstPromise);

            // Start two concurrent token requests
            const promise1 = oauthService.getToken();
            const promise2 = oauthService.getToken();

            // Resolve the first request
            resolveFirst!({
                data: {
                    access_token: 'concurrent-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                },
            });

            const [token1, token2] = await Promise.all([promise1, promise2]);

            // Both should get the same token
            expect(token1.accessToken).toBe('concurrent-token');
            expect(token2.accessToken).toBe('concurrent-token');
            // Only one HTTP request should have been made
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
        });
    });

    describe('forceRefresh()', () => {
        it('should force a new token acquisition', async () => {
            mockAxiosInstance.post
                .mockResolvedValueOnce({
                    data: {
                        access_token: 'first-token',
                        token_type: 'Bearer',
                        expires_in: 3600,
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        access_token: 'force-refreshed-token',
                        token_type: 'Bearer',
                        expires_in: 3600,
                    },
                });

            await oauthService.getToken();
            const token = await oauthService.forceRefresh();

            expect(token.accessToken).toBe('force-refreshed-token');
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
        });
    });

    describe('clearCache()', () => {
        it('should clear the cached token', async () => {
            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    access_token: 'some-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                },
            });

            await oauthService.getToken();
            oauthService.clearCache();
            await oauthService.getToken();

            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
        });
    });
});

describe('HttpClient', () => {
    let httpClient: HttpClient;
    let mockAxiosInstance: {
        post: Mock;
        get: Mock;
        put: Mock;
        delete: Mock;
        interceptors: { request: { use: Mock }; response: { use: Mock } };
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockAxiosInstance = {
            post: vi.fn(),
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
        };

        (axios.create as Mock).mockReturnValue(mockAxiosInstance);

        httpClient = new HttpClient({
            baseUrl: 'https://api.example.com',
            carrier: CarrierName.UPS,
            timeoutMs: 30000,
        });
    });

    describe('error transformation', () => {
        it('should transform generic errors to NetworkError', async () => {
            const genericError = new Error('Connection refused');

            mockAxiosInstance.post.mockRejectedValueOnce(genericError);

            try {
                await httpClient.post('/test');
                expect.fail('Should have thrown NetworkError');
            } catch (error) {
                expect(error).toBeInstanceOf(NetworkError);
            }
        });

        it('should handle unknown error types gracefully', async () => {
            mockAxiosInstance.get.mockRejectedValueOnce('string error');

            try {
                await httpClient.get('/test');
                expect.fail('Should have thrown NetworkError');
            } catch (error) {
                expect(error).toBeInstanceOf(NetworkError);
            }
        });

        it('should return data on successful request', async () => {
            const responseData = { success: true, data: 'test' };
            mockAxiosInstance.post.mockResolvedValueOnce({ data: responseData });

            const result = await httpClient.post('/test', { input: 'value' });
            expect(result).toEqual(responseData);
        });

        it('should return data on successful GET request', async () => {
            const responseData = { items: [1, 2, 3] };
            mockAxiosInstance.get.mockResolvedValueOnce({ data: responseData });

            const result = await httpClient.get('/test');
            expect(result).toEqual(responseData);
        });
    });
});
