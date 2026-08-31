import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import mockData from './mocks/api-data.json'
import type { AirportPerformance, NetworkPerformance, SlaDefinition } from './api/types'
import { getAirportPerformance, getNetworkPerformance, getSlas } from './api/client'

vi.mock('./api/client', () => ({
  getSlas: vi.fn(),
  getNetworkPerformance: vi.fn(),
  getAirportPerformance: vi.fn(),
}))

const mockedGetSlas = vi.mocked(getSlas)
const mockedGetNetwork = vi.mocked(getNetworkPerformance)
const mockedGetAirport = vi.mocked(getAirportPerformance)

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetSlas.mockResolvedValue(mockData.slas as SlaDefinition[])
  mockedGetNetwork.mockResolvedValue(mockData.network as NetworkPerformance)
  mockedGetAirport.mockImplementation((code) =>
    Promise.resolve(mockData.details[code as keyof typeof mockData.details] as AirportPerformance),
  )
})

describe('aircraft turn dashboard', () => {
  it('loads network performance and shows the strongest airport', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Aircraft turn performance' })).toBeInTheDocument()
    expect(screen.getByText('Amsterdam Schiphol')).toBeInTheDocument()
    expect(screen.getByText('90.6%')).toBeInTheDocument()
    expect(mockedGetNetwork).toHaveBeenCalledWith({ from: '2026-07-21', to: '2026-07-27' })
  })

  it('loads detailed turns when an airport is selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /View Manchester performance/i }))

    await waitFor(() => expect(mockedGetAirport).toHaveBeenCalledWith('MAN', { from: '2026-07-21', to: '2026-07-27' }))
    expect(await screen.findByText('EZY7201')).toBeInTheDocument()
  })

  it('reloads the dashboard for a selected date range', async () => {
    const user = userEvent.setup()
    render(<App />)

    const from = await screen.findByLabelText('From date')
    const to = screen.getByLabelText('To date')
    await user.clear(from)
    await user.type(from, '2026-07-22')
    await user.clear(to)
    await user.type(to, '2026-07-26')
    await user.click(screen.getByRole('button', { name: 'Apply dates' }))

    await waitFor(() => expect(mockedGetNetwork).toHaveBeenLastCalledWith({ from: '2026-07-22', to: '2026-07-26' }))
  })

  it('shows a useful message when the backend is unavailable', async () => {
    mockedGetNetwork.mockRejectedValue(new Error('offline'))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load turn performance')
  })
})
