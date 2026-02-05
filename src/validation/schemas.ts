/**
 * Zod validation schemas for all domain types.
 * Provides runtime validation with detailed error messages.
 */

import { z } from 'zod';

// =============================================================================
// Enums and Constants
// =============================================================================

export const WeightUnitSchema = z.enum(['LB', 'KG']);
export const DimensionUnitSchema = z.enum(['IN', 'CM']);
export const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'GBP', 'CAD']);
export const CarrierNameSchema = z.enum(['UPS', 'FEDEX', 'USPS', 'DHL']);
export const PackagingTypeSchema = z.enum([
    'CUSTOM',
    'LETTER',
    'TUBE',
    'PAK',
    'SMALL_BOX',
    'MEDIUM_BOX',
    'LARGE_BOX',
]);
export const LabelFormatSchema = z.enum(['PDF', 'PNG', 'ZPL']);

// =============================================================================
// Address Schema
// =============================================================================

/**
 * Validates shipping addresses with comprehensive field validation.
 */
export const AddressSchema = z.object({
    addressLine1: z
        .string()
        .min(1, 'Address line 1 is required')
        .max(100, 'Address line 1 must be 100 characters or less'),
    addressLine2: z.string().max(100, 'Address line 2 must be 100 characters or less').optional(),
    addressLine3: z.string().max(100, 'Address line 3 must be 100 characters or less').optional(),
    city: z
        .string()
        .min(1, 'City is required')
        .max(50, 'City must be 50 characters or less'),
    stateProvinceCode: z
        .string()
        .min(2, 'State/Province code must be at least 2 characters')
        .max(5, 'State/Province code must be 5 characters or less'),
    postalCode: z
        .string()
        .min(3, 'Postal code must be at least 3 characters')
        .max(15, 'Postal code must be 15 characters or less')
        .regex(/^[A-Za-z0-9\s-]+$/, 'Postal code contains invalid characters'),
    countryCode: z
        .string()
        .length(2, 'Country code must be exactly 2 characters')
        .regex(/^[A-Z]{2}$/, 'Country code must be uppercase ISO 2-letter code'),
    isResidential: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof AddressSchema>;

// =============================================================================
// Package Schemas
// =============================================================================

/**
 * Validates package weight with reasonable constraints.
 */
export const PackageWeightSchema = z.object({
    value: z
        .number()
        .positive('Weight must be positive')
        .max(150, 'Weight must be 150 or less'),
    unit: WeightUnitSchema,
});

/**
 * Validates package dimensions with reasonable constraints.
 */
export const PackageDimensionsSchema = z.object({
    length: z
        .number()
        .positive('Length must be positive')
        .max(108, 'Length must be 108 or less'),
    width: z
        .number()
        .positive('Width must be positive')
        .max(108, 'Width must be 108 or less'),
    height: z
        .number()
        .positive('Height must be positive')
        .max(108, 'Height must be 108 or less'),
    unit: DimensionUnitSchema,
});

/**
 * Validates monetary values.
 */
export const MonetaryValueSchema = z.object({
    amount: z.number().nonnegative('Amount cannot be negative'),
    currency: CurrencyCodeSchema,
});

/**
 * Validates individual packages.
 */
export const PackageSchema = z.object({
    weight: PackageWeightSchema,
    dimensions: PackageDimensionsSchema.optional(),
    packagingType: PackagingTypeSchema,
    declaredValue: MonetaryValueSchema.optional(),
    reference: z.string().max(50, 'Reference must be 50 characters or less').optional(),
});

export type PackageInput = z.infer<typeof PackageSchema>;

// =============================================================================
// Rate Request Schemas
// =============================================================================

/**
 * Validates rate request options.
 */
export const RateRequestOptionsSchema = z.object({
    serviceCodes: z.array(z.string().min(1)).optional(),
    saturdayDelivery: z.boolean().optional(),
    negotiatedRates: z.boolean().optional(),
    returnAllServices: z.boolean().optional(),
});

/**
 * Validates complete rate requests.
 */
export const RateRequestSchema = z.object({
    origin: AddressSchema,
    destination: AddressSchema,
    packages: z
        .array(PackageSchema)
        .min(1, 'At least one package is required')
        .max(25, 'Maximum 25 packages allowed'),
    shipDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ship date must be in YYYY-MM-DD format')
        .optional(),
    options: RateRequestOptionsSchema.optional(),
});

export type RateRequestInput = z.infer<typeof RateRequestSchema>;

// =============================================================================
// Label Request Schema
// =============================================================================

/**
 * Validates label creation requests.
 */
export const LabelRequestSchema = z.object({
    origin: AddressSchema,
    destination: AddressSchema,
    packages: z
        .array(PackageSchema)
        .min(1, 'At least one package is required')
        .max(25, 'Maximum 25 packages allowed'),
    serviceCode: z.string().min(1, 'Service code is required'),
    carrier: CarrierNameSchema,
    labelFormat: LabelFormatSchema.optional(),
});

export type LabelRequestInput = z.infer<typeof LabelRequestSchema>;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates a rate request and returns typed result.
 * @throws {z.ZodError} If validation fails
 */
export function validateRateRequest(data: unknown): RateRequestInput {
    return RateRequestSchema.parse(data);
}

/**
 * Validates a rate request safely without throwing.
 * @returns Validation result with success/error
 */
export function safeValidateRateRequest(data: unknown): z.SafeParseReturnType<unknown, RateRequestInput> {
    return RateRequestSchema.safeParse(data);
}

/**
 * Validates an address and returns typed result.
 * @throws {z.ZodError} If validation fails
 */
export function validateAddress(data: unknown): AddressInput {
    return AddressSchema.parse(data);
}

/**
 * Validates a package and returns typed result.
 * @throws {z.ZodError} If validation fails
 */
export function validatePackage(data: unknown): PackageInput {
    return PackageSchema.parse(data);
}

/**
 * Converts Zod validation errors to a field-error map.
 */
export function zodErrorToFieldErrors(error: z.ZodError): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of error.issues) {
        const path = issue.path.join('.');
        const key = path || '_root';

        if (!fieldErrors[key]) {
            fieldErrors[key] = [];
        }
        fieldErrors[key].push(issue.message);
    }

    return fieldErrors;
}
