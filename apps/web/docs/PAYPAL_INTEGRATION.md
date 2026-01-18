# PayPal Subscription Integration - Implementation Plan

## Current Status
- ✅ Membership settings configured in admin panel
- ✅ PayPal account created and configured
- ✅ PayPal Plan IDs obtained (monthly and annual)
- ✅ Plan IDs saved in app settings
- ⏳ Pending: Frontend integration and webhooks

---

## Step 1: Create Pricing Page

### File: `apps/web/app/pricing/page.tsx`

Create a pricing page that displays:
- Free tier features (limited)
- Premium tier features (full access)
- Monthly and Annual pricing options
- PayPal subscription buttons

**Key features:**
- Fetch pricing from `/api/membership/limits` and settings
- Show comparison table (Free vs Premium)
- Highlight annual savings
- PayPal Subscribe buttons for each plan

---

## Step 2: Install PayPal SDK

```bash
npm install @paypal/react-paypal-js --workspace=apps/web
```

This provides:
- `PayPalScriptProvider` - wraps the app
- `PayPalButtons` - subscription buttons component

---

## Step 3: Create PayPal Provider Component

### File: `apps/web/components/PayPalProvider.tsx`

```tsx
'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';

export default function PayPalProvider({
  clientId,
  children
}: {
  clientId: string;
  children: React.ReactNode;
}) {
  return (
    <PayPalScriptProvider options={{
      clientId,
      vault: true,
      intent: 'subscription',
    }}>
      {children}
    </PayPalScriptProvider>
  );
}
```

---

## Step 4: Create Subscription Button Component

### File: `apps/web/components/PayPalSubscribeButton.tsx`

```tsx
'use client';

import { PayPalButtons } from '@paypal/react-paypal-js';

interface Props {
  planId: string;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: any) => void;
}

export default function PayPalSubscribeButton({ planId, onSuccess, onError }: Props) {
  return (
    <PayPalButtons
      style={{ layout: 'vertical', label: 'subscribe' }}
      createSubscription={(data, actions) => {
        return actions.subscription.create({
          plan_id: planId,
        });
      }}
      onApprove={async (data) => {
        // data.subscriptionID contains the PayPal subscription ID
        onSuccess(data.subscriptionID);
      }}
      onError={onError}
    />
  );
}
```

---

## Step 5: Create API to Activate Subscription

### File: `apps/web/app/api/subscription/activate/route.ts`

This endpoint is called after PayPal approves the subscription:

```ts
// POST /api/subscription/activate
// Body: { subscriptionId: string, planType: 'monthly' | 'annual' }

// 1. Verify the subscription with PayPal API
// 2. Update user profile:
//    - membership_type: 'premium'
//    - paypal_subscription_id: subscriptionId
//    - membership_expires_at: calculated based on plan
// 3. Return success
```

---

## Step 6: Create PayPal Webhook Handler

### File: `apps/web/app/api/webhooks/paypal/route.ts`

Handle PayPal webhook events:

| Event | Action |
|-------|--------|
| `BILLING.SUBSCRIPTION.ACTIVATED` | Set user to premium |
| `BILLING.SUBSCRIPTION.CANCELLED` | Mark for downgrade at period end |
| `BILLING.SUBSCRIPTION.EXPIRED` | Downgrade to free |
| `BILLING.SUBSCRIPTION.SUSPENDED` | Suspend premium access |
| `PAYMENT.SALE.COMPLETED` | Extend membership |

**Important:** Verify webhook signature using PayPal's verification endpoint.

---

## Step 7: Create Account Membership Section

### File: `apps/web/app/account/membership/page.tsx`

Show current membership status:
- Current plan (Free/Premium)
- Expiration date (if premium)
- Manage subscription button (links to PayPal)
- Upgrade button (if free)
- Cancel subscription option

---

## Step 8: Environment Variables

Add to `.env.local`:

```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
```

**Note:** Client ID is public (used in frontend), Secret is private (used in webhooks).

---

## Step 9: Configure PayPal Webhook URL

In PayPal Developer Dashboard:
1. Go to your app settings
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paypal`
3. Subscribe to events:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `PAYMENT.SALE.COMPLETED`

---

## File Structure Summary

```
apps/web/
├── app/
│   ├── pricing/
│   │   └── page.tsx                    # Pricing page with plans
│   ├── account/
│   │   └── membership/
│   │       └── page.tsx                # Manage subscription
│   └── api/
│       ├── subscription/
│       │   └── activate/
│       │       └── route.ts            # Activate after PayPal approval
│       └── webhooks/
│           └── paypal/
│               └── route.ts            # PayPal webhook handler
├── components/
│   ├── PayPalProvider.tsx              # PayPal SDK provider
│   └── PayPalSubscribeButton.tsx       # Subscribe button
└── lib/
    └── paypal.ts                       # PayPal API utilities
```

---

## Testing Flow

1. **Sandbox Testing:**
   - Use PayPal sandbox credentials
   - Create test buyer account in PayPal sandbox
   - Test subscription flow end-to-end

2. **Test Cases:**
   - [ ] New user subscribes monthly
   - [ ] New user subscribes annually
   - [ ] User cancels subscription
   - [ ] Subscription expires
   - [ ] Payment fails (test with sandbox)

3. **Go Live:**
   - Switch to production PayPal credentials
   - Update webhook URL to production domain
   - Test one real transaction

---

## Database Changes Needed

The `profiles` table already has the required columns:
- `membership_type` - will be set to 'premium'
- `membership_expires_at` - calculated expiration date
- `paypal_subscription_id` - PayPal's subscription ID

No migrations needed!

---

## Security Considerations

1. **Webhook Verification:** Always verify PayPal webhook signatures
2. **Subscription Verification:** Verify subscription status with PayPal API before activating
3. **HTTPS Only:** PayPal requires HTTPS for webhooks
4. **Rate Limiting:** Add rate limiting to subscription endpoints

---

## Estimated Implementation Time

| Task | Estimate |
|------|----------|
| Pricing page UI | 1-2 hours |
| PayPal SDK integration | 1 hour |
| Activation API | 1 hour |
| Webhook handler | 2 hours |
| Account membership page | 1 hour |
| Testing | 2 hours |
| **Total** | **8-10 hours** |

---

## Quick Start Tomorrow

1. Install PayPal SDK:
   ```bash
   npm install @paypal/react-paypal-js --workspace=apps/web
   ```

2. Add environment variables to `.env.local`

3. Start with the pricing page - it's the user-facing entry point

4. Then implement the activation API and webhooks

---

## Resources

- [PayPal Subscriptions Guide](https://developer.paypal.com/docs/subscriptions/)
- [PayPal React SDK](https://www.npmjs.com/package/@paypal/react-paypal-js)
- [Webhook Events Reference](https://developer.paypal.com/docs/api-basics/notifications/webhooks/event-names/)
- [Verify Webhook Signature](https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature)
