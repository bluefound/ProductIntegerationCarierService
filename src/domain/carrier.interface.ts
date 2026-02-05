/**
 * Carrier interface defining the contract for all carrier implementations.
 * Follows Interface Segregation Principle - carriers can implement only what they support.
 */

import type {
    CarrierName,
    RateRequest,
    RateResponse,
    TrackingResponse,
    LabelRequest,
    LabelResponse,
} from './types.js';

/**
 * Core carrier interface that all carrier implementations must satisfy.
 * 
 * @example
 * ```typescript
 * class UPSCarrier implements ICarrier {
 *   readonly name = 'UPS' as const;
 *   
 *   async rate(request: RateRequest): Promise<RateResponse> {
 *     // UPS-specific implementation
 *   }
 * }
 * ```
 */
export interface ICarrier {
    /**
     * Unique carrier identifier.
     */
    readonly name: CarrierName;

    /**
     * Get shipping rates for a given request.
     * 
     * @param request - Rate request containing shipment details
     * @returns Promise resolving to rate response with available quotes
     * @throws {ValidationError} If request validation fails
     * @throws {AuthenticationError} If carrier authentication fails
     * @throws {CarrierApiError} If carrier API returns an error
     * @throws {NetworkError} If network request fails
     */
    rate(request: RateRequest): Promise<RateResponse>;

    /**
     * Track a shipment by tracking number.
     * 
     * @param trackingNumber - Carrier-issued tracking number
     * @returns Promise resolving to tracking response with status and events
     * @throws {AuthenticationError} If carrier authentication fails
     * @throws {CarrierApiError} If tracking number not found or API error
     * @throws {NetworkError} If network request fails
     */
    track(trackingNumber: string): Promise<TrackingResponse>;

    /**
     * Create a shipping label for a shipment.
     * 
     * @param request - Label request containing shipment and service details
     * @returns Promise resolving to label response with tracking number and label data
     * @throws {ValidationError} If request validation fails
     * @throws {AuthenticationError} If carrier authentication fails
     * @throws {CarrierApiError} If carrier API returns an error
     * @throws {NetworkError} If network request fails
     */
    createLabel(request: LabelRequest): Promise<LabelResponse>;
}

/**
 * Type guard to check if an object implements the ICarrier interface.
 */
export function isCarrier(obj: unknown): obj is ICarrier {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'name' in obj &&
        'rate' in obj &&
        'track' in obj &&
        'createLabel' in obj &&
        typeof (obj as ICarrier).rate === 'function' &&
        typeof (obj as ICarrier).track === 'function' &&
        typeof (obj as ICarrier).createLabel === 'function'
    );
}

/**
 * Carrier registry for managing multiple carrier implementations.
 * Provides a factory pattern for retrieving carriers by name.
 */
export class CarrierRegistry {
    private readonly carriers = new Map<CarrierName, ICarrier>();

    /**
     * Register a carrier implementation.
     * 
     * @param carrier - Carrier implementation to register
     * @throws {Error} If carrier with same name is already registered
     */
    register(carrier: ICarrier): void {
        if (this.carriers.has(carrier.name)) {
            throw new Error(`Carrier ${carrier.name} is already registered`);
        }
        this.carriers.set(carrier.name, carrier);
    }

    /**
     * Get a registered carrier by name.
     * 
     * @param name - Carrier name to retrieve
     * @returns The registered carrier or undefined if not found
     */
    get(name: CarrierName): ICarrier | undefined {
        return this.carriers.get(name);
    }

    /**
     * Get all registered carriers.
     * 
     * @returns Array of all registered carrier implementations
     */
    getAll(): ICarrier[] {
        return Array.from(this.carriers.values());
    }

    /**
     * Check if a carrier is registered.
     * 
     * @param name - Carrier name to check
     * @returns True if carrier is registered
     */
    has(name: CarrierName): boolean {
        return this.carriers.has(name);
    }
}
