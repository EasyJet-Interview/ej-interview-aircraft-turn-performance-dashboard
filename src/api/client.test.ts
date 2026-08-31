import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAirportPerformance, getNetworkPerformance, getSlas } from './client'

const response = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response)

describe('API client', () => {
  afterEach(() => vi.restoreAllMocks())

  it('retrieves SLA definitions from the configured API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(response([{ airportCode: 'LGW', targetTurnMinutes: 40 }]))

    await expect(getSlas()).resolves.toEqual([{ airportCode: 'LGW', targetTurnMinutes: 40 }])
    expect(fetchSpy).toHaveBeenCalledWith('/api/airports/slas')
  })

  it('includes the selected date range in the network performance request', async () => {
    const payload = { from: '2026-07-21', to: '2026-07-27', airports: [] }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(response(payload))

    await expect(getNetworkPerformance({ from: '2026-07-21', to: '2026-07-27' })).resolves.toEqual(payload)
    expect(fetchSpy).toHaveBeenCalledWith('/api/airports/performance?from=2026-07-21&to=2026-07-27')
  })

  it('encodes the airport and date range in an airport detail request', async () => {
    const payload = { airportCode: 'LGW', from: '2026-07-21', to: '2026-07-27', turns: [] }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(response(payload))

    await expect(getAirportPerformance('LGW', { from: '2026-07-21', to: '2026-07-27' })).resolves.toEqual(payload)
    expect(fetchSpy).toHaveBeenCalledWith('/api/airports/LGW/performance?from=2026-07-21&to=2026-07-27')
  })

  it('surfaces a useful error when an API request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(response({}, false))

    await expect(getSlas()).rejects.toThrow('The API request failed')
  })
})
