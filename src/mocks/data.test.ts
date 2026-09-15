import { describe, expect, it } from 'vitest'
import { getMockAirport, getMockNetwork, getMockSlas } from './data'

const FULL_WEEK = { from: '2026-08-03', to: '2026-08-09' }
const TWO_DAYS = { from: '2026-08-04', to: '2026-08-05' }
const OUTSIDE = { from: '2026-09-01', to: '2026-09-07' }

describe('demo API data', () => {
  it('provides all five airport SLAs', () => {
    expect(getMockSlas()).toHaveLength(5)
  })

  it('echoes the requested range in network responses', () => {
    const response = getMockNetwork(FULL_WEEK)

    expect(response).toMatchObject(FULL_WEEK)
    expect(response.airports).toHaveLength(5)
  })

  it('returns only the days inside the requested range', () => {
    const [airport] = getMockNetwork(TWO_DAYS).airports

    expect(airport.dailyPerformance.map((day) => day.date)).toEqual(['2026-08-04', '2026-08-05'])
  })

  it('recomputes the summary from the days that remain', () => {
    const [full] = getMockNetwork(FULL_WEEK).airports
    const [clipped] = getMockNetwork(TWO_DAYS).airports

    expect(clipped.turnCount).toBeLessThan(full.turnCount)
    expect(clipped.turnsMeetingSla + clipped.turnsMissingSla).toBe(clipped.turnCount)
  })

  it('reports no airports for a range the demo data does not cover', () => {
    expect(getMockNetwork(OUTSIDE).airports).toEqual([])
  })

  it('returns airport detail with the requested range', () => {
    expect(getMockAirport('MAN', FULL_WEEK)).toMatchObject({ airportCode: 'MAN', ...FULL_WEEK })
  })

  it('returns only the turns that arrived inside the range', () => {
    const detail = getMockAirport('MAN', TWO_DAYS)!

    expect(detail.turns).not.toHaveLength(0)
    detail.turns.forEach((turn) => {
      expect(turn.arrivalDateTime.slice(0, 10) >= TWO_DAYS.from).toBe(true)
      expect(turn.arrivalDateTime.slice(0, 10) <= TWO_DAYS.to).toBe(true)
    })
  })

  it('returns null for an unknown airport', () => {
    expect(getMockAirport('JFK', FULL_WEEK)).toBeNull()
  })
})
