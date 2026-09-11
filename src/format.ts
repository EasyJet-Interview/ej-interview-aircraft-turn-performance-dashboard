/**
 * Display formatting for numbers returned by the API.
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

function fixed(value: number, fractionDigits: number) {
  return Number.isFinite(value) ? value.toFixed(fractionDigits) : NO_VALUE
}

/** Formats a duration in minutes. The unit is left to the caller's markup. */
export function minutes(value: number, fractionDigits = MINUTE_DIGITS) {
  return fixed(value, fractionDigits)
}

/** Formats a 0-100 percentage, including the per-cent symbol. */
export function percentage(value: number, fractionDigits = PERCENTAGE_DIGITS) {
  const rounded = fixed(value, fractionDigits)
  return rounded === NO_VALUE ? NO_VALUE : `${rounded}%`
}
