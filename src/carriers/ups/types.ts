
export interface UPSRateRequest {
    RateRequest: {
        Request: {
            SubVersion: string;
            RequestOption: string;
            TransactionReference?: {
                CustomerContext?: string;
            };
        };
        Shipment: UPSShipment;
    };
}

/**
 * UPS Shipment structure for rate requests.
 */
export interface UPSShipment {
    Shipper: UPSShipper;
    ShipTo: UPSShipTo;
    ShipFrom?: UPSShipFrom;
    Service?: UPSService;
    Package: UPSPackage[];
    ShipmentRatingOptions?: {
        NegotiatedRatesIndicator?: string;
    };
    DeliveryTimeInformation?: {
        PackageBillType: string;
    };
}

/**
 * UPS Shipper information.
 */
export interface UPSShipper {
    Name?: string;
    ShipperNumber?: string;
    Address: UPSAddress;
}

/**
 * UPS Ship-To address.
 */
export interface UPSShipTo {
    Name?: string;
    Address: UPSAddress;
}

/**
 * UPS Ship-From address.
 */
export interface UPSShipFrom {
    Name?: string;
    Address: UPSAddress;
}

/**
 * UPS Address structure.
 */
export interface UPSAddress {
    AddressLine?: string[];
    City: string;
    StateProvinceCode?: string;
    PostalCode: string;
    CountryCode: string;
    ResidentialAddressIndicator?: string;
}

/**
 * UPS Service specification.
 */
export interface UPSService {
    Code: string;
    Description?: string;
}

/**
 * UPS Package structure.
 */
export interface UPSPackage {
    PackagingType: {
        Code: string;
        Description?: string;
    };
    Dimensions?: {
        UnitOfMeasurement: {
            Code: string;
            Description?: string;
        };
        Length: string;
        Width: string;
        Height: string;
    };
    PackageWeight: {
        UnitOfMeasurement: {
            Code: string;
            Description?: string;
        };
        Weight: string;
    };
    PackageServiceOptions?: {
        DeclaredValue?: {
            CurrencyCode: string;
            MonetaryValue: string;
        };
    };
}


// =============================================================================
// Request Types (Manual definitions for now)
// =============================================================================

export interface UPSRateRequest {
    RateRequest: {
        Request: {
            SubVersion: string;
            RequestOption: string;
            TransactionReference?: {
                CustomerContext?: string;
            };
        };
        Shipment: UPSShipment;
    };
}

/**
 * UPS Shipment structure for rate requests.
 */
export interface UPSShipment {
    Shipper: UPSShipper;
    ShipTo: UPSShipTo;
    ShipFrom?: UPSShipFrom;
    Service?: UPSService;
    Package: UPSPackage[];
    ShipmentRatingOptions?: {
        NegotiatedRatesIndicator?: string;
    };
    DeliveryTimeInformation?: {
        PackageBillType: string;
    };
}

/**
 * UPS Shipper information.
 */
export interface UPSShipper {
    Name?: string;
    ShipperNumber?: string;
    Address: UPSAddress;
}

/**
 * UPS Ship-To address.
 */
export interface UPSShipTo {
    Name?: string;
    Address: UPSAddress;
}

/**
 * UPS Ship-From address.
 */
export interface UPSShipFrom {
    Name?: string;
    Address: UPSAddress;
}

/**
 * UPS Address structure.
 */
export interface UPSAddress {
    AddressLine?: string[];
    City: string;
    StateProvinceCode?: string;
    PostalCode: string;
    CountryCode: string;
    ResidentialAddressIndicator?: string;
}

/**
 * UPS Service specification.
 */
export interface UPSService {
    Code: string;
    Description?: string;
}

/**
 * UPS Package structure.
 */
export interface UPSPackage {
    PackagingType: {
        Code: string;
        Description?: string;
    };
    Dimensions?: {
        UnitOfMeasurement: {
            Code: string;
            Description?: string;
        };
        Length: string;
        Width: string;
        Height: string;
    };
    PackageWeight: {
        UnitOfMeasurement: {
            Code: string;
            Description?: string;
        };
        Weight: string;
    };
    PackageServiceOptions?: {
        DeclaredValue?: {
            CurrencyCode: string;
            MonetaryValue: string;
        };
    };
}

// =============================================================================
// Response Types (Inferred from Zod Schemas)
// =============================================================================

export type {
    UPSRateResponse,
    UPSRatedShipment,
    UPSRatedPackage,
    UPSCharge,
    UPSAlert,
    UPSItemizedCharge,
    UPSErrorResponse,
    UPSErrorDetail as UPSError,
    UPSOAuthResponse,
} from './response-schemas.js';
