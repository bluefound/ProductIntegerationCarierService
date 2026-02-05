/**
 * UPS-specific type definitions matching the UPS Rating API structure.
 */

// =============================================================================
// UPS Request Types
// =============================================================================

/**
 * UPS API request wrapper structure.
 */
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
// UPS Response Types
// =============================================================================

/**
 * UPS API rate response structure.
 */
export interface UPSRateResponse {
    RateResponse: {
        Response: {
            ResponseStatus: {
                Code: string;
                Description: string;
            };
            Alert?: UPSAlert[];
            TransactionReference?: {
                CustomerContext?: string;
            };
        };
        RatedShipment: UPSRatedShipment[];
    };
}

/**
 * UPS Alert message.
 */
export interface UPSAlert {
    Code: string;
    Description: string;
}

/**
 * UPS Rated Shipment with charges.
 */
export interface UPSRatedShipment {
    Service: {
        Code: string;
        Description?: string;
    };
    RatedShipmentAlert?: UPSAlert[];
    BillingWeight: {
        UnitOfMeasurement: {
            Code: string;
            Description?: string;
        };
        Weight: string;
    };
    TransportationCharges: UPSCharge;
    BaseServiceCharge?: UPSCharge;
    ServiceOptionsCharges?: UPSCharge;
    TotalCharges: UPSCharge;
    NegotiatedRateCharges?: {
        TotalCharge: UPSCharge;
    };
    GuaranteedDelivery?: {
        BusinessDaysInTransit: string;
        DeliveryByTime?: string;
    };
    RatedPackage?: UPSRatedPackage[];
    TimeInTransit?: {
        ServiceSummary?: {
            Service?: {
                Description?: string;
            };
            EstimatedArrival?: {
                Arrival?: {
                    Date?: string;
                    Time?: string;
                };
                BusinessDaysInTransit?: string;
            };
            SaturdayDelivery?: string;
            SaturdayDeliveryDisclaimer?: string;
        };
    };
    ItemizedCharges?: UPSItemizedCharge[];
}

/**
 * UPS Charge structure.
 */
export interface UPSCharge {
    CurrencyCode: string;
    MonetaryValue: string;
}

/**
 * UPS Rated Package details.
 */
export interface UPSRatedPackage {
    TransportationCharges?: UPSCharge;
    ServiceOptionsCharges?: UPSCharge;
    TotalCharges?: UPSCharge;
    Weight?: string;
    BillingWeight?: {
        UnitOfMeasurement?: {
            Code?: string;
        };
        Weight?: string;
    };
}

/**
 * UPS Itemized Charge.
 */
export interface UPSItemizedCharge {
    Code: string;
    Description?: string;
    CurrencyCode: string;
    MonetaryValue: string;
    SubType?: string;
}

// =============================================================================
// UPS Error Response Types
// =============================================================================

/**
 * UPS API error response structure.
 */
export interface UPSErrorResponse {
    response?: {
        errors?: UPSError[];
    };
}

/**
 * UPS Error detail.
 */
export interface UPSError {
    code: string;
    message: string;
}

// =============================================================================
// OAuth Response Types
// =============================================================================

/**
 * UPS OAuth token response.
 */
export interface UPSOAuthResponse {
    token_type: string;
    issued_at: string;
    client_id: string;
    access_token: string;
    expires_in: string;
    status: string;
}
