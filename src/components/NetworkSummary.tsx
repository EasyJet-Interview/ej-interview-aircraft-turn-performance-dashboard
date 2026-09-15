import { useMemo } from 'react'
import type { NetworkPerformance } from '../api/types'
import { AIRPORT_NAMES } from '../constants'
import { minutes, percentage } from '../format'
import { Metric } from './Metric'

/** Network figures are weighted by turn count, not averaged across airports. */
const summarise = (network: NetworkPerformance) => {
  const { airports } = network
  const turnCount = airports.reduce((sum, item) => sum + item.turnCount, 0)
  const met = airports.reduce((sum, item) => sum + item.turnsMeetingSla, 0)
  const weightedMinutes = airports.reduce((sum, item) => sum + item.averageTurnMinutes * item.turnCount, 0)
  const ranked = [...airports].sort((a, b) => b.slaCompliancePercentage - a.slaCompliancePercentage)

  return {
    turnCount,
    compliance: turnCount ? (met / turnCount) * 100 : 0,
    average: turnCount ? weightedMinutes / turnCount : 0,
    strongest: ranked[0],
    weakest: ranked.at(-1),
  }
}

const airportDetail = (airport: { airportCode: string; slaCompliancePercentage: number } | undefined) =>
  airport ? `${AIRPORT_NAMES[airport.airportCode]} · ${percentage(airport.slaCompliancePercentage)}` : 'No performance data'

export const NetworkSummary = ({ network }: { network: NetworkPerformance }) => {
  const totals = useMemo(() => summarise(network), [network])

  return (
    <section className="metrics-grid" aria-label="Network summary">
      <Metric label="SLA compliance" value={percentage(totals.compliance)} detail={`${totals.turnCount} turns assessed`} />
      <Metric label="Average turn" value={`${minutes(totals.average)} min`} detail="Across all airports" />
      <Metric label="Strongest airport" value={totals.strongest.airportCode} detail={airportDetail(totals.strongest)} />
      <Metric label="Needs attention" value={totals.weakest?.airportCode ?? '—'} detail={airportDetail(totals.weakest)} />
    </section>
  )
}
