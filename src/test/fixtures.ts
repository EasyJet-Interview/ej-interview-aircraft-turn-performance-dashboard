import type {
  AirportPerformance,
  AirportSummary,
  DailyPerformance,
  NetworkPerformance,
  TurnDetail,
} from '../api/types'

/**
 * Builders for component tests. Each takes overrides so a test states only the
 * fields it is actually asserting on.
 */

export const aDay = (overrides: Partial<DailyPerformance> = {}): DailyPerformance => ({
  date: '2026-08-03',
  turnCount: 4,
  averageTurnMinutes: 36,
  slaCompliancePercentage: 75,
  ...overrides,
})

export const anAirport = (overrides: Partial<AirportSummary> = {}): AirportSummary => ({
  airportCode: 'LGW',
  turnCount: 28,
  averageTurnMinutes: 35,
  turnsMeetingSla: 24,
  turnsMissingSla: 4,
  slaCompliancePercentage: 85.7,
  dailyPerformance: [aDay()],
  ...overrides,
})

export const aNetwork = (overrides: Partial<NetworkPerformance> = {}): NetworkPerformance => ({
  from: '2026-08-03',
  to: '2026-08-09',
  airports: [anAirport()],
  ...overrides,
})

export const aTurn = (overrides: Partial<TurnDetail> = {}): TurnDetail => ({
  flightNumber: 'EZY8101',
  arrivalDateTime: '2026-08-03T06:02:00',
  departureDateTime: '2026-08-03T06:36:00',
  totalTurnMinutes: 34,
  slaTargetMinutes: 40,
  metSla: true,
  operations: [
    { eventType: 'aircraftUnloading', startedAt: '2026-08-03T06:04:00', completedAt: '2026-08-03T06:10:00', durationMinutes: 6 },
    { eventType: 'aircraftCleaning', startedAt: '2026-08-03T06:11:00', completedAt: '2026-08-03T06:15:00', durationMinutes: 4 },
  ],
  ...overrides,
})

export const anAirportDetail = (overrides: Partial<AirportPerformance> = {}): AirportPerformance => ({
  ...anAirport(),
  from: '2026-08-03',
  to: '2026-08-09',
  turns: [aTurn()],
  ...overrides,
})
