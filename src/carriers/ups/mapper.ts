/**
 * Mappers for converting between domain types and UPS-specific types.
 */

import type {
    Address,
    Package,
    RateRequest,
    RateResponse,
    RateQuote,
    Surcharge,
} from '../../domain/types.js';
import {
    CarrierName,
    parseCurrencyCode,
} from '../../domain/types.js';
import type {
    UPSRateRequest,
    UPSRateResponse,
    UPSAddress,
    UPSPackage,
    UPSRatedShipment,
} from './types.js';
import {
    getServiceName,
    toUPSPackagingCode,
    UPS_WEIGHT_UNITS,
    UPS_DIMENSION_UNITS,
} from './constants.js';

// =============================================================================
// Request Mappers
// =============================================================================

/**
 * Convert domain Address to UPS Address format.
 */
export function toUPSAddress(address: Address): UPSAddress {
    const addressLines: string[] = [address.addressLine1];
    if (address.addressLine2) {
        addressLines.push(address.addressLine2);
    }
    if (address.addressLine3) {
        addressLines.push(address.addressLine3);
    }

    const upsAddress: UPSAddress = {
        AddressLine: addressLines,
        City: address.city,
        StateProvinceCode: address.stateProvinceCode,
        PostalCode: address.postalCode,
        CountryCode: address.countryCode,
    };

    if (address.isResidential) {
        upsAddress.ResidentialAddressIndicator = 'Y';
    }

    return upsAddress;
}

/**
 * Convert domain Package to UPS Package format.
 */
export function toUPSPackage(pkg: Package): UPSPackage {
    const upsPackage: UPSPackage = {
        PackagingType: {
            Code: toUPSPackagingCode(pkg.packagingType),
            Description: pkg.packagingType,
        },
        PackageWeight: {
            UnitOfMeasurement: {
                Code: UPS_WEIGHT_UNITS[pkg.weight.unit],
                Description: pkg.weight.unit === 'LB' ? 'Pounds' : 'Kilograms',
            },
            Weight: pkg.weight.value.toFixed(1),
        },
    };

    // Add dimensions if provided
    if (pkg.dimensions) {
        upsPackage.Dimensions = {
            UnitOfMeasurement: {
                Code: UPS_DIMENSION_UNITS[pkg.dimensions.unit],
                Description: pkg.dimensions.unit === 'IN' ? 'Inches' : 'Centimeters',
            },
            Length: pkg.dimensions.length.toFixed(1),
            Width: pkg.dimensions.width.toFixed(1),
            Height: pkg.dimensions.height.toFixed(1),
        };
    }

    // Add declared value if provided
    if (pkg.declaredValue) {
        upsPackage.PackageServiceOptions = {
            DeclaredValue: {
                CurrencyCode: pkg.declaredValue.currency,
                MonetaryValue: pkg.declaredValue.amount.toFixed(2),
            },
        };
    }

    return upsPackage;
}

/**
 * Convert domain RateRequest to UPS RateRequest format.
 */
export function toUPSRateRequest(
    request: RateRequest,
    accountNumber?: string
): UPSRateRequest {
    const shipper: UPSRateRequest['RateRequest']['Shipment']['Shipper'] = {
        Name: 'Shipper',
        Address: toUPSAddress(request.origin),
    };

    if (accountNumber) {
        shipper.ShipperNumber = accountNumber;
    }

    return {
        RateRequest: {
            Request: {
                SubVersion: '2403',
                RequestOption: request.options?.returnAllServices !== false ? 'Shop' : 'Rate',
                TransactionReference: {
                    CustomerContext: `rate-${Date.now()}`,
                },
            },
            Shipment: {
                Shipper: shipper,
                ShipTo: {
                    Name: 'Recipient',
                    Address: toUPSAddress(request.destination),
                },
                ShipFrom: {
                    Name: 'Shipper',
                    Address: toUPSAddress(request.origin),
                },
                Package: request.packages.map(toUPSPackage),
                ShipmentRatingOptions: request.options?.negotiatedRates
                    ? { NegotiatedRatesIndicator: 'Y' }
                    : undefined,
                DeliveryTimeInformation: {
                    PackageBillType: '03', // Non-document
                },
            },
        },
    };
}

// =============================================================================
// Response Mappers
// =============================================================================

/**
 * Convert UPS RatedShipment to domain RateQuote.
 */
export function fromUPSRatedShipment(rated: UPSRatedShipment): RateQuote {
    const serviceCode = rated.Service.Code;
    const serviceName = rated.Service.Description ?? getServiceName(serviceCode);

    // Use negotiated rates if available, otherwise use standard rates
    const totalCharges = rated.NegotiatedRateCharges?.TotalCharge ?? rated.TotalCharges;
    const baseCharges = rated.BaseServiceCharge ?? rated.TransportationCharges;

    // Extract surcharges from itemized charges
    const surcharges: Surcharge[] = (rated.ItemizedCharges ?? [])
        .filter((charge) => parseFloat(charge.MonetaryValue) > 0)
        .map((charge) => ({
            code: charge.Code,
            description: charge.Description ?? charge.Code,
            amount: {
                amount: parseFloat(charge.MonetaryValue),
                currency: parseCurrencyCode(charge.CurrencyCode),
            },
        }));

    // Extract delivery information
    let estimatedDeliveryDate: string | undefined;
    let transitDays: number | undefined;
    let saturdayDelivery = false;

    if (rated.GuaranteedDelivery) {
        transitDays = parseInt(rated.GuaranteedDelivery.BusinessDaysInTransit, 10);
    }

    if (rated.TimeInTransit?.ServiceSummary) {
        const summary = rated.TimeInTransit.ServiceSummary;

        if (summary.EstimatedArrival?.Arrival?.Date) {
            estimatedDeliveryDate = summary.EstimatedArrival.Arrival.Date;
        }

        if (summary.EstimatedArrival?.BusinessDaysInTransit) {
            transitDays = parseInt(summary.EstimatedArrival.BusinessDaysInTransit, 10);
        }

        if (summary.SaturdayDelivery === 'Y' || summary.SaturdayDelivery === '1') {
            saturdayDelivery = true;
        }
    }

    return {
        carrier: CarrierName.UPS,
        serviceCode,
        serviceName,
        totalPrice: {
            amount: parseFloat(totalCharges.MonetaryValue),
            currency: parseCurrencyCode(totalCharges.CurrencyCode),
        },
        basePrice: {
            amount: parseFloat(baseCharges.MonetaryValue), // Assuming BaseServiceCharge or TransportationCharges has MonetaryValue
            currency: parseCurrencyCode(baseCharges?.CurrencyCode ?? totalCharges.CurrencyCode),
        },
        surcharges,
        estimatedDeliveryDate,
        transitDays: transitDays !== undefined && !isNaN(transitDays) ? transitDays : undefined,
        saturdayDelivery,
        guaranteed: rated.GuaranteedDelivery !== undefined,
    };
}

/**
 * Generate a simple UUID for request tracking.
 */
function generateRequestId(): string {
    // Simple implementation if uuid not available
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Convert UPS RateResponse to domain RateResponse.
 */
export function fromUPSRateResponse(
    response: UPSRateResponse,
    originalRequest: RateRequest
): RateResponse {
    const ratedShipments = response.RateResponse.RatedShipment;
    const quotes = ratedShipments.map(fromUPSRatedShipment);

    // Sort quotes by total price (ascending)
    quotes.sort((a, b) => a.totalPrice.amount - b.totalPrice.amount);

    return {
        requestId: generateRequestId(),
        timestamp: new Date().toISOString(),
        quotes,
        request: originalRequest,
    };
}
