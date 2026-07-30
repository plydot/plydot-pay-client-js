import { createHmac, timingSafeEqual } from 'node:crypto'

export interface WebhookEvent {
  event: string
  createdAt: string
  data: Record<string, unknown>
}

export function parseWebhookEvent(json: string): WebhookEvent {
  return JSON.parse(json) as WebhookEvent
}

const SIGNATURE_HEADER = 'X-Plydot-Signature'

/**
 * HMAC-SHA256 webhook verification (server-side).
 * Verify against the raw request body before JSON.parse.
 */
export const WebhookVerifier = {
  signatureHeaderName(): string {
    return SIGNATURE_HEADER
  },

  sign(secret: string, payload: string): string {
    return createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
  },

  verify(secret: string, rawBody: string, signatureHeader?: string | null): boolean {
    if (!signatureHeader?.trim()) {
      return false
    }
    const expected = this.sign(secret, rawBody)
    const actual = signatureHeader.trim()
    if (expected.length !== actual.length) {
      return false
    }
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(actual, 'utf8'))
  },
}
