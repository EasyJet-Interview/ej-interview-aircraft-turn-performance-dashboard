import { useEffect, useState } from 'react'

interface Result<T> {
  key: string
  data: T | null
  error: unknown
}

export interface RequestState<T> {
  data: T | null
  error: unknown
  loading: boolean
}

/**
 * Runs `send` whenever `key` changes and reports the settled outcome.
 *
 * The result is stored tagged with the key that produced it, and `loading` is
 * derived by comparing that key against the current one. There is no separate
 * loading flag, so none can be left switched on when a caller re-requests the
 * key it already has. Tagging also means a superseded response cannot replace
 * a newer one.
 */
export const useRequest = <T,>(key: string, send: () => Promise<T>): RequestState<T> => {
  const [result, setResult] = useState<Result<T> | null>(null)

  useEffect(() => {
    let active = true
    send()
      .then((data) => active && setResult({ key, data, error: null }))
      .catch((error) => active && setResult({ key, data: null, error }))
    return () => {
      active = false
    }
    // `send` is rebuilt on every render; `key` is what identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return {
    data: result?.data ?? null,
    error: result?.error,
    loading: result?.key !== key,
  }
}
