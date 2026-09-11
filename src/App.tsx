import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ApiError, getAirportPerformance, getNetworkPerformance, getSlas, type DateRange } from './api/client'
import type { AirportPerformance, AirportSummary, NetworkPerformance, SlaDefinition, TurnOperation } from './api/types'
import { isMockApiEnabled } from './config'
import { minutes, percentage } from './format'
import './App.css'

const AIRPORT_NAMES: Record<string, string> = {
  LGW: 'London Gatwick',
  LTN: 'London Luton',
  MAN: 'Manchester',
  BRS: 'Bristol',
  AMS: 'Amsterdam Schiphol',
}

const OPERATION_NAMES: Record<TurnOperation['eventType'], string> = {
  aircraftUnloading: 'Unloading',
  aircraftCleaning: 'Cleaning',
  aircraftLoading: 'Loading',
  departurePreparation: 'Departure prep',
}

const INITIAL_RANGE: DateRange = { from: '2026-08-03', to: '2026-08-09' }

interface ErrorMessage {
  title: string
  detail: string
}

/** A settled request, tagged with the key of the inputs that produced it. */
interface NetworkResult {
  key: string
  slas: SlaDefinition[]
  network: NetworkPerformance | null
  error: unknown
}

interface DetailResult {
  key: string
  airport: AirportPerformance | null
  error: unknown
}

/**
 * Turns a failed request into something the user can act on. A rejected date
 * range, a missing endpoint and a server fault all need different responses,
 * so they should not collapse into one message.
 */
function describeError(error: unknown, fallbackTitle: string): ErrorMessage {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return {
        title: 'That date range was not accepted',
        detail: 'Check that the from date is on or before the to date and that both are valid calendar dates.',
      }
    }
    if (error.status === 404) {
      return {
        title: 'The API endpoint was not found',
        detail: 'Check that the backend implements the endpoint and that its API base URL is configured correctly.',
      }
    }
    if (error.status >= 500) {
      return {
        title: 'The backend reported an error',
        detail: `The API responded with status ${error.status}. Check the backend logs for the cause.`,
      }
    }
  }

  return {
    title: fallbackTitle,
    detail: 'Check that the backend is running and that its API base URL is configured correctly.',
  }
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`))
}

function time(value: string) {
  return value.slice(11, 16)
}

function Sparkline({ airport }: { airport: AirportSummary }) {
  const values = airport.dailyPerformance.map((point) => point.slaCompliancePercentage)
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 120
      const y = 40 - (value / 100) * 36
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className="sparkline" viewBox="0 0 120 44" role="img" aria-label={`${AIRPORT_NAMES[airport.airportCode]} SLA compliance trend`}>
      <line x1="0" x2="120" y1="40" y2="40" />
      <polyline points={points} />
    </svg>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section className="metric">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <span className="metric-detail">{detail}</span>
    </section>
  )
}

export default function App() {
  const [draftRange, setDraftRange] = useState(INITIAL_RANGE)
  const [range, setRange] = useState(INITIAL_RANGE)
  const [selectedCode, setSelectedCode] = useState('LGW')
  const [networkResult, setNetworkResult] = useState<NetworkResult | null>(null)
  const [detailResult, setDetailResult] = useState<DetailResult | null>(null)

  // Each request is identified by the inputs that produced it, and each result
  // is stored with the key it belongs to. Loading is then derived by comparing
  // the two, so there is no separate flag that can be left switched on when a
  // handler fires without actually changing an input.
  const networkKey = `${range.from}|${range.to}`
  const detailKey = `${selectedCode}|${networkKey}`

  const loading = networkResult?.key !== networkKey
  const detailLoading = detailResult?.key !== detailKey

  const slas = networkResult?.slas ?? []
  const network = networkResult?.network ?? null
  const airport = detailResult?.airport ?? null

  useEffect(() => {
    let active = true
    Promise.all([getSlas(), getNetworkPerformance(range)])
      .then(([slaData, performance]) =>
        active && setNetworkResult({ key: networkKey, slas: slaData, network: performance, error: null }),
      )
      .catch((cause) => active && setNetworkResult({ key: networkKey, slas: [], network: null, error: cause }))
    return () => {
      active = false
    }
  }, [networkKey, range])

  useEffect(() => {
    let active = true
    getAirportPerformance(selectedCode, range)
      .then((performance) => active && setDetailResult({ key: detailKey, airport: performance, error: null }))
      .catch((cause) => active && setDetailResult({ key: detailKey, airport: null, error: cause }))
    return () => {
      active = false
    }
  }, [detailKey, range, selectedCode])

  const totals = useMemo(() => {
    const airports = network?.airports ?? []
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
  }, [network])

  function applyDates(event: FormEvent) {
    event.preventDefault()
    setRange(draftRange)
  }

  const errorMessage = describeError(networkResult?.error, 'We could not load turn performance')

  // A 404 here means this airport has no data, not that the endpoint is missing.
  const detailError = detailResult?.error
  const detailErrorMessage =
    detailError instanceof ApiError && detailError.status === 404
      ? {
          title: `No performance data for ${AIRPORT_NAMES[selectedCode] ?? selectedCode}`,
          detail: `The backend has no turns for ${selectedCode} between ${range.from} and ${range.to}.`,
        }
      : describeError(detailError, 'We could not load airport detail')

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="brand-mark" aria-label="easyJet">easyJet</div>
        <span>Operations intelligence</span>
        {isMockApiEnabled() && <span className="demo-badge">Demo data</span>}
      </header>

      <main>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Network operations</span>
            <h1>Aircraft turn performance</h1>
            <p>Compare airport performance, track SLA compliance and investigate the operations behind each turn.</p>
          </div>
          <form className="date-filter" onSubmit={applyDates}>
            <label>
              <span>From date</span>
              <input type="date" value={draftRange.from} max={draftRange.to} onChange={(event) => setDraftRange({ ...draftRange, from: event.target.value })} />
            </label>
            <label>
              <span>To date</span>
              <input type="date" value={draftRange.to} min={draftRange.from} onChange={(event) => setDraftRange({ ...draftRange, to: event.target.value })} />
            </label>
            <button type="submit">Apply dates</button>
          </form>
        </section>

        {loading ? (
          <section className="message" aria-live="polite">Loading network performance…</section>
        ) : !network ? (
          <section className="message error" role="alert">
            <strong>{errorMessage.title}</strong>
            <span>{errorMessage.detail}</span>
          </section>
        ) : network.airports.length === 0 ? (
          <section className="message">No turns were found in this date range.</section>
        ) : (
          <>
            <section className="metrics-grid" aria-label="Network summary">
              <Metric label="SLA compliance" value={percentage(totals.compliance)} detail={`${totals.turnCount} turns assessed`} />
              <Metric label="Average turn" value={`${minutes(totals.average)} min`} detail="Across all airports" />
              <Metric label="Strongest airport" value={totals.strongest.airportCode} detail={`${AIRPORT_NAMES[totals.strongest.airportCode]} · ${percentage(totals.strongest.slaCompliancePercentage)}`} />
              <Metric label="Needs attention" value={totals.weakest?.airportCode ?? '—'} detail={totals.weakest ? `${AIRPORT_NAMES[totals.weakest.airportCode]} · ${percentage(totals.weakest.slaCompliancePercentage)}` : 'No performance data'} />
            </section>

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
                {network.airports.map((item) => (
                  <button
                    className={`airport-row ${selectedCode === item.airportCode ? 'selected' : ''}`}
                    key={item.airportCode}
                    onClick={() => setSelectedCode(item.airportCode)}
                    aria-label={`View ${AIRPORT_NAMES[item.airportCode]} performance`}
                  >
                    <span className="airport-name"><b>{item.airportCode}</b><small>{AIRPORT_NAMES[item.airportCode]}</small></span>
                    <span><b>{minutes(item.averageTurnMinutes)}</b><small>minutes</small></span>
                    <span className={item.slaCompliancePercentage >= 80 ? 'positive' : 'warning'}><b>{percentage(item.slaCompliancePercentage)}</b><small>{item.turnsMeetingSla} of {item.turnCount} turns</small></span>
                    <Sparkline airport={item} />
                    <span className="row-arrow" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="section-block airport-detail" aria-live="polite">
              {detailLoading ? (
                <div className="message">Loading airport detail…</div>
              ) : !airport ? (
                <div className="message error" role="alert">
                  <strong>{detailErrorMessage.title}</strong>
                  <span>{detailErrorMessage.detail}</span>
                </div>
              ) : (
                <>
                  <div className="section-heading detail-heading">
                    <div>
                      <span className="eyebrow">Airport detail</span>
                      <h2>{AIRPORT_NAMES[airport.airportCode]} <small>{airport.airportCode}</small></h2>
                    </div>
                    <div className="sla-chip">SLA target <strong>{slas.find((sla) => sla.airportCode === airport.airportCode)?.targetTurnMinutes ?? '—'} min</strong></div>
                  </div>

                  <div className="detail-grid">
                    <div className="trend-panel">
                      <h3>Daily SLA compliance</h3>
                      <div className="daily-bars">
                        {airport.dailyPerformance.map((day) => (
                          <div className="day-column" key={day.date}>
                            <span className="bar-value">{percentage(day.slaCompliancePercentage, 0)}</span>
                            <div className="bar-track"><span style={{ height: `${day.slaCompliancePercentage}%` }} /></div>
                            <span>{shortDate(day.date)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
                      <article className="turn-card" key={`${turn.flightNumber}-${turn.arrivalDateTime}`}>
                        <div className="turn-summary">
                          <div><strong>{turn.flightNumber}</strong><span>{shortDate(turn.arrivalDateTime.slice(0, 10))} · {time(turn.arrivalDateTime)}–{time(turn.departureDateTime)}</span></div>
                          <div><strong>{minutes(turn.totalTurnMinutes)} min</strong><span className={turn.metSla ? 'status-pass' : 'status-miss'}>{turn.metSla ? 'SLA met' : `${minutes(turn.totalTurnMinutes - turn.slaTargetMinutes)} min over`}</span></div>
                        </div>
                        <div className="operations">
                          {turn.operations.map((operation) => (
                            <div className="operation" key={operation.eventType}>
                              <span>{OPERATION_NAMES[operation.eventType]}</span>
                              <div className="operation-track"><span style={{ width: `${Math.min(100, operation.durationMinutes * 6)}%` }} /></div>
                              <strong>{minutes(operation.durationMinutes)}</strong>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>
      <footer>Aircraft turn performance · Supplied frontend</footer>
    </div>
  )
}
