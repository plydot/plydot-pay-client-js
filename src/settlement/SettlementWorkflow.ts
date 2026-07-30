import type { PlydotPayClient } from '../client/PlydotPayClient.js'
import type { SettlementPayoutStatus } from '../models/enums.js'
import type { SettlementBalanceResponse } from '../models/settlement.js'
import type { SettlementPayoutResponse, SubmitPayoutRequest } from '../models/settlement.js'
import type { PayoutAccountResponse } from '../models/settlement.js'

export const TERMINAL_VERIFY_STATUSES: ReadonlySet<SettlementPayoutStatus> = new Set([
  'VERIFIED',
  'VERIFICATION_FAILED',
])

/**
 * Merchant settlement payout flow: balance → submit → poll until verified.
 * Requires merchant admin JWT for submit; reads use the API key on the client.
 */
export class SettlementWorkflow {
  constructor(
    private readonly client: PlydotPayClient,
    private readonly merchantAccessToken: string,
    private readonly merchantId: string,
  ) {}

  getBalance(): Promise<SettlementBalanceResponse> {
    return this.client.getSettlementBalance()
  }

  getPayoutAccount(): Promise<PayoutAccountResponse> {
    return this.client.getPayoutAccount(this.merchantId)
  }

  submitPayout(request: SubmitPayoutRequest = {}): Promise<SettlementPayoutResponse> {
    return this.client.submitPayoutRequest(request, this.merchantAccessToken)
  }

  submitFullBalance(): Promise<SettlementPayoutResponse> {
    return this.submitPayout({})
  }

  getPayout(payoutId: string): Promise<SettlementPayoutResponse> {
    return this.client.getPayoutRequest(payoutId)
  }

  listPayouts(
    status?: SettlementPayoutStatus,
    page = 0,
    size = 50,
  ): Promise<SettlementPayoutResponse[]> {
    return this.client.listPayoutRequests({ status, page, size })
  }

  waitForPayout(
    payoutId: string,
    options: {
      timeoutMs?: number
      pollIntervalMs?: number
      targetStatuses?: ReadonlySet<SettlementPayoutStatus>
    } = {},
  ): Promise<SettlementPayoutResponse> {
    return this.client.waitForPayoutRequest(payoutId, {
      timeoutMs: options.timeoutMs,
      pollIntervalMs: options.pollIntervalMs,
      targetStatuses: options.targetStatuses,
    })
  }
}
