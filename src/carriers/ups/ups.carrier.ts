/**
 * UPS Carrier implementation.
 * Implements the ICarrier interface for UPS shipping services.
 */

import type { ICarrier } from '../../domain/carrier.interface.js';
import type {
    RateRequest,
    RateResponse,
    TrackingResponse,
    LabelRequest,
    LabelResponse,
} from '../../domain/types.js';
import { CarrierName } from '../../domain/types.js';
import {
    NotImplementedError,
    ValidationError,
    CarrierApiError,
} from '../../errors/index.js';
import type { OAuthService } from '../../services/oauth.service.js';
import type { HttpClient } from '../../services/http-client.js';
import { RateRequestSchema } from '../../validation/schemas.js';
import type { UPSRateResponse } from './types.js';
import { UPSRateResponseSchema } from './response-schemas.js';
import { toUPSRateRequest, fromUPSRateResponse } from './mapper.js';
import { UPS_API_PATHS } from './constants.js';

/**
 * Configuration for UPS Carrier.
 */
export interface UPSCarrierConfig {
    /** UPS account number (ShipperNumber) */
    readonly accountNumber?: string;
    /** Use negotiated rates */
    readonly useNegotiatedRates?: boolean;
}


export class UPSCarrier implements ICarrier {
    readonly name = CarrierName.UPS;

    private readonly httpClient: HttpClient;
    private readonly oauthService: OAuthService;
    private readonly config: UPSCarrierConfig;

    constructor(
        httpClient: HttpClient,
        oauthService: OAuthService,
        config: UPSCarrierConfig = {}
    ) {
        this.httpClient = httpClient;
        this.oauthService = oauthService;
        this.config = config;

        // Set up auth token provider for HTTP client
        this.httpClient.setAuthTokenProvider(async () => {
            const token = await this.oauthService.getToken();
            return token.accessToken;
        });
    }

    /**
     * Get shipping rates for a rate request.
     * 
     * @param request - Rate request with origin, destination, and packages
     * @returns Promise resolving to rate response with available quotes
     * @throws {ValidationError} If request validation fails
     * @throws {AuthenticationError} If OAuth authentication fails
     * @throws {CarrierApiError} If UPS API returns an error
     * @throws {NetworkError} If network request fails
     */
    async rate(request: RateRequest): Promise<RateResponse> {
        // Validate request
        const validationResult = RateRequestSchema.safeParse(request);
        if (!validationResult.success) {
            throw new ValidationError(
                'Invalid rate request',
                validationResult.error.flatten().fieldErrors,
                { carrier: this.name }
            );
        }

        // Apply default options
        const enrichedRequest: RateRequest = {
            ...request,
            options: {
                ...request.options,
                negotiatedRates: request.options?.negotiatedRates ?? this.config.useNegotiatedRates,
                returnAllServices: request.options?.returnAllServices ?? true,
            },
        };

        // Convert to UPS format
        const upsRequest = toUPSRateRequest(enrichedRequest, this.config.accountNumber);

        // Make API request with response validation
        const upsResponse = await this.httpClient.post<UPSRateResponse>(
            UPS_API_PATHS.RATE_SHOP,
            upsRequest,
            {},
            UPSRateResponseSchema
        );

        // Check for error status
        const responseStatus = upsResponse.RateResponse.Response.ResponseStatus;
        if (responseStatus.Code !== '1') {
            throw new CarrierApiError(
                `UPS API error: ${responseStatus.Description}`,
                {
                    carrier: this.name,
                    responseBody: upsResponse,
                    context: { statusCode: responseStatus.Code },
                }
            );
        }

        // Convert to domain format
        return fromUPSRateResponse(upsResponse, request);
    }

    /**
     * Track a shipment by tracking number.
     * 
     * @param trackingNumber - UPS tracking number
     * @returns Promise resolving to tracking response
     * @throws {NotImplementedError} This operation is not yet implemented
     */
    async track(trackingNumber: string): Promise<TrackingResponse> {
        throw new NotImplementedError('track', { carrier: this.name });
    }

    /**
     * Create a shipping label.
     * 
     * @param request - Label request with shipment details
     * @returns Promise resolving to label response
     * @throws {NotImplementedError} This operation is not yet implemented
     */
    async createLabel(request: LabelRequest): Promise<LabelResponse> {
        throw new NotImplementedError('createLabel', { carrier: this.name });
    }
}
