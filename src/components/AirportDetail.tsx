import type { AirportPerformance, SlaDefinition } from '../api/types'
import { AIRPORT_NAMES } from '../constants'
import { minutes, percentage } from '../format'
import { DailyBars } from './DailyBars'
import { Metric } from './Metric'
import { TurnCard } from './TurnCard'

interface AirportDetailProps {
  airport: AirportPerformance
  slas: SlaDefinition[]
}

export const AirportDetail = ({ airport, slas }: AirportDetailProps) => {
  const target = slas.find((sla) => sla.airportCode === airport.airportCode)?.targetTurnMinutes ?? '—'

  return (
    <>
      <div className="section-heading detail-heading">
        <div>
          <span className="eyebrow">Airport detail</span>
          <h2>{AIRPORT_NAMES[airport.airportCode]} <small>{airport.airportCode}</small></h2>
        </div>
        <div className="sla-chip">SLA target <strong>{target} min</strong></div>
      </div>

      <div className="detail-grid">
        <DailyBars days={airport.dailyPerformance} />
        <div className="airport-numbers">
          <Metric label="Turns" value={String(airport.turnCount)} detail={`${airport.turnsMissingSla} missed SLA`} />
          <Metric label="Average" value={`${minutes(airport.averageTurnMinutes)} min`} detail="Arrival to departure" />
          <Metric label="Compliance" value={percentage(airport.slaCompliancePercentage)} detail={`${airport.turnsMeetingSla} turns met SLA`} />
        </div>
      </div>

      <div className="turns-heading">
        <div><span className="eyebrow">Turn breakdown</span><h3>Recent turns</h3></div>
        <span>Durations in minutes</span>
      </div>
      <div className="turn-list">
        {airport.turns.map((turn) => (
          <TurnCard key={`${turn.flightNumber}-${turn.arrivalDateTime}`} turn={turn} />
        ))}
      </div>
    </>
  )
}
