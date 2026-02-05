/**
 * UPS service code constants and mappings.
 */

import { z } from 'zod';

// =============================================================================
// UPS Service Codes
// =============================================================================

/**
 * UPS Service code enum values.
 * Reference: https://developer.ups.com/api/reference/rating
 */
export enum UPSServiceCode {
    NEXT_DAY_AIR = '01',
    SECOND_DAY_AIR = '02',
    GROUND = '03',
    WORLDWIDE_EXPRESS = '07',
    WORLDWIDE_EXPEDITED = '08',
    STANDARD = '11',
    THREE_DAY_SELECT = '12',
    NEXT_DAY_AIR_SAVER = '13',
    NEXT_DAY_AIR_EARLY = '14',
    WORLDWIDE_EXPRESS_PLUS = '54',
    SECOND_DAY_AIR_AM = '59',
    SAVER = '65',
    TODAY_STANDARD = '82',
    TODAY_DEDICATED_COURIER = '83',
    TODAY_INTERCITY = '84',
    TODAY_EXPRESS = '85',
    TODAY_EXPRESS_SAVER = '86',
    WORLDWIDE_EXPRESS_FREIGHT = '96',
}

/**
 * Zod schema for validating UPS service codes.
 */
export const UPSServiceCodeSchema = z.nativeEnum(UPSServiceCode);

/**
 * Human-readable names for each UPS service code.
 */
export const UPS_SERVICE_NAMES: Record<UPSServiceCode, string> = {
    [UPSServiceCode.NEXT_DAY_AIR]: 'UPS Next Day Air',
    [UPSServiceCode.SECOND_DAY_AIR]: 'UPS 2nd Day Air',
    [UPSServiceCode.GROUND]: 'UPS Ground',
    [UPSServiceCode.WORLDWIDE_EXPRESS]: 'UPS Worldwide Express',
    [UPSServiceCode.WORLDWIDE_EXPEDITED]: 'UPS Worldwide Expedited',
    [UPSServiceCode.STANDARD]: 'UPS Standard',
    [UPSServiceCode.THREE_DAY_SELECT]: 'UPS 3 Day Select',
    [UPSServiceCode.NEXT_DAY_AIR_SAVER]: 'UPS Next Day Air Saver',
    [UPSServiceCode.NEXT_DAY_AIR_EARLY]: 'UPS Next Day Air Early',
    [UPSServiceCode.WORLDWIDE_EXPRESS_PLUS]: 'UPS Worldwide Express Plus',
    [UPSServiceCode.SECOND_DAY_AIR_AM]: 'UPS 2nd Day Air A.M.',
    [UPSServiceCode.SAVER]: 'UPS Saver',
    [UPSServiceCode.TODAY_STANDARD]: 'UPS Today Standard',
    [UPSServiceCode.TODAY_DEDICATED_COURIER]: 'UPS Today Dedicated Courier',
    [UPSServiceCode.TODAY_INTERCITY]: 'UPS Today Intercity',
    [UPSServiceCode.TODAY_EXPRESS]: 'UPS Today Express',
    [UPSServiceCode.TODAY_EXPRESS_SAVER]: 'UPS Today Express Saver',
    [UPSServiceCode.WORLDWIDE_EXPRESS_FREIGHT]: 'UPS Worldwide Express Freight',
};

/**
 * Get human-readable service name from UPS service code.
 * Uses Zod parsing to validate the code before lookup.
 */
export function getServiceName(code: string): string {
    const result = UPSServiceCodeSchema.safeParse(code);
    if (result.success) {
        return UPS_SERVICE_NAMES[result.data];
    }
    return `UPS Service ${code}`;
}

// =============================================================================
// UPS Packaging Codes
// =============================================================================

import { PackagingType } from '../../domain/types.js';

/**
 * Mapping from domain PackagingType enum to UPS-specific packaging codes.
 */
export const UPS_PACKAGING_CODES: Record<PackagingType, string> = {
    [PackagingType.CUSTOM]: '02',        // Customer Supplied Package
    [PackagingType.LETTER]: '01',        // UPS Letter
    [PackagingType.TUBE]: '03',          // Tube
    [PackagingType.PAK]: '04',           // PAK
    [PackagingType.SMALL_BOX]: '2a',     // Small Express Box
    [PackagingType.MEDIUM_BOX]: '2b',    // Medium Express Box
    [PackagingType.LARGE_BOX]: '2c',     // Large Express Box
};

/**
 * Map domain packaging type to UPS packaging code.
 * Type-safe function that accepts the PackagingType enum.
 */
export function toUPSPackagingCode(type: PackagingType): string {
    return UPS_PACKAGING_CODES[type];
}

/**
 * UPS API endpoint paths.
 */
export const UPS_API_PATHS = {
    /** Rate endpoint (Shop request returns all services) */
    RATE_SHOP: '/api/rating/v2403/Shop',
    /** Rate endpoint (Rate request returns single service) */
    RATE: '/api/rating/v2403/Rate',
    /** Track endpoint */
    TRACK: '/api/track/v1/details',
    /** Ship endpoint for label creation */
    SHIP: '/api/shipments/v2403/ship',
} as const;

/**
 * UPS Weight unit codes.
 */
export const UPS_WEIGHT_UNITS = {
    LB: 'LBS',
    KG: 'KGS',
} as const;

/**
 * UPS Dimension unit codes.
 */
export const UPS_DIMENSION_UNITS = {
    IN: 'IN',
    CM: 'CM',
} as const;

/**
 * Default request timeout in milliseconds.
 */
export const UPS_DEFAULT_TIMEOUT_MS = 30000;

/**
 * UPS API version for request headers.
 */
export const UPS_API_VERSION = '2403';
