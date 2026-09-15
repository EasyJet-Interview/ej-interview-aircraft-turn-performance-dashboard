import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import mockData from './mocks/api-data.json'
import type { AirportPerformance, NetworkPerformance, SlaDefinition } from './api/types'
import { ApiError, getAirportPerformance, getNetworkPerformance, getSlas } from './api/client'

/**
 * Integration cover for the wiring App owns: which request feeds which panel,
 * and how a failure in one is reported. Component behaviour is tested next to
 * each component.
 *
 * The request functions are replaced, but ApiError is kept so the component
 * and these tests agree on what a failed response looks like.
 */
vi.mock('./api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/client')>()),
  getSlas: vi.fn(),
  getNetworkPerformance: vi.fn(),
  getAirportPerformance: vi.fn(),
}))

const mockedGetSlas = vi.mocked(getSlas)
const mockedGetNetwork = vi.mocked(getNetworkPerformance)
const mockedGetAirport = vi.mocked(getAirportPerformance)

const RANGE = { from: '2026-08-03', to: '2026-08-09' }

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetSlas.mockResolvedValue(mockData.slas as SlaDefinition[])
  mockedGetNetwork.mockResolvedValue(mockData.network as NetworkPerformance)
  mockedGetAirport.mockImplementation((code) =>
    Promise.resolve(mockData.details[code as keyof typeof mockData.details] as AirportPerformance),
  )
})

describe('aircraft turn dashboard', () => {
  it('loads the network for the default range', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Aircraft turn performance' })).toBeInTheDocument()
    expect(screen.getByText('Amsterdam Schiphol')).toBeInTheDocument()
    expect(mockedGetNetwork).toHaveBeenCalledWith(RANGE)
  })

  it('loads detailed turns when an airport is selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /View Manchester performance/i }))

    await waitFor(() => expect(mockedGetAirport).toHaveBeenCalledWith('MAN', RANGE))
    expect(await screen.findByText('EZY7201')).toBeInTheDocument()
  })

  it('reloads both panels for a newly applied date range', async () => {
    const user = userEvent.setup()
    render(<App />)

    const from = await screen.findByLabelText('From date')
    await user.clear(from)
    await user.type(from, '2026-08-04')
    await user.click(screen.getByRole('button', { name: 'Apply dates' }))

    await waitFor(() => expect(mockedGetNetwork).toHaveBeenLastCalledWith({ from: '2026-08-04', to: '2026-08-09' }))
    await waitFor(() => expect(mockedGetAirport).toHaveBeenLastCalledWith('LGW', { from: '2026-08-04', to: '2026-08-09' }))
  })

  it('reports a network failure in place of the dashboard', async () => {
    mockedGetNetwork.mockRejectedValue(new Error('offline'))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load turn performance')
  })

  it('keeps the detail visible when the selected airport is clicked again', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('heading', { name: /London Gatwick/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /View London Gatwick performance/i }))

    expect(screen.queryByText('Loading airport detail…')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /London Gatwick/ })).toBeInTheDocument()
    expect(mockedGetAirport).toHaveBeenCalledTimes(1)
  })

  it('reads a detail 404 as an airport with no data, not a missing endpoint', async () => {
    mockedGetAirport.mockRejectedValue(new ApiError(404))
    render(<App />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No performance data for London Gatwick')
    expect(alert).toHaveTextContent('between 2026-08-03 and 2026-08-09')
    expect(screen.queryByText('Loading airport detail…')).not.toBeInTheDocument()
  })

  it('recovers the detail pane after a failed airport request', async () => {
    const user = userEvent.setup()
    mockedGetAirport.mockRejectedValueOnce(new ApiError(404))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No performance data for London Gatwick')

    await user.click(screen.getByRole('button', { name: /View Manchester performance/i }))

    expect(await screen.findByRole('heading', { name: /Manchester/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
