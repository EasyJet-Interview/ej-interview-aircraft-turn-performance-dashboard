import { ApiError } from './api/client'

export interface ErrorMessage {
  title: string
  detail: string
}

const CHECK_BACKEND = 'Check that the backend is running and that its API base URL is configured correctly.'

/**
 * Turns a failed request into something the user can act on. A rejected date
 * range, a missing endpoint and a server fault all need different responses,
 * so they should not collapse into one message.
 */
export const describeError = (error: unknown, fallbackTitle: string): ErrorMessage => {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return {
        title: 'That date range was not accepted',
        detail: 'Check that the from date is on or before the to date and that both are valid calendar dates.',
      }
    }
    if (error.status === 404) {
      return { title: 'The API endpoint was not found', detail: `Check that the backend implements the endpoint. ${CHECK_BACKEND}` }
    }
    if (error.status >= 500) {
      return {
        title: 'The backend reported an error',
        detail: `The API responded with status ${error.status}. Check the backend logs for the cause.`,
      }
    }
  }

  return { title: fallbackTitle, detail: CHECK_BACKEND }
}
