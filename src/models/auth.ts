export interface AccessTokenResponse {
  access_token: string
  expires_in?: number
  token_type?: string
}

/** Normalized token for application use. */
export interface AccessToken {
  accessToken: string
  expiresIn?: number
  tokenType?: string
}

export function normalizeAccessToken(response: AccessTokenResponse): AccessToken {
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    tokenType: response.token_type,
  }
}
