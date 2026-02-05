# Carrier Integration Service

A production-grade TypeScript service for integrating with shipping carriers. Provides a unified interface for rate shopping, tracking, and label creation with an extensible architecture supporting multiple carriers.

## 🏗️ Architecture

```
src/
├── domain/              # Core domain models and interfaces
│   ├── types.ts         # Carrier-agnostic domain types
│   └── carrier.interface.ts  # ICarrier interface & registry
├── carriers/            # Carrier implementations
│   └── ups/
│       ├── ups.carrier.ts    # UPS implementation
│       ├── types.ts          # UPS-specific types
│       ├── mapper.ts         # Request/response mappers
│       └── constants.ts      # Service codes, API paths
├── services/            # Infrastructure services
│   ├── config.service.ts     # Environment configuration
│   ├── oauth.service.ts      # OAuth 2.0 token management
│   └── http-client.ts        # HTTP client with error handling
├── validation/          # Zod validation schemas
│   └── schemas.ts       # Runtime validation
└── errors/              # Custom error classes
    └── index.ts         # Error hierarchy
```

## 🎯 Key Design Decisions

### 1. Carrier Interface Pattern
All carriers implement the `ICarrier` interface, enabling:
- Easy addition of new carriers (FedEx, USPS, DHL)
- Rate shopping across multiple carriers
- Consistent error handling

```typescript
interface ICarrier {
  readonly name: CarrierName;
  rate(request: RateRequest): Promise<RateResponse>;
  track(trackingNumber: string): Promise<TrackingResponse>;
  createLabel(request: LabelRequest): Promise<LabelResponse>;
}
```

### 2. Domain-Driven Types
Carrier-agnostic types that any carrier implementation must map to/from:
- `RateRequest` / `RateResponse` - Standard rate shopping interface
- `Address`, `Package`, `RateQuote` - Reusable domain models

### 3. OAuth 2.0 with Token Caching
- In-memory token caching
- Automatic refresh before expiry (5-minute buffer)
- Thread-safe refresh (prevents concurrent token requests)

### 4. Structured Error Handling
```typescript
CarrierError          // Base class
├── AuthenticationError   // OAuth failures
├── RateLimitError        // 429 with retry-after
├── ValidationError       // Request validation
├── NetworkError          // Timeouts, connection issues
├── CarrierApiError       // Carrier API errors
└── NotImplementedError   // Planned features
```

### 5. Zod Runtime Validation
All requests are validated at runtime with detailed error messages:
- Address validation (postal code format, country codes)
- Package constraints (weight/dimension limits)
- Request-level validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Configuration
Copy `.env.example` to `.env` and configure:
```env
UPS_CLIENT_ID=your_client_id
UPS_CLIENT_SECRET=your_client_secret
UPS_MERCHANT_ID=your_account_number
UPS_BASE_URL=https://wwwcie.ups.com  # Sandbox
```

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test                 # Run all tests
npm run test:coverage    # With coverage report
```

### Type Check
```bash
npm run type-check
```

## 📖 Usage Example

```typescript
import { UPSCarrier, HttpClient, OAuthService, ConfigService } from 'carrier-integration-service';

// Get configuration
const config = ConfigService.getInstance();

// Create HTTP client
const httpClient = new HttpClient({
  baseUrl: config.ups.baseUrl,
  carrier: 'UPS',
  timeoutMs: 30000,
});

// Create OAuth service
const oauthService = new OAuthService(httpClient.client, {
  tokenUrl: config.ups.oauthUrl,
  clientId: config.ups.clientId,
  clientSecret: config.ups.clientSecret,
  carrier: 'UPS',
  additionalHeaders: { 'x-merchant-id': config.ups.merchantId },
});

// Create UPS carrier
const upsCarrier = new UPSCarrier(httpClient, oauthService, {
  accountNumber: config.ups.merchantId,
  useNegotiatedRates: true,
});

// Get rates
const response = await upsCarrier.rate({
  origin: {
    addressLine1: '123 Sender St',
    city: 'Atlanta',
    stateProvinceCode: 'GA',
    postalCode: '30328',
    countryCode: 'US',
  },
  destination: {
    addressLine1: '456 Receiver Ave',
    city: 'Los Angeles',
    stateProvinceCode: 'CA',
    postalCode: '90001',
    countryCode: 'US',
    isResidential: true,
  },
  packages: [{
    weight: { value: 5, unit: 'LB' },
    dimensions: { length: 10, width: 8, height: 6, unit: 'IN' },
    packagingType: 'CUSTOM',
  }],
});

console.log(`Found ${response.quotes.length} rate options`);
response.quotes.forEach(quote => {
  console.log(`${quote.serviceName}: $${quote.totalPrice.amount}`);
});
```

## 🔌 Adding a New Carrier

1. Create carrier directory: `src/carriers/your-carrier/`
2. Implement the `ICarrier` interface
3. Create request/response mappers
4. Add to carrier registry

```typescript
// src/carriers/fedex/fedex.carrier.ts
export class FedExCarrier implements ICarrier {
  readonly name = 'FEDEX' as const;
  
  async rate(request: RateRequest): Promise<RateResponse> {
    // 1. Validate request
    // 2. Map to FedEx format
    // 3. Call FedEx API
    // 4. Map response to domain format
  }
}
```

## 🧪 Testing

Tests are written using Vitest with mocked HTTP responses:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Categories
- **Unit tests**: Validation schemas, mappers
- **Integration tests**: Full carrier flow with mocked HTTP

## 📋 Future Improvements

Given more time, I would add:

1. **Tracking & Label Creation**: Full implementation of `track()` and `createLabel()` methods
2. **Redis Token Caching**: For distributed deployments
3. **Circuit Breaker**: Resilience pattern for carrier API failures
4. **Retry Logic**: Automatic retry with exponential backoff for transient failures
5. **Rate Limiting**: Client-side rate limiting to prevent 429s
6. **Metrics & Observability**: Request timing, success rates, error tracking
7. **Additional Carriers**: FedEx, USPS, DHL implementations
8. **Express API Layer**: REST endpoints for rate shopping
9. **Webhook Support**: Async tracking updates
10. **Multi-package Optimization**: Rate shopping for multi-box shipments

## 📄 License

MIT
