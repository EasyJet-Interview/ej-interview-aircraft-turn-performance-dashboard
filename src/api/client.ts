import type { AirportPerformance, DateRange, NetworkPerformance, SlaDefinition } from './types'
export type { DateRange } from './types'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`)
  if (!response.ok) {
    throw new Error(`The API request failed with status ${response.status}`)
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
