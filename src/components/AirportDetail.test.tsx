import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AirportDetail } from './AirportDetail'
import { aDay, aTurn, anAirportDetail } from '../test/fixtures'

const slas = [{ airportCode: 'LGW', targetTurnMinutes: 40 }]

describe('AirportDetail', () => {
  it('shows the SLA target for the airport being viewed', () => {
    render(<AirportDetail airport={anAirportDetail()} slas={slas} />)

    expect(screen.getByText('40 min')).toBeInTheDocument()
  })

  it('falls back when the airport has no SLA definition', () => {
    render(<AirportDetail airport={anAirportDetail({ airportCode: 'AMS' })} slas={slas} />)

    expect(screen.getByText('— min')).toBeInTheDocument()
  })

  it('renders a bar per day and a card per turn', () => {
    const { container } = render(
      <AirportDetail
        airport={anAirportDetail({
          dailyPerformance: [aDay({ date: '2026-08-03' }), aDay({ date: '2026-08-04' })],
          turns: [aTurn({ flightNumber: 'EZY8101' }), aTurn({ flightNumber: 'EZY7201' })],
        })}
        slas={slas}
      />,
    )

    expect(container.querySelectorAll('.day-column')).toHaveLength(2)
    expect(screen.getByText('EZY8101')).toBeInTheDocument()
    expect(screen.getByText('EZY7201')).toBeInTheDocument()
  })
})
