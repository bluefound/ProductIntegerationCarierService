/**
 * UPS service code constants and mappings.
 */

/**
 * UPS Service codes and their descriptions.
 * Reference: https://developer.ups.com/api/reference/rating
 */
export const UPS_SERVICE_CODES = {
    // Domestic Services (US)
    '01': 'UPS Next Day Air',
    '02': 'UPS 2nd Day Air',
    '03': 'UPS Ground',
    '07': 'UPS Worldwide Express',
    '08': 'UPS Worldwide Expedited',
    '11': 'UPS Standard',
    '12': 'UPS 3 Day Select',
    '13': 'UPS Next Day Air Saver',
    '14': 'UPS Next Day Air Early',
    '54': 'UPS Worldwide Express Plus',
    '59': 'UPS 2nd Day Air A.M.',
    '65': 'UPS Saver',
    '82': 'UPS Today Standard',
    '83': 'UPS Today Dedicated Courier',
    '84': 'UPS Today Intercity',
    '85': 'UPS Today Express',
    '86': 'UPS Today Express Saver',
    '96': 'UPS Worldwide Express Freight',
} as const;

export type UPSServiceCode = keyof typeof UPS_SERVICE_CODES;

/**
 * Get human-readable service name from UPS service code.
 */
export function getServiceName(code: string): string {
    return UPS_SERVICE_CODES[code as UPSServiceCode] ?? `UPS Service ${code}`;
}

/**
 * UPS Packaging type codes.
 */
export const UPS_PACKAGING_CODES = {
    CUSTOM: '02',        // Customer Supplied Package
    LETTER: '01',        // UPS Letter
    TUBE: '03',          // Tube
    PAK: '04',           // PAK
    SMALL_BOX: '2a',     // Small Express Box
    MEDIUM_BOX: '2b',    // Medium Express Box
    LARGE_BOX: '2c',     // Large Express Box
} as const;

/**
 * Map domain packaging type to UPS packaging code.
 */
export function toUPSPackagingCode(
    type: 'CUSTOM' | 'LETTER' | 'TUBE' | 'PAK' | 'SMALL_BOX' | 'MEDIUM_BOX' | 'LARGE_BOX'
): string {
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
