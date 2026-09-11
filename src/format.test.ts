import { describe, expect, it } from 'vitest'
import { minutes, percentage } from './format'

describe('display formatting', () => {
  it('rounds an unrounded backend mean rather than showing full precision', () => {
    expect(minutes(34.892857142857146)).toBe('34.9')
  })

  it('absorbs floating point noise in a derived duration', () => {
    expect(minutes(6.799999999999999)).toBe('6.8')
  })

  it('pads whole minutes to a fixed precision so table columns align', () => {
    expect(minutes(39)).toBe('39.0')
  })

  it('formats a percentage to one decimal place by default', () => {
    expect(percentage(83.333333)).toBe('83.3%')
  })

  it('formats a compact percentage without decimals', () => {
    expect(percentage(88.6, 0)).toBe('89%')
  })

  it('reports a placeholder instead of NaN when a value is not a number', () => {
    expect(minutes(Number.NaN)).toBe('—')
    expect(percentage(Number.POSITIVE_INFINITY)).toBe('—')
  })
})
