const API_BASE = '/api/v1'

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Error en la petición')
  }

  const text = await response.text()
  return text ? JSON.parse(text) : (null as unknown as T)
}

export function getApiUrl(path: string): string {
  return `${API_BASE}${path}`
}
