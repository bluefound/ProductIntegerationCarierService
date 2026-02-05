/**
 * Realistic UPS API response fixtures for testing.
 * Based on actual UPS Rating API documentation.
 */

import type { UPSRateResponse, UPSOAuthResponse } from '../../src/carriers/ups/types.js';

/**
 * Successful OAuth token response.
 */
export const successfulOAuthResponse: UPSOAuthResponse = {
    token_type: 'Bearer',
    issued_at: '1612345678901',
    client_id: 'test-client-id',
    access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ1cHMuY29tIiwiZXhwIjoxNjEyMzQ5Mjc4LCJpYXQiOjE2MTIzNDU2Nzh9.test-signature',
    expires_in: '3600',
    status: 'approved',
};

/**
 * Successful rate response with multiple services.
 */
export const successfulRateResponse: UPSRateResponse = {
    RateResponse: {
        Response: {
            ResponseStatus: {
                Code: '1',
                Description: 'Success',
            },
            TransactionReference: {
                CustomerContext: 'rate-test-context',
            },
        },
        RatedShipment: [
            {
                Service: {
                    Code: '03',
                    Description: 'UPS Ground',
                },
                BillingWeight: {
                    UnitOfMeasurement: {
                        Code: 'LBS',
                        Description: 'Pounds',
                    },
                    Weight: '5.0',
                },
                TransportationCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '12.50',
                },
                BaseServiceCharge: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '10.00',
                },
                ServiceOptionsCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '0.00',
                },
                TotalCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '15.99',
                },
                GuaranteedDelivery: {
                    BusinessDaysInTransit: '5',
                },
                TimeInTransit: {
                    ServiceSummary: {
                        Service: {
                            Description: 'UPS Ground',
                        },
                        EstimatedArrival: {
                            Arrival: {
                                Date: '2024-01-20',
                                Time: '235900',
                            },
                            BusinessDaysInTransit: '5',
                        },
                        SaturdayDelivery: 'N',
                    },
                },
                ItemizedCharges: [
                    {
                        Code: 'FUEL',
                        Description: 'Fuel Surcharge',
                        CurrencyCode: 'USD',
                        MonetaryValue: '2.49',
                    },
                    {
                        Code: 'RES',
                        Description: 'Residential Surcharge',
                        CurrencyCode: 'USD',
                        MonetaryValue: '3.00',
                    },
                ],
            },
            {
                Service: {
                    Code: '02',
                    Description: 'UPS 2nd Day Air',
                },
                BillingWeight: {
                    UnitOfMeasurement: {
                        Code: 'LBS',
                        Description: 'Pounds',
                    },
                    Weight: '5.0',
                },
                TransportationCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '28.75',
                },
                BaseServiceCharge: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '25.00',
                },
                ServiceOptionsCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '0.00',
                },
                TotalCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '32.50',
                },
                GuaranteedDelivery: {
                    BusinessDaysInTransit: '2',
                    DeliveryByTime: '10:30 A.M.',
                },
                TimeInTransit: {
                    ServiceSummary: {
                        Service: {
                            Description: 'UPS 2nd Day Air',
                        },
                        EstimatedArrival: {
                            Arrival: {
                                Date: '2024-01-17',
                                Time: '103000',
                            },
                            BusinessDaysInTransit: '2',
                        },
                        SaturdayDelivery: 'N',
                    },
                },
                ItemizedCharges: [
                    {
                        Code: 'FUEL',
                        Description: 'Fuel Surcharge',
                        CurrencyCode: 'USD',
                        MonetaryValue: '3.75',
                    },
                ],
            },
            {
                Service: {
                    Code: '01',
                    Description: 'UPS Next Day Air',
                },
                BillingWeight: {
                    UnitOfMeasurement: {
                        Code: 'LBS',
                        Description: 'Pounds',
                    },
                    Weight: '5.0',
                },
                TransportationCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '55.00',
                },
                BaseServiceCharge: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '50.00',
                },
                ServiceOptionsCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '0.00',
                },
                TotalCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '62.99',
                },
                GuaranteedDelivery: {
                    BusinessDaysInTransit: '1',
                    DeliveryByTime: '10:30 A.M.',
                },
                TimeInTransit: {
                    ServiceSummary: {
                        Service: {
                            Description: 'UPS Next Day Air',
                        },
                        EstimatedArrival: {
                            Arrival: {
                                Date: '2024-01-16',
                                Time: '103000',
                            },
                            BusinessDaysInTransit: '1',
                        },
                        SaturdayDelivery: 'Y',
                    },
                },
                ItemizedCharges: [
                    {
                        Code: 'FUEL',
                        Description: 'Fuel Surcharge',
                        CurrencyCode: 'USD',
                        MonetaryValue: '7.99',
                    },
                ],
            },
        ],
    },
};

/**
 * Rate response with negotiated rates.
 */
export const negotiatedRateResponse: UPSRateResponse = {
    RateResponse: {
        Response: {
            ResponseStatus: {
                Code: '1',
                Description: 'Success',
            },
        },
        RatedShipment: [
            {
                Service: {
                    Code: '03',
                    Description: 'UPS Ground',
                },
                BillingWeight: {
                    UnitOfMeasurement: {
                        Code: 'LBS',
                    },
                    Weight: '5.0',
                },
                TransportationCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '12.50',
                },
                TotalCharges: {
                    CurrencyCode: 'USD',
                    MonetaryValue: '15.99',
                },
                NegotiatedRateCharges: {
                    TotalCharge: {
                        CurrencyCode: 'USD',
                        MonetaryValue: '12.99',
                    },
                },
                GuaranteedDelivery: {
                    BusinessDaysInTransit: '5',
                },
            },
        ],
    },
};

/**
 * Error response - authentication failure.
 */
export const authErrorResponse = {
    response: {
        errors: [
            {
                code: '10401',
                message: 'Invalid access token',
            },
        ],
    },
};

/**
 * Error response - invalid address.
 */
export const invalidAddressErrorResponse = {
    response: {
        errors: [
            {
                code: '111210',
                message: 'The postal code is invalid for the destination country.',
            },
        ],
    },
};

/**
 * Error response - rate limit exceeded.
 */
export const rateLimitErrorResponse = {
    response: {
        errors: [
            {
                code: '429',
                message: 'Rate limit exceeded. Please try again later.',
            },
        ],
    },
};

/**
 * Valid rate request fixture for testing.
 */
export const validRateRequest = {
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
        isResidential: true,
    },
    packages: [
        {
            weight: {
                value: 5.0,
                unit: 'LB' as const,
            },
            dimensions: {
                length: 10,
                width: 8,
                height: 6,
                unit: 'IN' as const,
            },
            packagingType: 'CUSTOM' as const,
        },
    ],
};

/**
 * Invalid rate request fixture for testing validation.
 */
export const invalidRateRequest = {
    origin: {
        addressLine1: '', // Empty - should fail validation
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
        countryCode: 'USA', // Invalid - should be 2 chars
    },
    packages: [], // Empty - should fail validation
};
