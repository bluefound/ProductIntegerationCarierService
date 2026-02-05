/**
 * Unit tests for Zod validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
    AddressSchema,
    PackageSchema,
    PackageWeightSchema,
    PackageDimensionsSchema,
    RateRequestSchema,
} from '../../src/validation/schemas.js';
import { WeightUnit, DimensionUnit, PackagingType } from '../../src/domain/enums.js';

describe('Address Validation', () => {
    const validAddress = {
        addressLine1: '123 Main Street',
        city: 'Atlanta',
        stateProvinceCode: 'GA',
        postalCode: '30328',
        countryCode: 'US',
    };

    it('should accept a valid address', () => {
        const result = AddressSchema.safeParse(validAddress);
        expect(result.success).toBe(true);
    });

    it('should accept address with optional fields', () => {
        const result = AddressSchema.safeParse({
            ...validAddress,
            addressLine2: 'Suite 100',
            addressLine3: 'Building A',
            isResidential: true,
        });
        expect(result.success).toBe(true);
    });

    it('should reject empty addressLine1', () => {
        const result = AddressSchema.safeParse({
            ...validAddress,
            addressLine1: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toContain('Address line 1 is required');
        }
    });

    it('should reject invalid country code length', () => {
        const result = AddressSchema.safeParse({
            ...validAddress,
            countryCode: 'USA',
        });
        expect(result.success).toBe(false);
    });

    it('should reject lowercase country code', () => {
        const result = AddressSchema.safeParse({
            ...validAddress,
            countryCode: 'us',
        });
        expect(result.success).toBe(false);
    });

    it('should reject postal code with special characters', () => {
        const result = AddressSchema.safeParse({
            ...validAddress,
            postalCode: '303@28',
        });
        expect(result.success).toBe(false);
    });

    it('should accept postal code with hyphen', () => {
        const result = AddressSchema.safeParse({
            ...validAddress,
            postalCode: '30328-1234',
        });
        expect(result.success).toBe(true);
    });
});

describe('Package Weight Validation', () => {
    it('should accept valid weight in LB', () => {
        const result = PackageWeightSchema.safeParse({
            value: 5.5,
            unit: 'LB',
        });
        expect(result.success).toBe(true);
    });

    it('should accept valid weight in KG', () => {
        const result = PackageWeightSchema.safeParse({
            value: 2.5,
            unit: 'KG',
        });
        expect(result.success).toBe(true);
    });

    it('should reject zero weight', () => {
        const result = PackageWeightSchema.safeParse({
            value: 0,
            unit: 'LB',
        });
        expect(result.success).toBe(false);
    });

    it('should reject negative weight', () => {
        const result = PackageWeightSchema.safeParse({
            value: -5,
            unit: 'LB',
        });
        expect(result.success).toBe(false);
    });

    it('should reject weight over 150', () => {
        const result = PackageWeightSchema.safeParse({
            value: 151,
            unit: 'LB',
        });
        expect(result.success).toBe(false);
    });

    it('should reject invalid unit', () => {
        const result = PackageWeightSchema.safeParse({
            value: 5,
            unit: 'OZ',
        });
        expect(result.success).toBe(false);
    });
});

describe('Package Dimensions Validation', () => {
    it('should accept valid dimensions in IN', () => {
        const result = PackageDimensionsSchema.safeParse({
            length: 10,
            width: 8,
            height: 6,
            unit: 'IN',
        });
        expect(result.success).toBe(true);
    });

    it('should accept valid dimensions in CM', () => {
        const result = PackageDimensionsSchema.safeParse({
            length: 25,
            width: 20,
            height: 15,
            unit: 'CM',
        });
        expect(result.success).toBe(true);
    });

    it('should reject zero dimension', () => {
        const result = PackageDimensionsSchema.safeParse({
            length: 0,
            width: 8,
            height: 6,
            unit: 'IN',
        });
        expect(result.success).toBe(false);
    });

    it('should reject dimension over 108', () => {
        const result = PackageDimensionsSchema.safeParse({
            length: 110,
            width: 8,
            height: 6,
            unit: 'IN',
        });
        expect(result.success).toBe(false);
    });
});

describe('Package Validation', () => {
    const validPackage = {
        weight: {
            value: 5,
            unit: WeightUnit.LB,
        },
        packagingType: PackagingType.CUSTOM,
    };

    it('should accept valid package without dimensions', () => {
        const result = PackageSchema.safeParse(validPackage);
        expect(result.success).toBe(true);
    });

    it('should accept valid package with dimensions', () => {
        const result = PackageSchema.safeParse({
            ...validPackage,
            dimensions: {
                length: 10,
                width: 8,
                height: 6,
                unit: DimensionUnit.IN,
            },
        });
        expect(result.success).toBe(true);
    });

    it('should accept valid package with declared value', () => {
        const result = PackageSchema.safeParse({
            ...validPackage,
            declaredValue: {
                amount: 100,
                currency: 'USD',
            },
        });
        expect(result.success).toBe(true);
    });

    it('should reject invalid packaging type', () => {
        const result = PackageSchema.safeParse({
            ...validPackage,
            packagingType: 'INVALID',
        });
        expect(result.success).toBe(false);
    });
});

describe('Rate Request Validation', () => {
    const validRateRequest = {
        origin: {
            addressLine1: '123 Sender Street',
            city: 'Atlanta',
            stateProvinceCode: 'GA',
            postalCode: '30328',
            countryCode: 'US',
        },
        destination: {
            addressLine1: '456 Receiver Avenue',
            city: 'Los Angeles',
            stateProvinceCode: 'CA',
            postalCode: '90001',
            countryCode: 'US',
        },
        packages: [
            {
                weight: {
                    value: 5,
                    unit: WeightUnit.LB,
                },
                packagingType: PackagingType.CUSTOM,
            },
        ],
    };

    it('should accept valid rate request', () => {
        const result = RateRequestSchema.safeParse(validRateRequest);
        expect(result.success).toBe(true);
    });

    it('should accept rate request with ship date', () => {
        const result = RateRequestSchema.safeParse({
            ...validRateRequest,
            shipDate: '2024-01-15',
        });
        expect(result.success).toBe(true);
    });

    it('should reject invalid ship date format', () => {
        const result = RateRequestSchema.safeParse({
            ...validRateRequest,
            shipDate: '01-15-2024',
        });
        expect(result.success).toBe(false);
    });

    it('should reject empty packages array', () => {
        const result = RateRequestSchema.safeParse({
            ...validRateRequest,
            packages: [],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toContain('At least one package is required');
        }
    });

    it('should reject more than 25 packages', () => {
        const manyPackages = Array(26).fill({
            weight: { value: 1, unit: 'LB' },
            packagingType: 'CUSTOM',
        });

        const result = RateRequestSchema.safeParse({
            ...validRateRequest,
            packages: manyPackages,
        });
        expect(result.success).toBe(false);
    });
});
