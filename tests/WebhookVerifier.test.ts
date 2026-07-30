import { describe, expect, it } from 'vitest'
import { parseWebhookEvent, WebhookVerifier } from '../src/webhook/WebhookVerifier.js'

describe('WebhookVerifier', () => {
  it('verify valid signature', () => {
    const secret = 'whsec_test_secret'
    const body = JSON.stringify({
      event: 'payment.succeeded',
      createdAt: '2026-07-21T09:00:00Z',
      data: { paymentId: '11111111-1111-1111-1111-111111111111' },
    })

    const signature = WebhookVerifier.sign(secret, body)
    expect(WebhookVerifier.verify(secret, body, signature)).toBe(true)
  })

  it('reject invalid signature', () => {
    const body = JSON.stringify({ event: 'payment.succeeded' })
    expect(WebhookVerifier.verify('whsec_test', body, 'deadbeef')).toBe(false)
  })

  it('parse webhook event envelope', () => {
    const json = JSON.stringify({
      event: 'payment.succeeded',
      createdAt: '2026-07-21T09:00:00Z',
      data: {
        paymentId: '11111111-1111-1111-1111-111111111111',
        amountMinor: 50000,
        currency: 'UGX',
      },
    })

    const event = parseWebhookEvent(json)
    expect(event.event).toBe('payment.succeeded')
    expect(event.createdAt).toBe('2026-07-21T09:00:00Z')
    expect(event.data.paymentId).toBe('11111111-1111-1111-1111-111111111111')
    expect(event.data.amountMinor).toBe(50000)

    const reparsed = parseWebhookEvent(JSON.stringify(event))
    expect(reparsed.event).toBe(event.event)
  })
})
