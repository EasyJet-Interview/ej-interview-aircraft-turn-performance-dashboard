import { useState } from 'react'
import { ApiError, getAirportPerformance, getNetworkPerformance, getSlas } from './api/client'
import type { AirportPerformance, DateRange, NetworkPerformance, SlaDefinition } from './api/types'
import { AirportDetail } from './components/AirportDetail'
import { AirportTable } from './components/AirportTable'
import { DateFilter } from './components/DateFilter'
import { Masthead } from './components/Masthead'
import { EmptyMessage, ErrorPanel, LoadingMessage } from './components/Message'
import { NetworkSummary } from './components/NetworkSummary'
import { AIRPORT_NAMES, DEFAULT_AIRPORT, INITIAL_RANGE } from './constants'
import { describeError } from './errors'
import { useRequest } from './hooks/useRequest'
import './App.css'

const rangeKey = (range: DateRange) => `${range.from}|${range.to}`

const App = () => {
  const [range, setRange] = useState(INITIAL_RANGE)
  const [selectedCode, setSelectedCode] = useState(DEFAULT_AIRPORT)

  const network = useRequest<[SlaDefinition[], NetworkPerformance]>(rangeKey(range), () =>
    Promise.all([getSlas(), getNetworkPerformance(range)]),
  )
  const detail = useRequest<AirportPerformance>(`${selectedCode}|${rangeKey(range)}`, () =>
    getAirportPerformance(selectedCode, range),
  )

  const [slas, performance] = network.data ?? [[], null]

  // A 404 on the detail means this airport has no data, not a missing endpoint.
  const detailMessage =
    detail.error instanceof ApiError && detail.error.status === 404
      ? {
          title: `No performance data for ${AIRPORT_NAMES[selectedCode] ?? selectedCode}`,
          detail: `The backend has no turns for ${selectedCode} between ${range.from} and ${range.to}.`,
        }
      : describeError(detail.error, 'We could not load airport detail')

  return (
    <div className="app-shell">
      <Masthead />

      <main>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Network operations</span>
            <h1>Aircraft turn performance</h1>
            <p>Compare airport performance, track SLA compliance and investigate the operations behind each turn.</p>
          </div>
          <DateFilter initialRange={INITIAL_RANGE} onApply={setRange} />
        </section>

        {network.loading ? (
          <LoadingMessage>Loading network performance…</LoadingMessage>
        ) : !performance ? (
          <ErrorPanel message={describeError(network.error, 'We could not load turn performance')} />
        ) : performance.airports.length === 0 ? (
          <EmptyMessage>No turns were found in this date range.</EmptyMessage>
        ) : (
          <>
            <NetworkSummary network={performance} />
            <AirportTable network={performance} selectedCode={selectedCode} onSelect={setSelectedCode} />

            <section className="section-block airport-detail" aria-live="polite">
              {detail.loading ? (
                <LoadingMessage>Loading airport detail…</LoadingMessage>
              ) : !detail.data ? (
                <ErrorPanel message={detailMessage} />
              ) : (
                <AirportDetail airport={detail.data} slas={slas} />
              )}
            </section>
          </>
        )}
      </main>
      <footer>Aircraft turn performance · Supplied frontend</footer>
    </div>
  )
}

export default App
