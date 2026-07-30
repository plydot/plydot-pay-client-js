import type { AccessTokenResponse } from '../models/auth.js'
import { normalizeBaseUrl } from '../internal/query.js'

export interface ObtainAccessTokenOptions {
  baseUrl?: string
  username: string
  password: string
  readTimeoutMs?: number
  fetchImpl?: typeof fetch
}

/**
 * Obtain a Keycloak JWT for merchant admin settlement operations.
 * Uses POST /v1/auth/token with HTTP Basic credentials.
 */
export async function obtainAccessToken(
  options: ObtainAccessTokenOptions,
): Promise<AccessTokenResponse> {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? PlydotPayAuth.DEFAULT_BASE_URL)
  const readTimeoutMs = options.readTimeoutMs ?? 30_000
  const fetchImpl = options.fetchImpl ?? fetch
  const basic = Buffer.from(`${options.username}:${options.password}`).toString('base64')

  const response = await fetchImpl(`${baseUrl}/v1/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(readTimeoutMs),
  })

  const body = await response.text()
  if (response.status < 200 || response.status > 299) {
    throw new Error(`Failed to obtain access token (HTTP ${response.status}): ${body}`)
  }

  return JSON.parse(body) as AccessTokenResponse
}

export const PlydotPayAuth = {
  DEFAULT_BASE_URL: 'https://pay.plydot.dev',
  obtainAccessToken,
}
