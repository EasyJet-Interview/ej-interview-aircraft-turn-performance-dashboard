import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import mockData from './mocks/api-data.json'
import type { AirportPerformance, NetworkPerformance, SlaDefinition } from './api/types'
import { ApiError, getAirportPerformance, getNetworkPerformance, getSlas } from './api/client'

// The three request functions are replaced, but ApiError is kept so that the
// component and these tests agree on what a failed response looks like.
vi.mock('./api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/client')>()),
  getSlas: vi.fn(),
  getNetworkPerformance: vi.fn(),
  getAirportPerformance: vi.fn(),
}))

const mockedGetSlas = vi.mocked(getSlas)
const mockedGetNetwork = vi.mocked(getNetworkPerformance)
const mockedGetAirport = vi.mocked(getAirportPerformance)

const network = mockData.network as NetworkPerformance

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetSlas.mockResolvedValue(mockData.slas as SlaDefinition[])
  mockedGetNetwork.mockResolvedValue(network)
  mockedGetAirport.mockImplementation((code) =>
    Promise.resolve(mockData.details[code as keyof typeof mockData.details] as AirportPerformance),
  )
})

afterEach(() => vi.unstubAllEnvs())

describe('aircraft turn dashboard', () => {
  it('loads network performance and shows the strongest airport', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Aircraft turn performance' })).toBeInTheDocument()
    expect(screen.getByText('Amsterdam Schiphol')).toBeInTheDocument()
    expect(screen.getByText('90.6%')).toBeInTheDocument()
    expect(mockedGetNetwork).toHaveBeenCalledWith({ from: '2026-08-03', to: '2026-08-09' })
  })

  it('loads detailed turns when an airport is selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /View Manchester performance/i }))

    await waitFor(() => expect(mockedGetAirport).toHaveBeenCalledWith('MAN', { from: '2026-08-03', to: '2026-08-09' }))
    expect(await screen.findByText('EZY7201')).toBeInTheDocument()
  })

  it('reloads the dashboard for a selected date range', async () => {
    const user = userEvent.setup()
    render(<App />)

    const from = await screen.findByLabelText('From date')
    const to = screen.getByLabelText('To date')
    await user.clear(from)
    await user.type(from, '2026-08-04')
    await user.clear(to)
    await user.type(to, '2026-08-08')
    await user.click(screen.getByRole('button', { name: 'Apply dates' }))

    await waitFor(() => expect(mockedGetNetwork).toHaveBeenLastCalledWith({ from: '2026-08-04', to: '2026-08-08' }))
  })

  it('shows a useful message when the backend is unavailable', async () => {
    mockedGetNetwork.mockRejectedValue(new Error('offline'))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load turn performance')
  })

  it('rounds averages that the backend did not round', async () => {
    mockedGetNetwork.mockResolvedValue({
      ...network,
      airports: network.airports.map((airport) =>
        airport.airportCode === 'LGW' ? { ...airport, averageTurnMinutes: 34.892857142857146 } : airport,
      ),
    })
    render(<App />)

    expect(await screen.findByText('34.9')).toBeInTheDocument()
    expect(screen.queryByText('34.892857142857146')).not.toBeInTheDocument()
  })

  it('shows the demo badge while the mock API is serving responses', async () => {
    render(<App />)

    expect(await screen.findByText('Demo data')).toBeInTheDocument()
  })

  it('hides the demo badge when a real backend is configured', async () => {
    vi.stubEnv('VITE_USE_MOCK_API', 'false')
    render(<App />)

    await screen.findByRole('heading', { name: 'Aircraft turn performance' })
    expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
  })

  it('keeps the detail visible when the selected airport is clicked again', async () => {
    const user = userEvent.setup()
    render(<App />)

    // LGW is selected on load, so its detail is already on screen.
    expect(await screen.findByRole('heading', { name: /London Gatwick/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /View London Gatwick performance/i }))

    expect(screen.queryByText('Loading airport detail…')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /London Gatwick/ })).toBeInTheDocument()
    expect(mockedGetAirport).toHaveBeenCalledTimes(1)
  })

  it('reports an airport with no data instead of loading for ever', async () => {
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

  it('distinguishes a rejected date range from other failures', async () => {
    mockedGetNetwork.mockRejectedValue(new ApiError(400))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('That date range was not accepted')
  })

  it('reports a server fault with its status', async () => {
    mockedGetNetwork.mockRejectedValue(new ApiError(503))
    render(<App />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The backend reported an error')
    expect(alert).toHaveTextContent('status 503')
  })
})
