import { getApiBaseUrl } from '../config'
import type { AirportPerformance, DateRange, NetworkPerformance, SlaDefinition } from './types'
export type { DateRange } from './types'

/**
 * A non-2xx API response. Carries the status so callers can tell a rejected
 * date range (400) or a missing airport (404) apart from a server fault (5xx)
 * and report something more actionable than "the request failed".
 */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`The API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`)
  if (!response.ok) {
    throw new ApiError(response.status)
  }
  return response.json() as Promise<T>
}

function dateQuery(range: DateRange): string {
  return new URLSearchParams({ from: range.from, to: range.to }).toString()
}

export function getSlas(): Promise<SlaDefinition[]> {
  return request('/api/airports/slas')
}

export function getNetworkPerformance(range: DateRange): Promise<NetworkPerformance> {
  return request(`/api/airports/performance?${dateQuery(range)}`)
}

export function getAirportPerformance(airportCode: string, range: DateRange): Promise<AirportPerformance> {
  return request(`/api/airports/${encodeURIComponent(airportCode)}/performance?${dateQuery(range)}`)
}
