import { describe, expect, it } from 'vitest'
import { PlydotPayClient } from '../src/client/PlydotPayClient.js'
import { SettlementWorkflow } from '../src/settlement/SettlementWorkflow.js'
import { createMockFetch } from './helpers/mockFetch.js'

const merchantId = '33333333-3333-3333-3333-333333333333'
const payoutId = '44444444-4444-4444-4444-444444444444'

function payoutJson(status: string): string {
  return JSON.stringify({
    id: payoutId,
    merchantId,
    amountMinor: 50000,
    currency: 'UGX',
    status,
    requestedBy: 'merchant.admin',
    destinationSnapshot: {
      accountType: 'BANK',
      accountName: 'Wekume Ltd',
      accountNumber: '1234567890',
      currency: 'UGX',
    },
    platformNote: null,
    failureReason: null,
    verifiedAt: null,
    completedAt: null,
    createdAt: '2026-07-30T08:00:00Z',
    updatedAt: '2026-07-30T08:00:00Z',
    items: [],
  })
}

describe('SettlementClient', () => {
  it('settlement balance and submit payout', async () => {
    const { mockFetch, takeRequest } = createMockFetch([
      {
        status: 200,
        body: JSON.stringify({
          availableMinor: 50000,
          reservedMinor: 0,
          currency: 'UGX',
          unsettledPaymentCount: 2,
        }),
      },
      {
        status: 202,
        body: payoutJson('PENDING_VERIFICATION'),
      },
    ])

    const client = PlydotPayClient.builder()
      .apiKey('pk_live_demo')
      .baseUrl('https://mock.test')
      .fetchImpl(mockFetch)
      .build()

    const balance = await client.getSettlementBalance()
    expect(balance.availableMinor).toBe(50_000)
    expect(balance.unsettledPaymentCount).toBe(2)

    const payout = await client.submitPayoutRequest(
      { amountMinor: 50_000 },
      'jwt-merchant-admin',
    )
    expect(payout.id).toBe(payoutId)
    expect(payout.status).toBe('PENDING_VERIFICATION')

    const balanceRequest = takeRequest()
    expect(balanceRequest.headers.Authorization).toBe('Bearer pk_live_demo')

    const submitRequest = takeRequest()
    expect(submitRequest.method).toBe('POST')
    expect(submitRequest.headers.Authorization).toBe('Bearer jwt-merchant-admin')
    expect(submitRequest.body).toBe('{"amountMinor":50000}')
  })

  it('settlement workflow polls until verified', async () => {
    const { mockFetch, requests } = createMockFetch([
      { status: 200, body: payoutJson('VERIFYING') },
      { status: 200, body: payoutJson('VERIFIED') },
    ])

    const client = PlydotPayClient.builder()
      .apiKey('pk_live_demo')
      .baseUrl('https://mock.test')
      .fetchImpl(mockFetch)
      .build()

    const workflow = new SettlementWorkflow(client, 'jwt-merchant-admin', merchantId)
    const payout = await workflow.waitForPayout(payoutId, { pollIntervalMs: 1 })

    expect(payout.status).toBe('VERIFIED')
    expect(requests).toHaveLength(2)
  })

  it('get payout account', async () => {
    const { mockFetch } = createMockFetch([
      {
        status: 200,
        body: JSON.stringify({
          merchantId,
          accountType: 'BANK',
          accountName: 'Wekume Ltd',
          accountNumber: '1234567890',
          bankName: 'Stanbic Bank Uganda',
          bankCode: 'SBICUGKX',
          currency: 'UGX',
          active: true,
          updatedAt: '2026-07-30T08:00:00Z',
        }),
      },
    ])

    const client = PlydotPayClient.builder()
      .apiKey('pk_live_demo')
      .baseUrl('https://mock.test')
      .fetchImpl(mockFetch)
      .build()

    const account = await client.getPayoutAccount(merchantId)
    expect(account.accountType).toBe('BANK')
    expect(account.accountName).toBe('Wekume Ltd')
  })
})
