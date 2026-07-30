import { describe, expect, it } from 'vitest'
import {
  ThirdPartyCheckoutRequest,
  validateCustomer,
} from '../src/thirdparty/ThirdPartyCheckoutRequest.js'

const providerId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const payerId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

describe('ThirdPartyCheckoutRequest', () => {
  it('builds checkout request with metadata', () => {
    const request = ThirdPartyCheckoutRequest.builder()
      .productId('sku-1')
      .amountMinor(500)
      .currency('UGX')
      .providerId(providerId)
      .payerId(payerId)
      .customer({ name: 'Jane Okello', phone: '256700000099' })
      .build()

    const checkout = request.toCreateCheckoutRequest()
    expect(checkout.productId).toBe('sku-1')
    expect(checkout.amountMinor).toBe(500)
    expect(checkout.currency).toBe('UGX')
    expect(checkout.providerId).toBe(providerId)
    expect(checkout.payerId).toBe(payerId)
    expect(checkout.metadata?.customerName).toBe('Jane Okello')
    expect(checkout.metadata?.customerPhone).toBe('256700000099')
  })

  it('requires customer name before HTTP', () => {
    expect(() => validateCustomer({ name: '  ' })).toThrow('customer name is required')
  })

  it('requires customer contact before HTTP', () => {
    expect(() => validateCustomer({ name: 'Jane Okello' })).toThrow(
      'customer phone and/or email is required',
    )
  })

  it('requires product id', () => {
    expect(() =>
      ThirdPartyCheckoutRequest.builder()
        .amountMinor(500)
        .currency('UGX')
        .providerId(providerId)
        .payerId(payerId)
        .customer({ name: 'Jane Okello', email: 'jane@example.com' })
        .build(),
    ).toThrow('productId is required')
  })
})
