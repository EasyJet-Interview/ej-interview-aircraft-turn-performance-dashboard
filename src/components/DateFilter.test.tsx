import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateFilter } from './DateFilter'

const range = { from: '2026-08-03', to: '2026-08-09' }

describe('DateFilter', () => {
  it('reports the edited range only once it is applied', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<DateFilter initialRange={range} onApply={onApply} />)

    await user.clear(screen.getByLabelText('From date'))
    await user.type(screen.getByLabelText('From date'), '2026-08-04')
    expect(onApply).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Apply dates' }))

    expect(onApply).toHaveBeenCalledWith({ from: '2026-08-04', to: '2026-08-09' })
  })

  it('stops the to date being set before the from date', () => {
    render(<DateFilter initialRange={range} onApply={vi.fn()} />)

    expect(screen.getByLabelText('To date')).toHaveAttribute('min', range.from)
    expect(screen.getByLabelText('From date')).toHaveAttribute('max', range.to)
  })
})
