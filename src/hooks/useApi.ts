import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

interface UseApiOptions {
  immediate?: boolean
}

export function useApi<T>(fn: () => Promise<T>, options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  })

  const execute = useCallback(async (...args: any[]) => {
    setState({ data: null, error: null, loading: true })
    try {
      const data = await fn()
      setState({ data, error: null, loading: false })
      return data
    } catch (error: any) {
      setState({ data: null, error: error.message, loading: false })
      throw error
    }
  }, [fn])

  return { ...state, execute }
}

export function useMutationApi<T, Variables = any>(
  fn: (variables: Variables) => Promise<T>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  })

  const mutate = useCallback(async (variables: Variables) => {
    setState({ data: null, error: null, loading: true })
    try {
      const data = await fn(variables)
      setState({ data, error: null, loading: false })
      return data
    } catch (error: any) {
      setState({ data: null, error: error.message, loading: false })
      throw error
    }
  }, [fn])

  return { ...state, mutate }
}
