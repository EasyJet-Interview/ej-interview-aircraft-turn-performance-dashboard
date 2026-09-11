import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getAirportPerformance, getNetworkPerformance, getSlas } from './client'

const response = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(body) } as Response)

describe('API client', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('retrieves SLA definitions from the configured API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(response([{ airportCode: 'LGW', targetTurnMinutes: 40 }]))

    await expect(getSlas()).resolves.toEqual([{ airportCode: 'LGW', targetTurnMinutes: 40 }])
    expect(fetchSpy).toHaveBeenCalledWith('/api/airports/slas')
  })

  it('includes the selected date range in the network performance request', async () => {
    const payload = { from: '2026-08-03', to: '2026-08-09', airports: [] }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(response(payload))

    await expect(getNetworkPerformance({ from: '2026-08-03', to: '2026-08-09' })).resolves.toEqual(payload)
    expect(fetchSpy).toHaveBeenCalledWith('/api/airports/performance?from=2026-08-03&to=2026-08-09')
  })

  it('encodes the airport and date range in an airport detail request', async () => {
    const payload = { airportCode: 'LGW', from: '2026-08-03', to: '2026-08-09', turns: [] }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(response(payload))

    await expect(getAirportPerformance('LGW', { from: '2026-08-03', to: '2026-08-09' })).resolves.toEqual(payload)
    expect(fetchSpy).toHaveBeenCalledWith('/api/airports/LGW/performance?from=2026-08-03&to=2026-08-09')
  })

  it('prefixes requests with the configured backend origin', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(response([]))

    await getSlas()

    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8080/api/airports/slas')
  })

  it('surfaces a useful error when an API request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(response({}, false, 500))

    await expect(getSlas()).rejects.toThrow('The API request failed')
  })

  it('reports the response status so callers can tell failures apart', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(response({}, false, 404))

    const failure = getAirportPerformance('XXX', { from: '2026-08-03', to: '2026-08-09' })

    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({ name: 'ApiError', status: 404 })
  })
})
