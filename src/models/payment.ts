import type { PaymentStatus } from './enums.js'

export interface PaymentResponse {
  id: string
  checkoutId: string
  merchantId: string
  amountMinor: number
  currency: string
  status: PaymentStatus
  providerReference?: string | null
  refundedAmountMinor?: number
  instructions?: Record<string, unknown> | null
  createdAt: string
}

export interface PayCheckoutResponse {
  checkoutId: string
  payment: PaymentResponse
}
