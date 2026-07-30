import type { CheckoutStatus } from './enums.js'

export interface CreateCheckoutRequest {
  merchantId?: string
  productId?: string
  packageId?: string
  amountMinor?: number
  currency?: string
  accountRef?: string
  providerId: string
  payerId: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface CreateCheckoutResponse {
  id: string
  merchantId: string
  productId?: string | null
  catalogProductId?: string | null
  packageId?: string | null
  creditTierId?: string | null
  creditsToGrant?: number | null
  ugxPerCredit?: number | null
  accountRef?: string | null
  providerId?: string | null
  payerId?: string | null
  failureReason?: string | null
  amountMinor: number
  currency: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  status: CheckoutStatus
  expiresAt?: string | null
  createdAt: string
}

export interface PayCheckoutRequest {
  payerRef?: string
}

export interface ProviderOptionResponse {
  code: string
  displayName: string
  providerId: string
  providerName: string
  payers: PayerOptionResponse[]
}

export interface PayerOptionResponse {
  id: string
  code: string
  displayName: string
}
