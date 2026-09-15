import type { AirportSummary } from '../api/types'
import { AIRPORT_NAMES } from '../constants'

const WIDTH = 120
const BASELINE = 40
const PLOT_HEIGHT = 36

export const Sparkline = ({ airport }: { airport: AirportSummary }) => {
  const values = airport.dailyPerformance.map((point) => point.slaCompliancePercentage)
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * WIDTH
      return `${x},${BASELINE - (value / 100) * PLOT_HEIGHT}`
    })
    .join(' ')

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${WIDTH} 44`}
      role="img"
      aria-label={`${AIRPORT_NAMES[airport.airportCode]} SLA compliance trend`}
    >
      <line x1="0" x2={WIDTH} y1={BASELINE} y2={BASELINE} />
      <polyline points={points} />
    </svg>
  )
}
