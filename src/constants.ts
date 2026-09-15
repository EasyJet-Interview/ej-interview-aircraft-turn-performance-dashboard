import type { DateRange } from './api/types'
import type { TurnOperation } from './api/types'

export const AIRPORT_NAMES: Record<string, string> = {
  LGW: 'London Gatwick',
  LTN: 'London Luton',
  MAN: 'Manchester',
  BRS: 'Bristol',
  AMS: 'Amsterdam Schiphol',
}

export const OPERATION_NAMES: Record<TurnOperation['eventType'], string> = {
  aircraftUnloading: 'Unloading',
  aircraftCleaning: 'Cleaning',
  aircraftLoading: 'Loading',
  departurePreparation: 'Departure prep',
}

export const INITIAL_RANGE: DateRange = { from: '2026-08-03', to: '2026-08-09' }

export const DEFAULT_AIRPORT = 'LGW'

/** SLA compliance at or above this reads as healthy in the airport table. */
export const HEALTHY_COMPLIANCE_PERCENTAGE = 80
