export interface MockResponse {
  status: number
  body: string
  headers?: Record<string, string>
}

export interface CapturedRequest {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
}

export function createMockFetch(responses: MockResponse[]) {
  const requests: CapturedRequest[] = []
  let index = 0

  const mockFetch: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url
    const method = init?.method ?? 'GET'
    const headers: Record<string, string> = {}
    if (init?.headers) {
      const raw = init.headers
      if (raw instanceof Headers) {
        raw.forEach((value, key) => {
          headers[key] = value
        })
      } else if (Array.isArray(raw)) {
        for (const [key, value] of raw) {
          headers[key] = value
        }
      } else {
        Object.assign(headers, raw)
      }
    }

    requests.push({
      url,
      method,
      headers,
      body: typeof init?.body === 'string' ? init.body : undefined,
    })

    const mock = responses[index++]
    if (!mock) {
      throw new Error(`No mock response configured for request #${index}`)
    }

    return new Response(mock.body, {
      status: mock.status,
      headers: mock.headers ?? { 'Content-Type': 'application/json' },
    })
  }

  return {
    mockFetch,
    requests,
    takeRequest(): CapturedRequest {
      const request = requests.shift()
      if (!request) {
        throw new Error('No captured request available')
      }
      return request
    },
  }
}
