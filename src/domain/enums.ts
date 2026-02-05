/**
 * Centralized domain enums with corresponding Zod schemas.
 * These enums provide type safety and runtime validation across the carrier integration service.
 */

import { z } from 'zod';

// =============================================================================
// Weight and Dimension Units
// =============================================================================

/**
 * Supported weight units for package weight measurement.
 */
export enum WeightUnit {
    LB = 'LB',
    KG = 'KG',
}

export const WeightUnitSchema = z.nativeEnum(WeightUnit);

/**
 * Supported dimension units for package measurements.
 */
export enum DimensionUnit {
    IN = 'IN',
    CM = 'CM',
}

export const DimensionUnitSchema = z.nativeEnum(DimensionUnit);

// =============================================================================
// Currency
// =============================================================================

/**
 * Supported currency codes for monetary values.
 */
export enum CurrencyCode {
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
    CAD = 'CAD',
}

export const CurrencyCodeSchema = z.nativeEnum(CurrencyCode);

/**
 * Safely parse a currency code string, returning the enum value or a default.
 * Logs a warning for unknown currencies to help with monitoring.
 */
export function parseCurrencyCode(code: string, defaultCurrency = CurrencyCode.USD): CurrencyCode {
    const result = CurrencyCodeSchema.safeParse(code);
    if (result.success) {
        return result.data;
    }
    console.warn(`Unknown currency code: "${code}", defaulting to ${defaultCurrency}`);
    return defaultCurrency;
}

// =============================================================================
// Carrier Names
// =============================================================================

/**
 * Carrier identifiers for supported shipping carriers.
 */
export enum CarrierName {
    UPS = 'UPS',
    FEDEX = 'FEDEX',
    USPS = 'USPS',
    DHL = 'DHL',
}

export const CarrierNameSchema = z.nativeEnum(CarrierName);

// =============================================================================
// Packaging Types
// =============================================================================

/**
 * Package type identifiers for common packaging options.
 */
export enum PackagingType {
    CUSTOM = 'CUSTOM',
    LETTER = 'LETTER',
    TUBE = 'TUBE',
    PAK = 'PAK',
    SMALL_BOX = 'SMALL_BOX',
    MEDIUM_BOX = 'MEDIUM_BOX',
    LARGE_BOX = 'LARGE_BOX',
}

export const PackagingTypeSchema = z.nativeEnum(PackagingType);

// =============================================================================
// Label Formats
// =============================================================================

/**
 * Supported label formats for shipping labels.
 */
export enum LabelFormat {
    PDF = 'PDF',
    PNG = 'PNG',
    ZPL = 'ZPL',
}

export const LabelFormatSchema = z.nativeEnum(LabelFormat);
