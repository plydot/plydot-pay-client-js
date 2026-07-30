import { describe, expect, it } from 'vitest'
import { PlydotPayClient } from '../src/client/PlydotPayClient.js'
import { PlydotPayError } from '../src/errors/PlydotPayError.js'
import {
  ThirdPartyCheckoutRequest,
  type Customer,
} from '../src/thirdparty/ThirdPartyCheckoutRequest.js'
import { createMockFetch } from './helpers/mockFetch.js'

const checkoutId = '11111111-1111-1111-1111-111111111111'
const paymentId = '22222222-2222-2222-2222-222222222222'
const merchantId = '33333333-3333-3333-3333-333333333333'
const providerId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const payerId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

describe('PlydotPayClient', () => {
  it('create pay and get payment happy path', async () => {
    const { mockFetch } = createMockFetch([
      {
        status: 201,
        body: JSON.stringify({
          id: checkoutId,
          merchantId,
          productId: 'acme-sku',
          catalogProductId: null,
          packageId: null,
          creditTierId: null,
          creditsToGrant: null,
          ugxPerCredit: null,
          accountRef: 'acme-store',
          amountMinor: 50000,
          currency: 'UGX',
          description: 'Gold plan',
          metadata: {
            customerName: 'Jane Okello',
            customerPhone: '256700000099',
          },
          status: 'PENDING',
          expiresAt: '2026-07-21T10:00:00Z',
          createdAt: '2026-07-21T09:00:00Z',
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          checkoutId,
          payment: {
            id: paymentId,
            checkoutId,
            merchantId,
            amountMinor: 50000,
            currency: 'UGX',
            status: 'PENDING',
            providerReference: 'yo-ref-1',
            refundedAmountMinor: 0,
            instructions: { type: 'YOPAYMENTS' },
            createdAt: '2026-07-21T09:00:05Z',
          },
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          id: paymentId,
          checkoutId,
          merchantId,
          amountMinor: 50000,
          currency: 'UGX',
          status: 'SUCCEEDED',
          providerReference: 'yo-ref-1',
          refundedAmountMinor: 0,
          instructions: null,
          createdAt: '2026-07-21T09:00:05Z',
        }),
      },
    ])

    const client = PlydotPayClient.builder()
      .apiKey('pk_test_demo')
      .baseUrl('https://mock.test')
      .fetchImpl(mockFetch)
      .build()

    const checkout = await client.createThirdPartyCheckout(
      ThirdPartyCheckoutRequest.builder()
        .productId('acme-sku')
        .amountMinor(50_000)
        .currency('UGX')
        .providerId(providerId)
        .payerId(payerId)
        .customer({ name: 'Jane Okello', phone: '256700000099' })
        .description('Gold plan')
        .build(),
      'idem-1',
    )

    expect(checkout.id).toBe(checkoutId)
    expect(checkout.status).toBe('PENDING')

    const pay = await client.payCheckout(checkoutId, { payerRef: '256700000099' })
    expect(pay.payment.status).toBe('PENDING')

    const payment = await client.getPayment(paymentId)
    expect(payment.status).toBe('SUCCEEDED')
  })

  it('maps API error to PlydotPayError', async () => {
    const { mockFetch } = createMockFetch([
      {
        status: 409,
        body: JSON.stringify({
          code: 'CHECKOUT_EXPIRED',
          message: 'Checkout has expired',
          timestamp: '2026-07-21T09:00:00Z',
        }),
      },
    ])

    const client = PlydotPayClient.builder()
      .apiKey('pk_test_demo')
      .baseUrl('https://mock.test')
      .fetchImpl(mockFetch)
      .build()

    await expect(client.getCheckout('00000000-0000-0000-0000-000000000001')).rejects.toSatisfy(
      (error: unknown) => {
        expect(error).toBeInstanceOf(PlydotPayError)
        const ex = error as PlydotPayError
        expect(ex.code).toBe('CHECKOUT_EXPIRED')
        expect(ex.httpStatus).toBe(409)
        expect(ex.isCheckoutExpired()).toBe(true)
        return true
      },
    )
  })
})
