import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRequest } from './useRequest'

describe('useRequest', () => {
  it('reports loading until the result for the current key arrives', async () => {
    const { result } = renderHook(() => useRequest('a', () => Promise.resolve('value')))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('value')
  })

  it('exposes the failure without leaving the caller loading', async () => {
    const failure = new Error('offline')
    const { result } = renderHook(() => useRequest('a', () => Promise.reject(failure)))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe(failure)
  })

  it('does not re-send when the key is unchanged', async () => {
    const send = vi.fn(() => Promise.resolve('value'))
    const { result, rerender } = renderHook(() => useRequest('a', send))

    await waitFor(() => expect(result.current.loading).toBe(false))
    rerender()

    expect(send).toHaveBeenCalledTimes(1)
    expect(result.current.loading).toBe(false)
  })

  it('returns to loading when the key changes', async () => {
    const { result, rerender } = renderHook(({ key }) => useRequest(key, () => Promise.resolve(key)), {
      initialProps: { key: 'a' },
    })

    await waitFor(() => expect(result.current.data).toBe('a'))
    rerender({ key: 'b' })

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.data).toBe('b'))
  })

  it('ignores a superseded response that resolves after a newer one', async () => {
    const settle: Record<string, (value: string) => void> = {}
    const { result, rerender } = renderHook(
      ({ key }) => useRequest(key, () => new Promise<string>((resolve) => (settle[key] = resolve))),
      { initialProps: { key: 'a' } },
    )

    rerender({ key: 'b' })
    settle.b('newer')
    await waitFor(() => expect(result.current.data).toBe('newer'))

    settle.a('stale')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(result.current.data).toBe('newer')
    expect(result.current.loading).toBe(false)
  })
})
