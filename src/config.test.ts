import { afterEach, describe, expect, it, vi } from 'vitest'
import { getApiBaseUrl, isMockApiEnabled, warnIfMisconfigured } from './config'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('configuration', () => {
  it('leaves demo mode on when the flag is absent', () => {
    expect(isMockApiEnabled()).toBe(true)
  })

  it('turns demo mode off only for an explicit false', () => {
    vi.stubEnv('VITE_USE_MOCK_API', 'false')
    expect(isMockApiEnabled()).toBe(false)

    vi.stubEnv('VITE_USE_MOCK_API', 'true')
    expect(isMockApiEnabled()).toBe(true)
  })

  it('strips a trailing slash from the backend origin', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/')
    expect(getApiBaseUrl()).toBe('http://localhost:8080')
  })

  it('treats an absent backend origin as same-origin', () => {
    expect(getApiBaseUrl()).toBe('')
  })

  it('warns when demo mode is off but no backend origin is set', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('VITE_USE_MOCK_API', 'false')
    vi.stubEnv('VITE_API_BASE_URL', '')

    warnIfMisconfigured()

    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('VITE_API_BASE_URL')
  })

  it('stays quiet when a backend origin is configured', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('VITE_USE_MOCK_API', 'false')
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')

    warnIfMisconfigured()

    expect(warn).not.toHaveBeenCalled()
  })

  it('stays quiet in demo mode, where no backend origin is needed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('VITE_API_BASE_URL', '')

    warnIfMisconfigured()

    expect(warn).not.toHaveBeenCalled()
  })
})
