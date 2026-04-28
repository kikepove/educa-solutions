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
    let errorMessage = 'Error en la petición'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || JSON.stringify(errorData)
    } catch {
      errorMessage = await response.text() || `Error ${response.status}`
    }
    throw new Error(errorMessage)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : (null as unknown as T)
}

export function getApiUrl(path: string): string {
  return `${API_BASE}${path}`
}
