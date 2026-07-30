import { obtainAccessToken, PlydotPayAuth } from '../auth/PlydotPayAuth.js'
import { HttpTransport } from '../internal/httpTransport.js'
import { buildQuery, normalizeBaseUrl, sleep } from '../internal/query.js'
import type { AccessTokenResponse } from '../models/auth.js'
import type {
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  PayCheckoutRequest,
  ProviderOptionResponse,
} from '../models/checkout.js'
import type { CheckoutStatus, PaymentStatus, SettlementPayoutStatus } from '../models/enums.js'
import type { PayCheckoutResponse, PaymentResponse } from '../models/payment.js'
import type {
  AssignProviderPayersRequest,
  CreatePayerRequest,
  PayerResponse,
  ProviderPayerAssignmentResponse,
  UpdatePayerRequest,
} from '../models/payer.js'
import type {
  PayoutAccountResponse,
  SettlementBalanceResponse,
  SettlementPayoutResponse,
  SubmitPayoutRequest,
} from '../models/settlement.js'
import { SettlementWorkflow, TERMINAL_VERIFY_STATUSES } from '../settlement/SettlementWorkflow.js'
import { ThirdPartyCheckoutRequest } from '../thirdparty/ThirdPartyCheckoutRequest.js'

export interface PlydotPayClientOptions {
  apiKey: string
  baseUrl?: string
  accessToken?: string
  readTimeoutMs?: number
  fetchImpl?: typeof fetch
}

export interface ListCheckoutsOptions {
  status?: CheckoutStatus
  accountRef?: string
  from?: string
  to?: string
  page?: number
  size?: number
}

export interface ListPaymentsOptions {
  status?: PaymentStatus
  checkoutId?: string
  from?: string
  to?: string
  page?: number
  size?: number
}

export interface ListPayoutRequestsOptions {
  merchantId?: string
  status?: SettlementPayoutStatus
  page?: number
  size?: number
}

export interface WaitForPayoutOptions {
  timeoutMs?: number
  pollIntervalMs?: number
  targetStatuses?: ReadonlySet<SettlementPayoutStatus>
}

export class PlydotPayClient {
  static readonly DEFAULT_BASE_URL = 'https://pay.plydot.dev'

  private readonly transport: HttpTransport

  private constructor(transport: HttpTransport) {
    this.transport = transport
  }

  static builder(): PlydotPayClientBuilder {
    return new PlydotPayClientBuilder()
  }

  /** @internal */
  static fromTransport(transport: HttpTransport): PlydotPayClient {
    return new PlydotPayClient(transport)
  }

  /** Exchange Keycloak username/password for a JWT via POST /v1/auth/token. */
  static obtainAccessToken(
    username: string,
    password: string,
    options: {
      baseUrl?: string
      readTimeoutMs?: number
      fetchImpl?: typeof fetch
    } = {},
  ): Promise<AccessTokenResponse> {
    return obtainAccessToken({
      baseUrl: options.baseUrl ?? PlydotPayAuth.DEFAULT_BASE_URL,
      username,
      password,
      readTimeoutMs: options.readTimeoutMs,
      fetchImpl: options.fetchImpl,
    })
  }

  createCheckout(
    request: CreateCheckoutRequest,
    idempotencyKey?: string,
  ): Promise<CreateCheckoutResponse> {
    return this.transport.exchange('POST', '/v1/checkouts', request, { idempotencyKey })
  }

  createThirdPartyCheckout(
    request: ThirdPartyCheckoutRequest,
    idempotencyKey?: string,
  ): Promise<CreateCheckoutResponse> {
    return this.createCheckout(request.toCreateCheckoutRequest(), idempotencyKey)
  }

  getCheckout(id: string): Promise<CreateCheckoutResponse> {
    return this.transport.exchange('GET', `/v1/checkouts/${id}`)
  }

  listCheckouts(options: ListCheckoutsOptions = {}): Promise<CreateCheckoutResponse[]> {
    const { status, accountRef, from, to, page = 0, size = 50 } = options
    return this.transport.exchangeList(
      'GET',
      `/v1/checkouts${buildQuery({
        status,
        accountRef,
        from,
        to,
        page: String(page),
        size: String(size),
      })}`,
    )
  }

  payCheckout(checkoutId: string, request: PayCheckoutRequest): Promise<PayCheckoutResponse> {
    return this.transport.exchange('POST', `/v1/checkouts/${checkoutId}/pay`, request)
  }

  cancelCheckout(checkoutId: string): Promise<CreateCheckoutResponse> {
    return this.transport.exchange('POST', `/v1/checkouts/${checkoutId}/cancel`)
  }

  getPayment(id: string): Promise<PaymentResponse> {
    return this.transport.exchange('GET', `/v1/payments/${id}`)
  }

  listPayments(options: ListPaymentsOptions = {}): Promise<PaymentResponse[]> {
    const { status, checkoutId, from, to, page = 0, size = 50 } = options
    return this.transport.exchangeList(
      'GET',
      `/v1/payments${buildQuery({
        status,
        checkoutId,
        from,
        to,
        page: String(page),
        size: String(size),
      })}`,
    )
  }

  listPayers(active?: boolean): Promise<PayerResponse[]> {
    return this.transport.exchangeList(
      'GET',
      `/v1/payers${buildQuery({ active: active == null ? undefined : String(active) })}`,
    )
  }

  getPayer(id: string): Promise<PayerResponse> {
    return this.transport.exchange('GET', `/v1/payers/${id}`)
  }

  createPayer(request: CreatePayerRequest): Promise<PayerResponse> {
    return this.transport.exchange('POST', '/v1/payers', request)
  }

  updatePayer(id: string, request: UpdatePayerRequest): Promise<PayerResponse> {
    return this.transport.exchange('PATCH', `/v1/payers/${id}`, request)
  }

  listProviderPayers(providerId: string): Promise<ProviderPayerAssignmentResponse> {
    return this.transport.exchange('GET', `/v1/providers/${providerId}/payers`)
  }

  assignProviderPayers(
    providerId: string,
    request: AssignProviderPayersRequest,
  ): Promise<ProviderPayerAssignmentResponse> {
    return this.transport.exchange('PUT', `/v1/providers/${providerId}/payers`, request)
  }

  listProviders(): Promise<ProviderOptionResponse[]> {
    return this.transport.exchangeList('GET', '/v1/providers')
  }

  failCheckoutForSwitch(
    checkoutId: string,
    reason = 'PROVIDER_SWITCH',
  ): Promise<CreateCheckoutResponse> {
    return this.transport.exchange('POST', `/v1/checkouts/${checkoutId}/fail-for-switch`, {
      reason,
    })
  }

  getSettlementBalance(merchantId?: string): Promise<SettlementBalanceResponse> {
    return this.transport.exchange(
      'GET',
      `/v1/settlements/balance${buildQuery({ merchantId })}`,
    )
  }

  getPayoutAccount(merchantId: string): Promise<PayoutAccountResponse> {
    return this.transport.exchange('GET', `/v1/merchants/${merchantId}/payout-account`)
  }

  submitPayoutRequest(
    request: SubmitPayoutRequest = {},
    merchantAccessToken?: string,
  ): Promise<SettlementPayoutResponse> {
    return this.transport.exchange('POST', '/v1/settlements/payout-requests', request, {
      bearerToken: merchantAccessToken,
    })
  }

  getPayoutRequest(id: string): Promise<SettlementPayoutResponse> {
    return this.transport.exchange('GET', `/v1/settlements/payout-requests/${id}`)
  }

  listPayoutRequests(options: ListPayoutRequestsOptions = {}): Promise<SettlementPayoutResponse[]> {
    const { merchantId, status, page = 0, size = 50 } = options
    return this.transport.exchangeList(
      'GET',
      `/v1/settlements/payout-requests${buildQuery({
        merchantId,
        status,
        page: String(page),
        size: String(size),
      })}`,
    )
  }

  async waitForPayoutRequest(
    payoutId: string,
    options: WaitForPayoutOptions = {},
  ): Promise<SettlementPayoutResponse> {
    const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000
    const pollIntervalMs = options.pollIntervalMs ?? 3_000
    const targetStatuses = options.targetStatuses ?? TERMINAL_VERIFY_STATUSES
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
      const payout = await this.getPayoutRequest(payoutId)
      if (targetStatuses.has(payout.status)) {
        return payout
      }
      await sleep(pollIntervalMs)
    }

    throw new Error(
      `Payout ${payoutId} did not reach [${[...targetStatuses].join(', ')}] within ${timeoutMs}ms`,
    )
  }

  settlementWorkflow(merchantAccessToken: string, merchantId: string): SettlementWorkflow {
    return new SettlementWorkflow(this, merchantAccessToken, merchantId)
  }
}

export class PlydotPayClientBuilder {
  private _apiKey?: string
  private _accessToken?: string
  private _baseUrl = PlydotPayClient.DEFAULT_BASE_URL
  private _readTimeoutMs = 30_000
  private _fetchImpl?: typeof fetch

  apiKey(value: string): this {
    this._apiKey = value
    return this
  }

  accessToken(value: string | undefined): this {
    this._accessToken = value
    return this
  }

  baseUrl(value: string): this {
    this._baseUrl = value
    return this
  }

  readTimeoutMs(value: number): this {
    this._readTimeoutMs = value
    return this
  }

  fetchImpl(value: typeof fetch): this {
    this._fetchImpl = value
    return this
  }

  build(): PlydotPayClient {
    const resolvedApiKey = this._apiKey?.trim()
    if (!resolvedApiKey) {
      throw new Error('apiKey is required')
    }

    return PlydotPayClient.fromTransport(
      new HttpTransport({
        baseUrl: normalizeBaseUrl(this._baseUrl),
        apiKey: resolvedApiKey,
        defaultAccessToken: this._accessToken,
        readTimeoutMs: this._readTimeoutMs,
        fetchImpl: this._fetchImpl,
      }),
    )
  }
}
