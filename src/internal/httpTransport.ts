import { PlydotPayError } from '../errors/PlydotPayError.js'
import type { ErrorResponse } from '../models/error.js'
import { normalizeBaseUrl } from './query.js'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH'

export interface HttpTransportConfig {
  baseUrl: string
  apiKey: string
  defaultAccessToken?: string
  readTimeoutMs: number
  fetchImpl?: typeof fetch
}

export interface ExchangeOptions {
  idempotencyKey?: string
  bearerToken?: string
}

export class HttpTransport {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly defaultAccessToken?: string
  private readonly readTimeoutMs: number
  private readonly fetchImpl: typeof fetch

  constructor(config: HttpTransportConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl)
    this.apiKey = config.apiKey
    this.defaultAccessToken = config.defaultAccessToken
    this.readTimeoutMs = config.readTimeoutMs
    this.fetchImpl = config.fetchImpl ?? fetch
  }

  async exchange<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options: ExchangeOptions = {},
  ): Promise<T> {
    const response = await this.rawExchange(method, path, body, options)
    if (response.status >= 200 && response.status <= 299) {
      if (!response.body.trim()) {
        throw new Error(`Expected response body for ${method} ${path}`)
      }
      return JSON.parse(response.body) as T
    }
    throw this.toError(response)
  }

  async exchangeList<T>(
    method: HttpMethod,
    path: string,
    options: ExchangeOptions = {},
  ): Promise<T[]> {
    const response = await this.rawExchange(method, path, undefined, options)
    if (response.status >= 200 && response.status <= 299) {
      return JSON.parse(response.body) as T[]
    }
    throw this.toError(response)
  }

  private resolveBearerToken(override?: string): string {
    const token = override?.trim() || this.defaultAccessToken?.trim() || this.apiKey
    return token
  }

  private async rawExchange(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options: ExchangeOptions = {},
  ): Promise<{ status: number; body: string }> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.resolveBearerToken(options.bearerToken)}`,
      Accept: 'application/json',
    }

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey
    }

    const init: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.readTimeoutMs),
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body ?? {})
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init)
    const text = await response.text()
    return { status: response.status, body: text }
  }

  private toError(response: { status: number; body: string }): PlydotPayError {
    let error: ErrorResponse
    try {
      error = JSON.parse(response.body) as ErrorResponse
    } catch {
      error = {
        code: `HTTP_${response.status}`,
        message: response.body.trim() || `Request failed with HTTP ${response.status}`,
      }
    }
    return new PlydotPayError(error, response.status)
  }
}
