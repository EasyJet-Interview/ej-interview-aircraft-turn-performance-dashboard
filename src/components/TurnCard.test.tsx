import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TurnCard } from './TurnCard'
import { aTurn } from '../test/fixtures'

describe('TurnCard', () => {
  it('shows the arrival window as local clock times', () => {
    render(<TurnCard turn={aTurn()} />)

    expect(screen.getByText(/03 Aug · 06:02–06:36/)).toBeInTheDocument()
  })

  it('reports a turn that met its SLA', () => {
    render(<TurnCard turn={aTurn({ metSla: true })} />)

    expect(screen.getByText('SLA met')).toBeInTheDocument()
  })

  it('reports how far a missed turn ran over, absorbing float noise', () => {
    render(<TurnCard turn={aTurn({ metSla: false, totalTurnMinutes: 46.8, slaTargetMinutes: 40 })} />)

    // 46.8 - 40 evaluates to 6.799999999999997 in binary floating point.
    expect(screen.getByText('6.8 min over')).toBeInTheDocument()
  })

  it('names each operation in the turn', () => {
    render(<TurnCard turn={aTurn()} />)

    expect(screen.getByText('Unloading')).toBeInTheDocument()
    expect(screen.getByText('Cleaning')).toBeInTheDocument()
  })
})
