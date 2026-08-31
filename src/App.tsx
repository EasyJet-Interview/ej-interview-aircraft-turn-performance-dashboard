import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getAirportPerformance, getNetworkPerformance, getSlas, type DateRange } from './api/client'
import type { AirportPerformance, AirportSummary, NetworkPerformance, SlaDefinition, TurnOperation } from './api/types'
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

const INITIAL_RANGE: DateRange = { from: '2026-07-21', to: '2026-07-27' }

function percentage(value: number) {
  return `${value.toFixed(1)}%`
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
  const [slas, setSlas] = useState<SlaDefinition[]>([])
  const [network, setNetwork] = useState<NetworkPerformance | null>(null)
  const [selectedCode, setSelectedCode] = useState('LGW')
  const [airport, setAirport] = useState<AirportPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getSlas(), getNetworkPerformance(range)])
      .then(([slaData, performance]) => {
        if (!active) return
        setSlas(slaData)
        setNetwork(performance)
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [range])

  useEffect(() => {
    let active = true
    getAirportPerformance(selectedCode, range)
      .then((performance) => active && setAirport(performance))
      .catch(() => active && setAirport(null))
      .finally(() => active && setDetailLoading(false))
    return () => {
      active = false
    }
  }, [range, selectedCode])

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
    setLoading(true)
    setDetailLoading(true)
    setError(false)
    setRange(draftRange)
  }

  function selectAirport(airportCode: string) {
    setDetailLoading(true)
    setSelectedCode(airportCode)
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="brand-mark" aria-label="easyJet">easyJet</div>
        <span>Operations intelligence</span>
        <span className="demo-badge">Demo data</span>
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

        {error ? (
          <section className="message error" role="alert">
            <strong>We could not load turn performance</strong>
            <span>Check that the backend is running and that its API base URL is configured correctly.</span>
          </section>
        ) : loading || !network ? (
          <section className="message" aria-live="polite">Loading network performance…</section>
        ) : network.airports.length === 0 ? (
          <section className="message">No turns were found in this date range.</section>
        ) : (
          <>
            <section className="metrics-grid" aria-label="Network summary">
              <Metric label="SLA compliance" value={percentage(totals.compliance)} detail={`${totals.turnCount} turns assessed`} />
              <Metric label="Average turn" value={`${totals.average.toFixed(1)} min`} detail="Across all airports" />
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
                    onClick={() => selectAirport(item.airportCode)}
                    aria-label={`View ${AIRPORT_NAMES[item.airportCode]} performance`}
                  >
                    <span className="airport-name"><b>{item.airportCode}</b><small>{AIRPORT_NAMES[item.airportCode]}</small></span>
                    <span><b>{item.averageTurnMinutes}</b><small>minutes</small></span>
                    <span className={item.slaCompliancePercentage >= 80 ? 'positive' : 'warning'}><b>{percentage(item.slaCompliancePercentage)}</b><small>{item.turnsMeetingSla} of {item.turnCount} turns</small></span>
                    <Sparkline airport={item} />
                    <span className="row-arrow" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="section-block airport-detail" aria-live="polite">
              {detailLoading || !airport ? (
                <div className="message">Loading airport detail…</div>
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
                            <span className="bar-value">{Math.round(day.slaCompliancePercentage)}%</span>
                            <div className="bar-track"><span style={{ height: `${day.slaCompliancePercentage}%` }} /></div>
                            <span>{shortDate(day.date)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="airport-numbers">
                      <Metric label="Turns" value={String(airport.turnCount)} detail={`${airport.turnsMissingSla} missed SLA`} />
                      <Metric label="Average" value={`${airport.averageTurnMinutes} min`} detail="Arrival to departure" />
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
                          <div><strong>{turn.totalTurnMinutes} min</strong><span className={turn.metSla ? 'status-pass' : 'status-miss'}>{turn.metSla ? 'SLA met' : `${turn.totalTurnMinutes - turn.slaTargetMinutes} min over`}</span></div>
                        </div>
                        <div className="operations">
                          {turn.operations.map((operation) => (
                            <div className="operation" key={operation.eventType}>
                              <span>{OPERATION_NAMES[operation.eventType]}</span>
                              <div className="operation-track"><span style={{ width: `${Math.min(100, operation.durationMinutes * 6)}%` }} /></div>
                              <strong>{operation.durationMinutes}</strong>
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
