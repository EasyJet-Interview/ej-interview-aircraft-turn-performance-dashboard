import { describe, expect, it } from 'vitest'
import { getMockAirport, getMockNetwork, getMockSlas } from './data'

const range = { from: '2026-08-04', to: '2026-08-08' }

describe('demo API data', () => {
  it('provides all five airport SLAs', () => {
    expect(getMockSlas()).toHaveLength(5)
  })

  it('echoes the requested range in network responses', () => {
    const response = getMockNetwork(range)
    expect(response).toMatchObject(range)
    expect(response.airports).toHaveLength(5)
  })

  it('returns airport detail with the requested range', () => {
    expect(getMockAirport('MAN', range)).toMatchObject({ airportCode: 'MAN', ...range })
  })

  it('returns null for an unknown airport', () => {
    expect(getMockAirport('JFK', range)).toBeNull()
  })
})
