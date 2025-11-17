# Production Features Documentation

This document details all production-ready features implemented in the URL Shortener application.

## Table of Contents

1. [Multi-Payment Gateway System](#multi-payment-gateway-system)
2. [Invoice Management](#invoice-management)
3. [Transaction Tracking](#transaction-tracking)
4. [Subscription History](#subscription-history)
5. [Logging System](#logging-system)
6. [Super Admin Functionality](#super-admin-functionality)
7. [Database Backup & Recovery](#database-backup--recovery)
8. [Security Features](#security-features)

---

## Multi-Payment Gateway System

### Overview

The application supports multiple payment gateways with automatic routing based on currency, payment method, and user preferences.

### Supported Gateways

#### 1. Stripe
- **Primary Use**: International payments
- **Supported Currencies**: SAR, USD, AED, EUR, GBP, KWD, BHD, OMR, QAR
- **Supported Methods**: Credit cards, Apple Pay, Google Pay, Link
- **Fees**: 2.9% + fixed fee (varies by currency)
- **Features**:
  - Full subscription management
  - Customer management
  - Saved payment methods
  - Recurring billing
  - Webhooks for real-time updates

#### 2. Moyasar
- **Primary Use**: Saudi Arabia and GCC payments
- **Supported Currencies**: SAR, AED, KWD, BHD, OMR, QAR
- **Supported Methods**: Mada, Credit cards, Apple Pay, STC Pay
- **Fees**: 1.5% (Mada), 2.5% (Credit cards)
- **Features**:
  - Optimized for Saudi market
  - Mada card support
  - STC Pay integration
  - Lower fees for GCC currencies
  - Webhooks for payment updates

### Gateway Selection Logic

The system automatically selects the optimal gateway based on:

1. **User Preference**: If user has a preferred gateway, use it
2. **Payment Method**: Mada/STC Pay → Moyasar
3. **Currency Optimization**: SAR/GCC currencies → Moyasar (better rates)
4. **Default Fallback**: Configured default gateway

### Usage

```javascript
const paymentGatewayFactory = require('./services/payment-gateways/PaymentGatewayFactory');

// Initialize gateways
await paymentGatewayFactory.initialize();

// Get optimal gateway
const { gateway, gatewayName, fees } = paymentGatewayFactory.selectOptimalGateway({
  currency: 'SAR',
  paymentMethod: 'mada',
  user: currentUser,
  amount: 99
});

// Create payment
const result = await gateway.createPayment({
  amount: 99,
  currency: 'SAR',
  description: 'Pro Plan Subscription',
  metadata: { userId: user._id }
});
```

### Gateway Factory Methods

- `initialize()` - Initialize all configured gateways
- `getGateway(name)` - Get specific gateway instance
- `selectOptimalGateway(data)` - Select best gateway for payment
- `compareFees(amount, currency)` - Compare fees across gateways
- `verifyWebhook(gateway, payload, signature)` - Verify webhook signature
- `getAvailableGateways()` - List all available gateways

---

## Invoice Management

### Overview

Comprehensive invoice management system with PDF generation, VAT calculations, and multi-currency support.

### Features

- **Auto-generated Invoice Numbers**: Format `INV-YYYYMM-00001`
- **VAT Calculation**: Automatic 15% VAT for Saudi Arabia
- **Multi-currency Support**: SAR, USD, AED, EUR, KWD, BHD, OMR
- **PDF Generation**: Professional PDF invoices with company branding
- **Email Delivery**: Automatic invoice email with PDF attachment
- **Payment Tracking**: Link invoices to transactions and subscriptions
- **Status Management**: draft, pending, paid, partially_paid, overdue, cancelled, refunded

### Invoice Model

```javascript
{
  invoiceNumber: "INV-202401-00001",
  userId: ObjectId,
  subscriptionId: ObjectId,
  transactionId: ObjectId,
  status: "paid",

  billingInfo: {
    name: "Customer Name",
    email: "customer@example.com",
    company: "Company Ltd",
    address: {
      street: "123 Main St",
      city: "Riyadh",
      country: "SA"
    },
    taxId: "300000000000003"
  },

  items: [{
    description: "Pro Plan - monthly subscription",
    planName: "pro",
    quantity: 1,
    unitPrice: 99,
    subtotal: 99
  }],

  currency: "SAR",
  subtotal: 99,

  tax: {
    rate: 15,
    amount: 14.85
  },

  total: 113.85,
  amountPaid: 113.85,
  amountDue: 0,

  issueDate: Date,
  dueDate: Date,
  paidDate: Date
}
```

### Invoice Service Methods

```javascript
const invoiceService = require('./services/invoiceService');

// Create invoice
const result = await invoiceService.createInvoice({
  userId,
  items: [...],
  billingInfo: {...},
  currency: 'SAR'
});

// Generate PDF
await invoiceService.generatePDF(invoiceId);

// Mark as paid
await invoiceService.markInvoiceAsPaid(invoiceId, amount);

// Send email
await invoiceService.sendInvoiceEmail(invoiceId);

// Get statistics
const stats = await invoiceService.getInvoiceStats(userId);
```

### PDF Features

- Company branding
- Professional layout
- Itemized line items
- VAT breakdown
- Payment status
- Billing period
- Notes section
- QR code (optional)

---

## Transaction Tracking

### Overview

Complete transaction tracking across all payment gateways with fraud detection and reconciliation support.

### Features

- **Unique Transaction IDs**: Format `TXN-YYYYMMDD-XXXXXX`
- **Multi-gateway Support**: Track transactions from all gateways
- **Status Tracking**: pending, processing, completed, failed, cancelled, refunded
- **Fee Calculation**: Gateway fees and platform fees
- **Refund Management**: Full and partial refunds
- **Fraud Detection**: Risk scoring and flagging
- **Retry Logic**: Automatic retry for failed transactions
- **Webhook Integration**: Real-time updates from gateways

### Transaction Model

```javascript
{
  transactionId: "TXN-20240115-ABC123",
  userId: ObjectId,
  invoiceId: ObjectId,

  paymentGateway: "moyasar",
  gatewayTransactionId: "payment_xyz123",

  type: "payment",
  status: "completed",

  amount: 113.85,
  currency: "SAR",

  fee: {
    gatewayFee: 2.85,
    platformFee: 0,
    total: 2.85
  },

  netAmount: 111.00,

  paymentMethod: {
    type: "mada",
    brand: "mada",
    last4: "1234"
  },

  ipAddress: "1.2.3.4",
  riskScore: 15,
  riskLevel: "low",

  metadata: {...}
}
```

### Transaction Service Methods

```javascript
// Get user transactions
const transactions = await Transaction.getUserTransactions(userId, {
  status: 'completed',
  limit: 50
});

// Get statistics
const stats = await Transaction.getTransactionStats(userId, {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});

// Process refund
await transaction.processRefund(amount, reason);
```

---

## Subscription History

### Overview

Comprehensive audit trail for all subscription lifecycle events.

### Tracked Events

- `subscription_created` - New subscription
- `subscription_activated` - Subscription activated
- `subscription_upgraded` - Plan upgrade
- `subscription_downgraded` - Plan downgrade
- `subscription_renewed` - Renewal payment
- `subscription_cancelled` - Cancellation
- `subscription_expired` - Expiration
- `payment_succeeded` - Successful payment
- `payment_failed` - Failed payment
- `plan_changed` - Plan modification
- `feature_enabled` - Feature activation
- `feature_disabled` - Feature deactivation

### History Model

```javascript
{
  eventId: "SUB-20240115-XYZ789",
  userId: ObjectId,
  eventType: "subscription_upgraded",

  subscription: {
    plan: "pro",
    previousPlan: "basic",
    billingCycle: "monthly",
    status: "active",

    price: {
      amount: 99,
      currency: "SAR"
    },

    features: {
      maxUrls: 10000,
      maxCustomDomains: 5,
      analyticsEnabled: true
    }
  },

  payment: {
    transactionId: ObjectId,
    amount: 99,
    paymentStatus: "completed"
  },

  metadata: {
    reason: "Need more URLs",
    source: "user",
    ipAddress: "1.2.3.4"
  },

  performedBy: {
    userId: ObjectId,
    userType: "user"
  },

  eventTimestamp: Date
}
```

### Analytics Methods

```javascript
// Get user timeline
const timeline = await SubscriptionHistory.getTimeline(userId);

// Get upgrade/downgrade patterns
const patterns = await SubscriptionHistory.getUpgradeDowngradePatterns();

// Churn analysis
const churnData = await SubscriptionHistory.getChurnAnalysis({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});
```

---

## Logging System

### Overview

Winston-based structured logging with daily rotation and specialized loggers.

### Log Levels

- **error**: Error events
- **warn**: Warning events
- **info**: Informational messages
- **debug**: Debug information (development only)

### Specialized Loggers

1. **HTTP Logger**: Request/response logging
2. **Database Logger**: DB operations and queries
3. **Authentication Logger**: Login/logout events
4. **Payment Logger**: Payment transactions
5. **Analytics Logger**: Analytics events
6. **Email Logger**: Email delivery
7. **System Logger**: System events

### Log Files

- `application-YYYY-MM-DD.log` - All application logs
- `errors-YYYY-MM-DD.log` - Error logs only
- `exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `rejections-YYYY-MM-DD.log` - Unhandled promise rejections

### Usage

```javascript
const {
  httpLogger,
  paymentLogger,
  authLogger
} = require('./utils/logger');

// HTTP request logging
httpLogger.info('Request processed', {
  method: 'POST',
  url: '/api/payment',
  statusCode: 200,
  userId: user._id
});

// Payment logging
paymentLogger.info('Payment processed', {
  transactionId,
  amount,
  gateway: 'moyasar'
});

// Authentication logging
authLogger.info('User login', {
  userId,
  ip: req.ip
});
```

### Express Middleware

```javascript
const { requestLoggerMiddleware, errorLoggerMiddleware } = require('./utils/logger');

app.use(requestLoggerMiddleware);
app.use(errorLoggerMiddleware);
```

---

## Super Admin Functionality

### Overview

Special administrative role with unlimited access and features.

### Features

- **Unlimited Resources**: No limits on URLs, domains, or features
- **All Features Enabled**: Access to all platform features
- **User Management**: Manage all users
- **Payment Oversight**: View all transactions
- **Analytics Access**: System-wide analytics
- **Configuration**: Modify system settings

### Initialization

```bash
# Interactive
node scripts/init-super-admin.js

# Automated
SUPER_ADMIN_EMAIL=admin@laghhu.link \
SUPER_ADMIN_PASSWORD=SecurePass123! \
node scripts/init-super-admin.js
```

### Super Admin Permissions

```javascript
{
  role: "super_admin",
  subscription: {
    plan: "enterprise",
    status: "active",
    billingCycle: "lifetime",
    features: {
      maxUrls: -1,              // Unlimited
      maxCustomDomains: -1,     // Unlimited
      analyticsEnabled: true,
      qrCodesEnabled: true,
      customBrandingEnabled: true,
      apiAccessEnabled: true,
      bulkOperationsEnabled: true
    }
  }
}
```

---

## Database Backup & Recovery

### Features

- **Automated Backups**: Daily scheduled backups
- **Compression**: Gzip compression for storage efficiency
- **Retention Policy**: Configurable retention period
- **Cloud Storage**: Optional S3 upload
- **Easy Restoration**: Simple restore process

### Backup Script

```bash
# Manual backup
./scripts/backup-database.sh

# Automated (crontab)
0 2 * * * /var/www/url-shortener/scripts/backup-database.sh
```

### Restore Script

```bash
# Local restore
./scripts/restore-database.sh backup_url-shortener_20240115_120000.tar.gz

# Restore from S3
S3_RESTORE=true ./scripts/restore-database.sh backup_url-shortener_20240115_120000.tar.gz
```

### S3 Configuration

```env
S3_BUCKET=your-backup-bucket
AWS_REGION=us-east-1
BACKUP_RETENTION=30
```

---

## Security Features

### Payment Security

- Webhook signature verification
- PCI-compliant payment handling
- Secure API key storage
- Encrypted communication

### Data Security

- Bcrypt password hashing
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Infrastructure Security

- HTTPS only
- Security headers
- Rate limiting
- CORS configuration
- Environment variable isolation

---

## API Endpoints

### Payment Endpoints

```
POST   /api/payments/create           - Create payment
POST   /api/payments/:id/confirm      - Confirm payment
GET    /api/payments/:id/status       - Get payment status
POST   /api/payments/:id/refund       - Refund payment
POST   /api/webhooks/stripe           - Stripe webhook
POST   /api/webhooks/moyasar          - Moyasar webhook
```

### Invoice Endpoints

```
POST   /api/invoices                  - Create invoice
GET    /api/invoices                  - List invoices
GET    /api/invoices/:id              - Get invoice
GET    /api/invoices/:id/pdf          - Download PDF
POST   /api/invoices/:id/send         - Send email
```

### Transaction Endpoints

```
GET    /api/transactions              - List transactions
GET    /api/transactions/:id          - Get transaction
GET    /api/transactions/stats        - Get statistics
```

---

## Configuration

### Payment Plans

```javascript
const plans = {
  free: {
    SAR: 0,
    USD: 0
  },
  basic: {
    SAR: 29,
    USD: 8,
    features: {
      maxUrls: 1000,
      maxCustomDomains: 1
    }
  },
  pro: {
    SAR: 99,
    USD: 26,
    features: {
      maxUrls: 10000,
      maxCustomDomains: 5,
      analyticsEnabled: true,
      qrCodesEnabled: true
    }
  },
  enterprise: {
    SAR: 299,
    USD: 80,
    features: {
      maxUrls: -1,
      maxCustomDomains: -1,
      analyticsEnabled: true,
      qrCodesEnabled: true,
      customBrandingEnabled: true,
      apiAccessEnabled: true
    }
  }
};
```

---

## Support

For production support:
- Email: support@laghhu.link
- Documentation: https://docs.laghhu.link
- Status Page: https://status.laghhu.link

---

**Version**: 2.0.0
**Last Updated**: January 2024
