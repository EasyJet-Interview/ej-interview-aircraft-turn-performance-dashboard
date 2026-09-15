import { describe, expect, it } from 'vitest'
import { ApiError } from './api/client'
import { describeError } from './errors'

describe('describeError', () => {
  it('separates a rejected date range from other failures', () => {
    expect(describeError(new ApiError(400), 'fallback').title).toBe('That date range was not accepted')
  })

  it('reads a 404 as a missing endpoint', () => {
    expect(describeError(new ApiError(404), 'fallback').title).toBe('The API endpoint was not found')
  })

  it('reports a server fault with its status', () => {
    const message = describeError(new ApiError(503), 'fallback')

    expect(message.title).toBe('The backend reported an error')
    expect(message.detail).toContain('503')
  })

  it('falls back for a transport failure, which carries no status', () => {
    expect(describeError(new Error('offline'), 'We could not load turn performance').title).toBe(
      'We could not load turn performance',
    )
  })

  it('falls back when nothing failed at all', () => {
    expect(describeError(undefined, 'fallback').title).toBe('fallback')
  })
})
