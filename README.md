# Plydot Pay Client (TypeScript)

Official **TypeScript/JavaScript SDK** for third-party merchants integrating with [Plydot Pay](https://pay.plydot.dev).

Collect Mobile Money payments (MTN MoMo, Airtel Money) from your backend, BFF, or Angular SSR route without building HTTP/auth/idempotency plumbing yourself.

| | |
|---|---|
| **npm package** | `@plydotsystemsltd/pay-client` |
| **Latest version** | `0.1.0` |
| **Node** | 18+ (native `fetch`) |
| **Frameworks** | Framework-agnostic — works in Node, Nest, Express, Angular SSR |

---

## Table of contents

1. [Before you start](#before-you-start)
2. [Install](#install)
3. [Quick start (TypeScript)](#quick-start-typescript)
4. [End-to-end integration flow](#end-to-end-integration-flow)
5. [Third-party checkout rules](#third-party-checkout-rules)
6. [API reference](#api-reference)
7. [Webhooks](#webhooks)
8. [Error handling](#error-handling)
9. [Configuration](#configuration)
10. [Further reading](#further-reading)

---

## Before you start

You need a **Plydot Pay merchant account** and an **API key** (`pk_test_…` or `pk_live_…`).

1. Plydot creates your merchant (`type: MERCHANT`) and issues an API key.
2. Register a **webhook endpoint** in Pay (admin UI or API) so you receive `payment.succeeded` / `payment.failed`.
3. Add this library to your **backend** — never expose API keys in the browser.

**Production API:** `https://pay.plydot.com/api`  
**Local Docker (dev):** `http://localhost:8088`

Playground: https://pay.plydot.com/api/playground/  
API reference (Scalar): https://pay.plydot.com/api/docs/

---

## Install

```bash
npm install @plydotsystemsltd/pay-client
```

---

## Quick start (TypeScript)

```typescript
import {
  PlydotPayClient,
  ThirdPartyCheckoutRequest,
} from '@plydotsystemsltd/pay-client'

// 1. Create client (reuse as a singleton in your app)
const pay = PlydotPayClient.builder()
  .apiKey(process.env.PLYDOT_PAY_API_KEY!)
  .baseUrl('https://pay.plydot.dev')
  .build()

// 2. Discover provider + payer (or use listProviders() in your UI)
const providers = await pay.listProviders()
const sandbox = providers.find((p) => p.code === 'SANDBOX')!
const mtnPayer = sandbox.payers.find((p) => p.code === 'MTN_MOMO')!

// 3. Create checkout — bind providerId + payerId; use your own product SKU
const checkout = await pay.createThirdPartyCheckout(
  ThirdPartyCheckoutRequest.builder()
    .productId('acme-gold-plan')
    .amountMinor(50_000)
    .currency('UGX')
    .providerId(sandbox.providerId)
    .payerId(mtnPayer.id)
    .customer({ name: 'Jane Okello', phone: '256700000099' })
    .description('Gold plan subscription')
    .build(),
  `order-${yourOrderId}`,
)

// 4. Collect payment — payerRef is the customer's MSISDN
const result = await pay.payCheckout(checkout.id, { payerRef: '256700000099' })
console.log(result.payment.status) // PENDING — final state via webhook
```

For **Angular**, call your own BFF from the browser; the BFF uses this SDK. See [docs/INTEGRATION.md](docs/INTEGRATION.md#angular--bff-integration).

---

## End-to-end integration flow

```text
Your app                         Plydot Pay                    MoMo network
   |                                 |                              |
   |-- listProviders() --------------->|
   |-- createThirdPartyCheckout() ---->|  (providerId + payerId)
   |<-- checkout (PENDING) ----------|
   |-- payCheckout(payerRef) -------->|---- collect request -------->|
   |<-- payment (PENDING) -----------|                              |
   |                                 |<---- customer approves ------|
   |<-- webhook payment.succeeded ---|                              |
   |   (or poll getPayment)          |                              |
   |-- fulfill order                 |                              |
```

**Recommended:** fulfill orders from the **webhook**, not polling alone. Use polling as a fallback or for UI status screens.

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for a full walkthrough including webhook handler examples and Angular BFF patterns.

---

## Third-party checkout rules

As a third-party integrator you **do not** use Pay's product catalog. You send your own SKU:

| Field | Required | Notes |
|-------|----------|-------|
| `productId` | Yes | Your SKU, e.g. `acme-gold-plan` |
| `amountMinor` | Yes | Amount in whole currency units (UGX shillings) |
| `currency` | Yes | e.g. `UGX` |
| `customer.name` | Yes | End customer name |
| `customer.phone` and/or `email` | Yes | At least one contact field |
| `providerId` | Yes | From `listProviders()` |
| `payerId` | Yes | Nested payer UUID under that provider |
| `accountRef` | No | **Ignored** — Pay sets this to your merchant code |

Use `ThirdPartyCheckoutRequest` — it validates customer fields **before** calling the API.

---

## API reference

### Client builder

```typescript
PlydotPayClient.builder()
  .apiKey('pk_test_…')                    // required
  .baseUrl('https://pay.plydot.dev')      // optional, this is the default
  .accessToken('jwt-…')                   // optional merchant admin JWT
  .readTimeoutMs(30_000)                  // optional
  .build()
```

### Methods

| Method | Description |
|--------|-------------|
| `createThirdPartyCheckout(request, idempotencyKey?)` | Create checkout with validated customer metadata |
| `createCheckout(request, idempotencyKey?)` | Low-level checkout create |
| `getCheckout(id)` | Get checkout by ID |
| `listCheckouts(options?)` | List checkouts for your merchant |
| `payCheckout(checkoutId, request)` | Start MoMo collection |
| `cancelCheckout(checkoutId)` | Cancel a pending checkout |
| `getPayment(id)` | Get payment status |
| `listPayments(options?)` | List payments |
| `listProviders()` | Discovery: providers with nested payers |
| `listPayers(active?)` | Flat payer catalog (`GET /v1/payers`) |
| `getPayer(id)` | Get one payer |
| `createPayer(request)` | Create payer (platform admin) |
| `updatePayer(id, request)` | Update payer (platform admin) |
| `listProviderPayers(providerId)` | Provider↔payer links |
| `assignProviderPayers(providerId, request)` | Replace provider↔payer links |
| `failCheckoutForSwitch(checkoutId, reason?)` | Fail checkout for provider switch |
| `getSettlementBalance(merchantId?)` | Available settlement balance |
| `getPayoutAccount(merchantId)` | Configured payout destination |
| `submitPayoutRequest(request?, merchantAccessToken?)` | Submit payout (merchant admin JWT) |
| `getPayoutRequest(id)` | Get payout by ID |
| `listPayoutRequests(options?)` | List payout requests |
| `waitForPayoutRequest(id, options?)` | Poll until verified/failed |
| `settlementWorkflow(token, merchantId)` | Convenience wrapper for settlement flow |
| `PlydotPayClient.obtainAccessToken(…)` | Exchange username/password for JWT |

### Settlement workflow

See [docs/INTEGRATION.md](docs/INTEGRATION.md#13-merchant-settlement-payouts) for balance → submit → poll examples and webhook events (`settlement.verified`, `settlement.paid`).

---

## Webhooks

Pay POSTs JSON to your registered URL when a payment completes.

**Header:** `X-Plydot-Signature` — HMAC-SHA256 hex of the raw body using your endpoint secret (`whsec_…`).

```typescript
import { parseWebhookEvent, WebhookVerifier } from '@plydotsystemsltd/pay-client'

function handleWebhook(rawBody: string, signature: string | undefined, secret: string) {
  if (!WebhookVerifier.verify(secret, rawBody, signature)) {
    throw new Error('Invalid webhook signature')
  }

  const event = parseWebhookEvent(rawBody)
  switch (event.event) {
    case 'payment.succeeded': {
      const paymentId = event.data.paymentId
      const productId = event.data.productId
      // fulfill order using productId + metadata
      break
    }
    case 'payment.failed':
      // notify customer
      break
  }
}
```

**Important:** Always verify the signature against the **raw request body** before parsing JSON. Webhook verification uses Node `crypto` — run it on a **server route**, not in the Angular browser bundle.

---

## Error handling

Failed API calls throw `PlydotPayError`:

```typescript
import { PlydotPayError } from '@plydotsystemsltd/pay-client'

try {
  await pay.getCheckout(checkoutId)
} catch (error) {
  if (error instanceof PlydotPayError) {
    console.log(`${error.code}: ${error.message}`)
    console.log(`HTTP ${error.httpStatus}`)

    if (error.isCheckoutExpired()) showExpiredMessage()
    else if (error.isCheckoutNotPayable()) showAlreadyPaidMessage()
    else if (error.isPaymentInProgress()) showInProgressMessage()
    else if (error.isIdempotencyConflict()) retryWithSameKeyOrNewKey()
    else if (error.isUnauthorized()) checkApiKey()
  }
}
```

Common error codes:

| Code | Meaning |
|------|---------|
| `UNAUTHORIZED` | Invalid or missing API key |
| `CHECKOUT_EXPIRED` | Checkout past `expiresAt` |
| `CHECKOUT_NOT_PAYABLE` | Checkout not in `PENDING` state |
| `PAYMENT_IN_PROGRESS` | Open payment already exists |
| `VALIDATION_ERROR` | Request validation failed |
| `IDEMPOTENCY_KEY_REUSED` | Same key used with different body |

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `baseUrl` | `https://pay.plydot.dev` | Pay API base URL |
| `accessToken` | — | Optional merchant admin JWT (settlement submit) |
| `readTimeoutMs` | 30000 | HTTP read timeout (`AbortSignal.timeout`) |

Authentication is `Authorization: Bearer {apiKey}` by default. Pass `merchantAccessToken` on `submitPayoutRequest` or set `accessToken` on the builder for JWT calls.

For idempotent checkout creation, pass a unique `idempotencyKey` per logical order (e.g. your order ID). Retries with the same key return the original response.

---

## Further reading

- [docs/INTEGRATION.md](docs/INTEGRATION.md) — full integration guide with Angular/BFF patterns
- [docs/PUBLISHING.md](docs/PUBLISHING.md) — npm releases (auto on `main`, secrets, manual publish)
- [Plydot Pay API docs](https://pay.plydot.com/api/docs/)
- [Playground](https://pay.plydot.com/api/playground/)
- [Kotlin/Java sibling SDK](https://github.com/plydot/plydot-pay-client)

---

## License

Apache License 2.0 — see [LICENSE](LICENSE).


<!-- Security scan triggered at 2026-08-31 16:42:59 -->

<!-- Security scan triggered at 2026-08-31 16:36:41 -->

<!-- Security scan triggered at 2026-08-31 18:08:02 -->