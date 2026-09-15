import type {
  AirportPerformance,
  AirportSummary,
  DailyPerformance,
  DateRange,
  NetworkPerformance,
  SlaDefinition,
} from '../api/types'
import fixtureJson from './api-data.json'

interface MockFixture {
  slas: SlaDefinition[]
  network: NetworkPerformance
  details: Record<string, AirportPerformance>
}

const fixture = fixtureJson as unknown as MockFixture

const withinRange = (localDate: string, range: DateRange) => localDate >= range.from && localDate <= range.to

/**
 * Recomputes an airport summary from the days that survived the range filter,
 * so demo mode responds to the date picker the way a real backend would.
 * Daily compliance is a percentage, so the count of turns meeting SLA is
 * recovered from it before the totals are re-derived.
 */
const summarise = (days: DailyPerformance[]) => {
  const turnCount = days.reduce((total, day) => total + day.turnCount, 0)
  const turnsMeetingSla = days.reduce(
    (total, day) => total + Math.round((day.turnCount * day.slaCompliancePercentage) / 100),
    0,
  )
  const weightedMinutes = days.reduce((total, day) => total + day.averageTurnMinutes * day.turnCount, 0)

  return {
    turnCount,
    turnsMeetingSla,
    turnsMissingSla: turnCount - turnsMeetingSla,
    averageTurnMinutes: turnCount ? weightedMinutes / turnCount : 0,
    slaCompliancePercentage: turnCount ? (turnsMeetingSla / turnCount) * 100 : 0,
  }
}

const clipToRange = <T extends AirportSummary>(airport: T, range: DateRange): T => {
  const dailyPerformance = airport.dailyPerformance.filter((day) => withinRange(day.date, range))
  return { ...airport, ...summarise(dailyPerformance), dailyPerformance }
}

export const getMockSlas = (): SlaDefinition[] => structuredClone(fixture.slas)

export const getMockNetwork = (range: DateRange): NetworkPerformance => {
  const network = structuredClone(fixture.network)

  return {
    ...network,
    ...range,
    airports: network.airports
      .map((airport) => clipToRange(airport, range))
      .filter((airport) => airport.turnCount > 0),
  }
}

export const getMockAirport = (airportCode: string, range: DateRange): AirportPerformance | null => {
  const airport = fixture.details[airportCode]
  if (!airport) return null

  const clipped = clipToRange(structuredClone(airport), range)

  return {
    ...clipped,
    ...range,
    turns: clipped.turns.filter((turn) => withinRange(turn.arrivalDateTime.slice(0, 10), range)),
  }
}
