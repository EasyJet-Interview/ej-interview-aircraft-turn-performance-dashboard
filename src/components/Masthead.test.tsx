import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Masthead } from './Masthead'

afterEach(() => vi.unstubAllEnvs())

describe('Masthead', () => {
  it('shows the demo badge while the mock API is serving responses', () => {
    render(<Masthead />)

    expect(screen.getByText('Demo data')).toBeInTheDocument()
  })

  it('hides the demo badge when a real backend is configured', () => {
    vi.stubEnv('VITE_USE_MOCK_API', 'false')
    render(<Masthead />)

    expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
  })
})
