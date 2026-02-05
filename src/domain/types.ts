/**
 * Carrier-agnostic domain types for the shipping integration service.
 * These types define the contract between the application and carrier implementations.
 */

/**
 * Supported weight units for package weight measurement.
 */
export type WeightUnit = 'LB' | 'KG';

/**
 * Supported dimension units for package measurements.
 */
export type DimensionUnit = 'IN' | 'CM';

/**
 * Supported currency codes for monetary values.
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD';

/**
 * Carrier identifiers for supported shipping carriers.
 */
export type CarrierName = 'UPS' | 'FEDEX' | 'USPS' | 'DHL';

/**
 * Shipping address with full location details.
 */
export interface Address {
    /** Street address line 1 */
    readonly addressLine1: string;
    /** Street address line 2 (optional) */
    readonly addressLine2?: string;
    /** Street address line 3 (optional) */
    readonly addressLine3?: string;
    /** City name */
    readonly city: string;
    /** State or province code (e.g., 'CA', 'NY') */
    readonly stateProvinceCode: string;
    /** Postal or ZIP code */
    readonly postalCode: string;
    /** ISO 2-letter country code (e.g., 'US', 'CA') */
    readonly countryCode: string;
    /** Residential indicator (affects some carrier rates) */
    readonly isResidential?: boolean;
}

/**
 * Package weight with unit specification.
 */
export interface PackageWeight {
    /** Numeric weight value */
    readonly value: number;
    /** Weight measurement unit */
    readonly unit: WeightUnit;
}

/**
 * Package dimensions with unit specification.
 */
export interface PackageDimensions {
    /** Length measurement */
    readonly length: number;
    /** Width measurement */
    readonly width: number;
    /** Height measurement */
    readonly height: number;
    /** Dimension measurement unit */
    readonly unit: DimensionUnit;
}

/**
 * Package type identifiers for common packaging options.
 */
export type PackagingType =
    | 'CUSTOM'
    | 'LETTER'
    | 'TUBE'
    | 'PAK'
    | 'SMALL_BOX'
    | 'MEDIUM_BOX'
    | 'LARGE_BOX';

/**
 * Individual package details for shipment.
 */
export interface Package {
    /** Package weight */
    readonly weight: PackageWeight;
    /** Package dimensions (required for custom packaging) */
    readonly dimensions?: PackageDimensions;
    /** Packaging type */
    readonly packagingType: PackagingType;
    /** Declared value for insurance purposes */
    readonly declaredValue?: MonetaryValue;
    /** Reference number for tracking */
    readonly reference?: string;
}

/**
 * Monetary value with currency specification.
 */
export interface MonetaryValue {
    /** Numeric amount */
    readonly amount: number;
    /** Currency code */
    readonly currency: CurrencyCode;
}

/**
 * Rate request options for customizing rate shopping.
 */
export interface RateRequestOptions {
    /** Specific service codes to request rates for */
    readonly serviceCodes?: string[];
    /** Include Saturday delivery options */
    readonly saturdayDelivery?: boolean;
    /** Include negotiated rates (requires account) */
    readonly negotiatedRates?: boolean;
    /** Return all available services */
    readonly returnAllServices?: boolean;
}

/**
 * Rate request containing shipment details for rate shopping.
 */
export interface RateRequest {
    /** Shipper/origin address */
    readonly origin: Address;
    /** Recipient/destination address */
    readonly destination: Address;
    /** Packages to be shipped */
    readonly packages: Package[];
    /** Ship date in ISO 8601 format (YYYY-MM-DD) */
    readonly shipDate?: string;
    /** Rate request options */
    readonly options?: RateRequestOptions;
}

/**
 * Individual rate quote from a carrier.
 */
export interface RateQuote {
    /** Carrier providing the quote */
    readonly carrier: CarrierName;
    /** Service code (carrier-specific) */
    readonly serviceCode: string;
    /** Human-readable service name */
    readonly serviceName: string;
    /** Total shipping cost */
    readonly totalPrice: MonetaryValue;
    /** Base transportation charge */
    readonly basePrice: MonetaryValue;
    /** Additional surcharges and fees */
    readonly surcharges: Surcharge[];
    /** Estimated delivery date in ISO 8601 format */
    readonly estimatedDeliveryDate?: string;
    /** Estimated transit days */
    readonly transitDays?: number;
    /** Saturday delivery available */
    readonly saturdayDelivery?: boolean;
    /** Guaranteed delivery indicator */
    readonly guaranteed?: boolean;
}

/**
 * Individual surcharge or fee applied to a rate.
 */
export interface Surcharge {
    /** Surcharge code */
    readonly code: string;
    /** Surcharge description */
    readonly description: string;
    /** Surcharge amount */
    readonly amount: MonetaryValue;
}

/**
 * Rate response containing quotes from rate shopping.
 */
export interface RateResponse {
    /** Request identifier for correlation */
    readonly requestId: string;
    /** Timestamp of the response */
    readonly timestamp: string;
    /** Available rate quotes */
    readonly quotes: RateQuote[];
    /** Original request for reference */
    readonly request: RateRequest;
}

/**
 * Tracking event representing a shipment milestone.
 */
export interface TrackingEvent {
    /** Event timestamp in ISO 8601 format */
    readonly timestamp: string;
    /** Event description */
    readonly description: string;
    /** Event location */
    readonly location?: Address;
    /** Event status code */
    readonly statusCode: string;
}

/**
 * Tracking response with shipment status and history.
 */
export interface TrackingResponse {
    /** Tracking number */
    readonly trackingNumber: string;
    /** Current status description */
    readonly status: string;
    /** Estimated delivery date */
    readonly estimatedDeliveryDate?: string;
    /** Actual delivery date (if delivered) */
    readonly actualDeliveryDate?: string;
    /** Tracking event history */
    readonly events: TrackingEvent[];
}

/**
 * Label request for creating shipping labels.
 */
export interface LabelRequest {
    /** Shipper/origin address */
    readonly origin: Address;
    /** Recipient/destination address */
    readonly destination: Address;
    /** Packages to be shipped */
    readonly packages: Package[];
    /** Selected service code */
    readonly serviceCode: string;
    /** Selected carrier */
    readonly carrier: CarrierName;
    /** Label format preference */
    readonly labelFormat?: 'PDF' | 'PNG' | 'ZPL';
}

/**
 * Label response containing the generated shipping label.
 */
export interface LabelResponse {
    /** Tracking number for the shipment */
    readonly trackingNumber: string;
    /** Base64-encoded label image */
    readonly labelData: string;
    /** Label format */
    readonly labelFormat: 'PDF' | 'PNG' | 'ZPL';
    /** Total cost for the label */
    readonly totalCost: MonetaryValue;
}
