import type { ErrorResponse } from '../models/error.js'

export class PlydotPayError extends Error {
  readonly error: ErrorResponse
  readonly httpStatus: number

  constructor(error: ErrorResponse, httpStatus: number) {
    super(`${error.code}: ${error.message}`)
    this.name = 'PlydotPayError'
    this.error = error
    this.httpStatus = httpStatus
  }

  get code(): string {
    return this.error.code
  }

  isCheckoutExpired(): boolean {
    return this.code === 'CHECKOUT_EXPIRED'
  }

  isCheckoutNotPayable(): boolean {
    return this.code === 'CHECKOUT_NOT_PAYABLE'
  }

  isPaymentInProgress(): boolean {
    return this.code === 'PAYMENT_IN_PROGRESS'
  }

  isIdempotencyConflict(): boolean {
    return this.code === 'IDEMPOTENCY_KEY_IN_PROGRESS' || this.code === 'IDEMPOTENCY_KEY_REUSED'
  }

  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR'
  }

  isUnauthorized(): boolean {
    return this.code === 'UNAUTHORIZED'
  }

  isForbidden(): boolean {
    return this.code === 'FORBIDDEN'
  }

  isNotFound(): boolean {
    return this.code.endsWith('_NOT_FOUND') || this.code === 'NOT_FOUND'
  }

  isMerchantContextRequired(): boolean {
    return this.code === 'MERCHANT_CONTEXT_REQUIRED'
  }

  isInsufficientBalance(): boolean {
    return this.code === 'INSUFFICIENT_BALANCE'
  }

  isPayoutAlreadyOpen(): boolean {
    return this.code === 'PAYOUT_ALREADY_OPEN'
  }

  isPayoutAccountNotConfigured(): boolean {
    return this.code === 'PAYOUT_ACCOUNT_NOT_FOUND'
  }
}
