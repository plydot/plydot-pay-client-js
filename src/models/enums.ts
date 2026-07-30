export type CheckoutStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED'

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'STALE'

export type PayoutAccountType = 'BANK' | 'MOMO'

export type SettlementPayoutStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'VERIFICATION_FAILED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
