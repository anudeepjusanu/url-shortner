# Payment & Subscription Features

## Overview

This document outlines the comprehensive payment and subscription system implemented for the URL shortener platform. The system is built with Stripe integration and includes advanced features for subscription management, billing, and user notifications.

---

## Features Implemented

### 1. Payment Method Management

Users can manage multiple payment methods with the following capabilities:

- **Add Payment Methods**: Users can add multiple credit/debit cards
- **Set Default**: Designate a primary payment method
- **Remove Payment Methods**: Delete unused payment methods
- **Automatic Updates**: Payment methods are automatically updated in Stripe

**API Endpoints:**
- `POST /api/subscriptions/payment-methods` - Add a new payment method
- `GET /api/subscriptions/payment-methods` - Get all payment methods
- `PUT /api/subscriptions/payment-methods/:id/default` - Set as default
- `DELETE /api/subscriptions/payment-methods/:id` - Remove payment method

### 2. Subscription Trials

Comprehensive trial period support with:

- **Configurable Trial Duration**: Default 14 days, customizable per subscription
- **Trial Notifications**: Automated emails at 7 days and 3 days before trial end
- **No Payment Required**: Trials can start without immediate payment
- **Automatic Conversion**: Seamless conversion to paid subscription after trial

**Features:**
- Trial start and end dates tracked in user subscription
- Email notifications for trial ending
- Grace period before charging

### 3. Discount Codes & Coupons

Full-featured coupon system with:

- **Percentage Discounts**: E.g., 20% off
- **Fixed Amount Discounts**: E.g., $50 off
- **Max Discount Caps**: Set maximum discount amounts
- **Usage Limits**: Global and per-user limits
- **Expiration Dates**: Valid from/until dates
- **Plan-Specific**: Restrict coupons to specific plans
- **Campaign Tracking**: Metadata for marketing campaigns

**Sample Coupons:**
- `WELCOME20` - 20% off first month
- `SAVE50` - $50 off any plan
- `BLACKFRIDAY` - 50% off annual plans
- `ENTERPRISE30` - 30% off Enterprise plan
- `YEARLY25` - 25% off yearly subscription

**API Endpoints:**
- `POST /api/subscriptions/validate-coupon` - Validate a coupon code
- `POST /api/subscriptions/apply-coupon` - Apply coupon to subscription

**Initialization:**
```bash
node scripts/init-coupons.js
```

### 4. Subscription Pause/Resume

Flexible subscription management:

- **Pause Subscription**: Temporarily pause billing
- **Optional Resume Date**: Set automatic resume date
- **Data Preservation**: All user data remains intact
- **Link Continuity**: Existing short links continue to work
- **Email Notifications**: Automated notifications for pause/resume

**API Endpoints:**
- `POST /api/subscriptions/pause` - Pause subscription
- `POST /api/subscriptions/resume` - Resume subscription

### 5. Usage-Based Billing

Overage tracking and billing:

- **Automatic Tracking**: Monitor usage across all metrics
- **Overage Charges**: $0.01 per URL over limit, $0.001 per API call
- **Email Alerts**: Notifications when overages occur
- **Invoice Integration**: Overage charges added to next invoice
- **Monthly Reset**: Usage counters reset automatically

**Tracked Metrics:**
- URLs created per month
- API calls per month
- Custom domains used
- Total URLs created

### 6. Comprehensive Billing Portal

Full-featured billing dashboard including:

**Overview Tab:**
- Current plan and status
- Trial information (if applicable)
- Applied discounts
- Next billing date
- Subscription actions (pause, resume, cancel, upgrade)
- Upcoming invoice details
- Coupon code application

**Payment Methods Tab:**
- List all payment methods
- Add new payment methods
- Set default payment method
- Remove payment methods
- Card details (brand, last 4 digits, expiration)

**Invoices Tab:**
- Invoice history
- Download PDF invoices
- Payment status
- Amount and date

**Usage Tab:**
- Current month's usage
- Total usage statistics
- Plan limits and overages
- Visual usage indicators

### 7. Email Notification System

Automated email notifications for:

**Payment Reminders:**
- Sent 3 days before billing date
- Shows amount due and billing date
- Option to view/update payment methods

**Trial Ending Notifications:**
- Sent at 7 days and 3 days before trial end
- Explains next steps
- Option to cancel before charge

**Payment Failed:**
- Immediate notification on payment failure
- 7-day grace period
- Instructions to update payment method
- Warning about downgrade to free plan

**Subscription Status Changes:**
- Subscription paused
- Subscription resumed
- Subscription cancelled
- Plan upgraded/downgraded

**Overage Notifications:**
- Usage limit exceeded
- Overage charges breakdown
- Suggestion to upgrade plan

### 8. Scheduled Tasks

Automated cron jobs for:

**Daily Tasks:**
- `9:00 AM` - Send payment reminders (3 days before billing)
- `10:00 AM` - Send trial ending notifications
- `11:00 PM` - Check and record usage overages
- `12:00 AM` - Handle expired subscriptions (7+ days past due)

**Monthly Tasks:**
- `1st of month, 12:00 AM` - Reset monthly usage counters

### 9. Enhanced Subscription Creation

Improved subscription creation with:

- **Billing Cycle Selection**: Monthly or yearly
- **Coupon Application**: Apply discount codes during signup
- **Trial Duration**: Customizable trial periods
- **Automatic Customer Creation**: Stripe customer created if not exists
- **Payment Method Linking**: Payment method automatically saved
- **Metadata Tracking**: User ID and plan name stored in Stripe

**Example Request:**
```json
{
  "planName": "pro",
  "paymentMethodId": "pm_1234567890",
  "billingCycle": "yearly",
  "couponCode": "WELCOME20",
  "trialDays": 14
}
```

### 10. Invoice Management

Complete invoice handling:

- **Invoice History**: View all past invoices
- **PDF Downloads**: Download invoice PDFs
- **Upcoming Invoice**: Preview next invoice
- **Line Item Breakdown**: Detailed charge information
- **Payment Status**: Track payment status
- **Invoice URLs**: Hosted invoice pages

---

## Database Models

### User Model Enhancements

```javascript
subscription: {
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripePriceId: String,
  status: String, // active, inactive, cancelled, past_due, trialing, paused
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  trialEnd: Date,
  trialStart: Date,
  pausedAt: Date,
  resumeAt: Date,
  billingCycle: String, // monthly, yearly
  discountCode: String,
  discountPercentage: Number
}

usage: {
  urlsCreatedThisMonth: Number,
  urlsCreatedTotal: Number,
  customDomainsCount: Number,
  apiCallsThisMonth: Number,
  lastResetDate: Date,
  overageCharges: Number
}

preferences: {
  emailNotifications: {
    paymentReminders: Boolean,
    usageAlerts: Boolean,
    newsletter: Boolean
  }
}
```

### New Models

**Coupon Model:**
- Code, description, discount type/value
- Valid date range, usage limits
- Plan restrictions, metadata
- Used by tracking

**PaymentMethod Model:**
- User reference, Stripe payment method ID
- Card details (brand, last4, expiration)
- Billing details
- Default flag, active status

---

## API Endpoints

### Subscription Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subscriptions/create` | Create new subscription |
| POST | `/api/subscriptions/cancel` | Cancel subscription |
| POST | `/api/subscriptions/update` | Update subscription plan |
| GET | `/api/subscriptions/status` | Get subscription status |
| POST | `/api/subscriptions/pause` | Pause subscription |
| POST | `/api/subscriptions/resume` | Resume subscription |

### Payment Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subscriptions/setup-intent` | Create setup intent |
| POST | `/api/subscriptions/payment-methods` | Add payment method |
| GET | `/api/subscriptions/payment-methods` | List payment methods |
| DELETE | `/api/subscriptions/payment-methods/:id` | Remove payment method |
| PUT | `/api/subscriptions/payment-methods/:id/default` | Set default |

### Billing & Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/billing` | Get detailed billing info |
| GET | `/api/subscriptions/payment-history` | Get invoice history |
| GET | `/api/subscriptions/invoices/:id/download` | Download invoice |

### Coupons

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subscriptions/validate-coupon` | Validate coupon code |
| POST | `/api/subscriptions/apply-coupon` | Apply coupon to subscription |

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/plans` | Get all available plans (public) |

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install node-cron
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your_password
```

### 3. Initialize Coupons

```bash
node scripts/init-coupons.js
```

### 4. Configure Stripe Webhooks

Set up webhooks in Stripe Dashboard for:
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Webhook URL: `https://yourdomain.com/api/subscriptions/webhook`

### 5. Create Stripe Products and Prices

In Stripe Dashboard, create products for:
- Free Plan (no price needed)
- Pro Plan - Monthly and Yearly prices
- Enterprise Plan - Monthly and Yearly prices

Update Plan model with Stripe Price IDs.

---

## Frontend Integration

### Billing Portal Component

Located at: `frontend/src/components/Billing/BillingPortal.tsx`

**Features:**
- Tabbed interface (Overview, Payment Methods, Invoices, Usage)
- Subscription management actions
- Payment method CRUD operations
- Invoice downloads
- Coupon code application
- Usage tracking visualization

**Usage:**
```tsx
import BillingPortal from './components/Billing/BillingPortal';

function App() {
  return <BillingPortal />;
}
```

### Route Configuration

Add to your router:
```tsx
<Route path="/billing" element={<BillingPortal />} />
```

---

## Testing

### Test Payment Methods

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

### Test Coupons

Available test coupons:
- `WELCOME20` - 20% off
- `SAVE50` - $50 off
- `BLACKFRIDAY` - 50% off
- `ENTERPRISE30` - 30% off
- `YEARLY25` - 25% off

---

## Scheduled Tasks

The system runs automated tasks via cron jobs:

### Daily Tasks

**9:00 AM** - Payment Reminders
```javascript
// Finds users with billing in 3 days
// Sends payment reminder emails
```

**10:00 AM** - Trial Ending Notifications
```javascript
// Finds users with trials ending in 3 or 7 days
// Sends trial ending reminder emails
```

**11:00 PM** - Usage Overage Check
```javascript
// Checks all active subscriptions for usage overages
// Records overage charges
// Sends overage notification emails
```

**12:00 AM** - Expired Subscription Handling
```javascript
// Finds subscriptions past_due for 7+ days
// Downgrades to free plan
// Sends notification
```

### Monthly Tasks

**1st of Month, 12:00 AM** - Usage Reset
```javascript
// Resets monthly usage counters for all users
// Resets overage charges
```

---

## Security Considerations

1. **Webhook Verification**: All Stripe webhooks are verified using signature
2. **User Authorization**: All billing endpoints require authentication
3. **Payment Method Ownership**: Users can only manage their own payment methods
4. **Invoice Access**: Users can only access their own invoices
5. **Coupon Validation**: Server-side validation prevents coupon abuse

---

## Error Handling

All payment operations include comprehensive error handling:

- **Payment Failed**: 7-day grace period before downgrade
- **Coupon Invalid**: Clear error messages with validation
- **Webhook Errors**: Logged for debugging, don't block processing
- **Network Errors**: Retry logic for Stripe API calls
- **Database Errors**: Transaction rollback where applicable

---

## Monitoring & Logging

All payment operations are logged:

```javascript
console.log('Payment reminder sent to:', user.email);
console.log('Subscription paused:', subscriptionId);
console.log('Coupon applied:', couponCode);
```

Monitor these logs for:
- Failed payments
- Webhook processing
- Scheduled task execution
- Error patterns

---

## Future Enhancements

Potential additions:

1. **Team Billing**: Centralized billing for organizations
2. **Usage Analytics**: Detailed usage breakdowns
3. **Custom Invoicing**: Manual invoice creation
4. **Payment Plans**: Installment payments
5. **Tax Calculation**: Automatic tax calculation based on location
6. **Multiple Currencies**: Support for various currencies
7. **Referral Credits**: Discount credits for referrals
8. **Annual Reporting**: Year-end usage reports

---

## Support

For issues or questions:
- Email: billing@laghhu.link
- Documentation: https://docs.laghhu.link/billing
- API Reference: https://docs.laghhu.link/api

---

## License

Same as main project license.
