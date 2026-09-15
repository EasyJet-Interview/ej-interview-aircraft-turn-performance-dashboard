import type { NetworkPerformance } from '../api/types'
import { AIRPORT_NAMES, HEALTHY_COMPLIANCE_PERCENTAGE } from '../constants'
import { minutes, percentage, shortDate } from '../format'
import { Sparkline } from './Sparkline'

interface AirportTableProps {
  network: NetworkPerformance
  selectedCode: string
  onSelect: (airportCode: string) => void
}

export const AirportTable = ({ network, selectedCode, onSelect }: AirportTableProps) => (
  <section className="section-block">
    <div className="section-heading">
      <div>
        <span className="eyebrow">Airport comparison</span>
        <h2>Performance across the network</h2>
      </div>
      <span className="range-label">{shortDate(network.from)} – {shortDate(network.to)}</span>
    </div>
    <div className="airport-list">
      <div className="airport-row table-heading" aria-hidden="true">
        <span>Airport</span><span>Average turn</span><span>SLA met</span><span>Trend</span><span></span>
      </div>
      {network.airports.map((airport) => (
        <button
          className={`airport-row ${selectedCode === airport.airportCode ? 'selected' : ''}`}
          key={airport.airportCode}
          onClick={() => onSelect(airport.airportCode)}
          aria-label={`View ${AIRPORT_NAMES[airport.airportCode]} performance`}
        >
          <span className="airport-name"><b>{airport.airportCode}</b><small>{AIRPORT_NAMES[airport.airportCode]}</small></span>
          <span><b>{minutes(airport.averageTurnMinutes)}</b><small>minutes</small></span>
          <span className={airport.slaCompliancePercentage >= HEALTHY_COMPLIANCE_PERCENTAGE ? 'positive' : 'warning'}>
            <b>{percentage(airport.slaCompliancePercentage)}</b>
            <small>{airport.turnsMeetingSla} of {airport.turnCount} turns</small>
          </span>
          <Sparkline airport={airport} />
          <span className="row-arrow" aria-hidden="true">→</span>
        </button>
      ))}
    </div>
  </section>
)
