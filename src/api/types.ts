export interface SlaDefinition {
  airportCode: string
  targetTurnMinutes: number
}

export interface DateRange {
  from: string
  to: string
}

export interface DailyPerformance {
  date: string
  turnCount: number
  averageTurnMinutes: number
  slaCompliancePercentage: number
}

export interface AirportSummary {
  airportCode: string
  turnCount: number
  averageTurnMinutes: number
  turnsMeetingSla: number
  turnsMissingSla: number
  slaCompliancePercentage: number
  dailyPerformance: DailyPerformance[]
}

export interface NetworkPerformance {
  from: string
  to: string
  airports: AirportSummary[]
}

export interface TurnOperation {
  eventType: 'aircraftUnloading' | 'aircraftCleaning' | 'aircraftLoading' | 'departurePreparation'
  startedAt: string
  completedAt: string
  durationMinutes: number
}

export interface TurnDetail {
  flightNumber: string
  arrivalDateTime: string
  departureDateTime: string
  totalTurnMinutes: number
  slaTargetMinutes: number
  metSla: boolean
  operations: TurnOperation[]
}

export interface AirportPerformance extends AirportSummary {
  from: string
  to: string
  turns: TurnDetail[]
}
