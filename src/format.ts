/**
 * Display formatting for numbers and dates returned by the API.
 *
 * The API is not trusted to send pre-rounded values. A backend computing a
 * naive sum/count mean returns values like 34.892857142857146, and floating
 * point subtraction produces values like 6.799999999999999. Every number
 * shown to a user is routed through this module so that rounding is applied
 * once, consistently, wherever the value appears.
 */

const MINUTE_DIGITS = 1
const PERCENTAGE_DIGITS = 1
const NO_VALUE = '—'

const fixed = (value: number, fractionDigits: number) =>
  Number.isFinite(value) ? value.toFixed(fractionDigits) : NO_VALUE

/** Formats a duration in minutes. The unit is left to the caller's markup. */
export const minutes = (value: number, fractionDigits = MINUTE_DIGITS) => fixed(value, fractionDigits)

/** Formats a 0-100 percentage, including the per-cent symbol. */
export const percentage = (value: number, fractionDigits = PERCENTAGE_DIGITS) => {
  const rounded = fixed(value, fractionDigits)
  return rounded === NO_VALUE ? NO_VALUE : `${rounded}%`
}

const DAY_AND_MONTH = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' })

/** Formats a YYYY-MM-DD local date as "03 Aug". Midday avoids any timezone shift. */
export const shortDate = (value: string) => DAY_AND_MONTH.format(new Date(`${value}T12:00:00`))

/** Takes the HH:mm clock time out of a local ISO date-time, without parsing it. */
export const clockTime = (value: string) => value.slice(11, 16)
