import type { AirportPerformance, DateRange, NetworkPerformance, SlaDefinition } from '../api/types'
import fixtureJson from './api-data.json'

interface MockFixture {
  slas: SlaDefinition[]
  network: NetworkPerformance
  details: Record<string, AirportPerformance>
}

const fixture = fixtureJson as unknown as MockFixture

export function getMockSlas(): SlaDefinition[] {
  return structuredClone(fixture.slas)
}

export function getMockNetwork(range: DateRange): NetworkPerformance {
  return { ...structuredClone(fixture.network), ...range }
}

export function getMockAirport(airportCode: string, range: DateRange): AirportPerformance | null {
  const airport = fixture.details[airportCode]
  return airport ? { ...structuredClone(airport), ...range } : null
}
