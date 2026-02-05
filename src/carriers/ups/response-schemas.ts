/**
 * Zod schemas for validating UPS API responses.
 * Ensures type-safe parsing of API data instead of casting.
 */

import { z } from 'zod';

// =============================================================================
// Common UPS Response Schemas
// =============================================================================

/**
 * UPS charge/monetary value schema.
 */
export const UPSChargeSchema = z.object({
    CurrencyCode: z.string(),
    MonetaryValue: z.string(),
});

export type UPSCharge = z.infer<typeof UPSChargeSchema>;

/**
 * UPS Alert/warning schema.
 */
export const UPSAlertSchema = z.object({
    Code: z.string(),
    Description: z.string(),
});

export type UPSAlert = z.infer<typeof UPSAlertSchema>;

// =============================================================================
// UPS Rate Response Schemas
// =============================================================================

/**
 * UPS itemized charge schema.
 */
export const UPSItemizedChargeSchema = z.object({
    Code: z.string(),
    Description: z.string().optional(),
    CurrencyCode: z.string(),
    MonetaryValue: z.string(),
    SubType: z.string().optional(),
});

export type UPSItemizedCharge = z.infer<typeof UPSItemizedChargeSchema>;

/**
 * UPS rated package schema.
 */
export const UPSRatedPackageSchema = z.object({
    TransportationCharges: UPSChargeSchema.optional(),
    ServiceOptionsCharges: UPSChargeSchema.optional(),
    TotalCharges: UPSChargeSchema.optional(),
    Weight: z.string().optional(),
    BillingWeight: z.object({
        UnitOfMeasurement: z.object({
            Code: z.string().optional(),
        }).optional(),
        Weight: z.string().optional(),
    }).optional(),
});

export type UPSRatedPackage = z.infer<typeof UPSRatedPackageSchema>;

/**
 * UPS rated shipment schema.
 */
export const UPSRatedShipmentSchema = z.object({
    Service: z.object({
        Code: z.string(),
        Description: z.string().optional(),
    }),
    RatedShipmentAlert: z.array(UPSAlertSchema).optional(),
    BillingWeight: z.object({
        UnitOfMeasurement: z.object({
            Code: z.string(),
            Description: z.string().optional(),
        }),
        Weight: z.string(),
    }),
    TransportationCharges: UPSChargeSchema,
    BaseServiceCharge: UPSChargeSchema.optional(),
    ServiceOptionsCharges: UPSChargeSchema.optional(),
    TotalCharges: UPSChargeSchema,
    NegotiatedRateCharges: z.object({
        TotalCharge: UPSChargeSchema,
    }).optional(),
    GuaranteedDelivery: z.object({
        BusinessDaysInTransit: z.string(),
        DeliveryByTime: z.string().optional(),
    }).optional(),
    RatedPackage: z.array(UPSRatedPackageSchema).optional(),
    TimeInTransit: z.object({
        ServiceSummary: z.object({
            Service: z.object({
                Description: z.string().optional(),
            }).optional(),
            EstimatedArrival: z.object({
                Arrival: z.object({
                    Date: z.string().optional(),
                    Time: z.string().optional(),
                }).optional(),
                BusinessDaysInTransit: z.string().optional(),
            }).optional(),
            SaturdayDelivery: z.string().optional(),
            SaturdayDeliveryDisclaimer: z.string().optional(),
        }).optional(),
    }).optional(),
    ItemizedCharges: z.array(UPSItemizedChargeSchema).optional(),
});

export type UPSRatedShipment = z.infer<typeof UPSRatedShipmentSchema>;

/**
 * Full UPS rate response schema.
 */
export const UPSRateResponseSchema = z.object({
    RateResponse: z.object({
        Response: z.object({
            ResponseStatus: z.object({
                Code: z.string(),
                Description: z.string(),
            }),
            Alert: z.array(UPSAlertSchema).optional(),
            TransactionReference: z.object({
                CustomerContext: z.string().optional(),
            }).optional(),
        }),
        RatedShipment: z.array(UPSRatedShipmentSchema),
    }),
});

export type UPSRateResponse = z.infer<typeof UPSRateResponseSchema>;

// =============================================================================
// UPS OAuth Response Schema
// =============================================================================

/**
 * UPS OAuth token response schema.
 * Note: expires_in can be a string or number depending on the API version.
 */
export const UPSOAuthResponseSchema = z.object({
    token_type: z.string(),
    issued_at: z.string().optional(),
    client_id: z.string().optional(),
    access_token: z.string(),
    expires_in: z.union([z.string(), z.number()]).transform((val) =>
        typeof val === 'string' ? parseInt(val, 10) : val
    ),
    status: z.string().optional(),
    scope: z.string().optional(),
});

export type UPSOAuthResponse = z.infer<typeof UPSOAuthResponseSchema>;

// =============================================================================
// UPS Error Response Schema
// =============================================================================

/**
 * UPS error detail schema.
 */
export const UPSErrorDetailSchema = z.object({
    code: z.string(),
    message: z.string(),
});

export type UPSErrorDetail = z.infer<typeof UPSErrorDetailSchema>;

/**
 * UPS error response schema.
 */
export const UPSErrorResponseSchema = z.object({
    response: z.object({
        errors: z.array(UPSErrorDetailSchema).optional(),
    }).optional(),
});

export type UPSErrorResponse = z.infer<typeof UPSErrorResponseSchema>;
