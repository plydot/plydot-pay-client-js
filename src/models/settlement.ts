import type { PayoutAccountType, SettlementPayoutStatus } from './enums.js'

export interface SettlementBalanceResponse {
  availableMinor: number
  reservedMinor: number
  currency: string
  unsettledPaymentCount: number
}

export interface PayoutAccountResponse {
  merchantId: string
  accountType: PayoutAccountType
  accountName: string
  accountNumber: string
  bankName?: string | null
  bankCode?: string | null
  currency: string
  active: boolean
  updatedAt: string
}

/** Omit amountMinor to request the full available balance. */
export interface SubmitPayoutRequest {
  amountMinor?: number
}

export interface SettlementPayoutItemResponse {
  id: string
  paymentId: string
  amountMinor: number
  providerReference?: string | null
  verifiedAt?: string | null
  verificationError?: string | null
}

export interface SettlementPayoutResponse {
  id: string
  merchantId: string
  amountMinor: number
  currency: string
  status: SettlementPayoutStatus
  requestedBy: string
  destinationSnapshot?: Record<string, unknown>
  platformNote?: string | null
  failureReason?: string | null
  verifiedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  items?: SettlementPayoutItemResponse[]
}
