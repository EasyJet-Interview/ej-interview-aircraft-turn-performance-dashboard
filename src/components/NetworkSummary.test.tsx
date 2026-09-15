import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NetworkSummary } from './NetworkSummary'
import { aNetwork, anAirport } from '../test/fixtures'

describe('NetworkSummary', () => {
  it('weights the network average by turn count rather than by airport', () => {
    render(
      <NetworkSummary
        network={aNetwork({
          airports: [
            anAirport({ airportCode: 'LGW', turnCount: 90, averageTurnMinutes: 30, turnsMeetingSla: 90 }),
            anAirport({ airportCode: 'AMS', turnCount: 10, averageTurnMinutes: 60, turnsMeetingSla: 0 }),
          ],
        })}
      />,
    )

    // A flat mean would read 45.0; weighting by turns gives 33.0.
    expect(screen.getByText('33.0 min')).toBeInTheDocument()
    expect(screen.getByText('100 turns assessed')).toBeInTheDocument()
  })

  it('ranks the strongest and weakest airports by compliance', () => {
    render(
      <NetworkSummary
        network={aNetwork({
          airports: [
            anAirport({ airportCode: 'LGW', slaCompliancePercentage: 70 }),
            anAirport({ airportCode: 'AMS', slaCompliancePercentage: 95 }),
          ],
        })}
      />,
    )

    expect(screen.getByText('AMS')).toBeInTheDocument()
    expect(screen.getByText('LGW')).toBeInTheDocument()
    expect(screen.getByText(/Amsterdam Schiphol · 95.0%/)).toBeInTheDocument()
    expect(screen.getByText(/London Gatwick · 70.0%/)).toBeInTheDocument()
  })
})
