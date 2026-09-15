/**
 * Environment-derived configuration.
 *
 * Both values are read on each call rather than captured at module load, so
 * that the demo badge, the mock worker and the API client can never disagree
 * about which mode the application is running in.
 */

const MOCK_API_DISABLED = 'false'

/** Demo mode is on unless VITE_USE_MOCK_API is explicitly set to 'false'. */
export const isMockApiEnabled = () => import.meta.env.VITE_USE_MOCK_API !== MOCK_API_DISABLED

/** The backend origin, without a trailing slash. Empty means same-origin. */
export const getApiBaseUrl = () => (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/**
 * Warns when demo mode is off but no backend origin is configured. Requests
 * then resolve against the current origin, which is correct only when the
 * backend is served from it. Under `npm run dev` they hit the Vite dev server
 * and 404 with no explanation.
 */
export const warnIfMisconfigured = () => {
  if (isMockApiEnabled() || getApiBaseUrl() !== '') return

  console.warn(
    'VITE_USE_MOCK_API is false but VITE_API_BASE_URL is not set, so API requests will use relative paths ' +
      'against the current origin. Set VITE_API_BASE_URL to your backend, or ignore this if the backend is ' +
      'served from the same origin.',
  )
}
