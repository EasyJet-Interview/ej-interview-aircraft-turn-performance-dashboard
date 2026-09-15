import type { AirportPerformance, DateRange, NetworkPerformance, SlaDefinition } from '../api/types'
import fixtureJson from './api-data.json'

interface MockFixture {
  slas: SlaDefinition[]
  network: NetworkPerformance
  details: Record<string, AirportPerformance>
}

const fixture = fixtureJson as unknown as MockFixture

export const getMockSlas = (): SlaDefinition[] => structuredClone(fixture.slas)

export const getMockNetwork = (range: DateRange): NetworkPerformance => ({
  ...structuredClone(fixture.network),
  ...range,
})

export const getMockAirport = (airportCode: string, range: DateRange): AirportPerformance | null => {
  const airport = fixture.details[airportCode]
  return airport ? { ...structuredClone(airport), ...range } : null
}
