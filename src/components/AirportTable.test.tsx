import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AirportTable } from './AirportTable'
import { aNetwork, anAirport } from '../test/fixtures'

const renderTable = (network = aNetwork(), onSelect = vi.fn()) => {
  render(<AirportTable network={network} selectedCode="LGW" onSelect={onSelect} />)
  return onSelect
}

describe('AirportTable', () => {
  it('rounds an average the backend did not round', () => {
    renderTable(aNetwork({ airports: [anAirport({ averageTurnMinutes: 34.892857142857146 })] }))

    expect(screen.getByText('34.9')).toBeInTheDocument()
    expect(screen.queryByText('34.892857142857146')).not.toBeInTheDocument()
  })

  it('reports the airport that was clicked', async () => {
    const user = userEvent.setup()
    const onSelect = renderTable(aNetwork({ airports: [anAirport({ airportCode: 'MAN' })] }))

    await user.click(screen.getByRole('button', { name: /View Manchester performance/i }))

    expect(onSelect).toHaveBeenCalledWith('MAN')
  })

  it('flags compliance below the healthy threshold', () => {
    const { container } = render(
      <AirportTable
        network={aNetwork({ airports: [anAirport({ slaCompliancePercentage: 79.9 })] })}
        selectedCode="LGW"
        onSelect={vi.fn()}
      />,
    )

    expect(container.querySelector('.warning')).toBeInTheDocument()
    expect(container.querySelector('.positive')).not.toBeInTheDocument()
  })

  it('marks the selected airport', () => {
    const { container } = render(
      <AirportTable
        network={aNetwork({ airports: [anAirport({ airportCode: 'LGW' }), anAirport({ airportCode: 'AMS' })] })}
        selectedCode="AMS"
        onSelect={vi.fn()}
      />,
    )

    expect(container.querySelectorAll('.airport-row.selected')).toHaveLength(1)
  })
})
