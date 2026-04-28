import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

const API_BASE = '/api/v1'

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options

  let token = null
  if (!skipAuth) {
    const req = new NextRequest('http://localhost' + API_BASE + endpoint)
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: false })
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
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
