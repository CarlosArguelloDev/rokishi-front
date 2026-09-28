const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8081').replace(/\/$/, '')

type ErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'network_error', 'No se pudo conectar con la API. Verifica tu conexion e intenta de nuevo.')
  }

  const body = await response.json().catch(() => null) as (T & ErrorBody) | null
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('rokishi:unauthorized'))
    }
    throw new ApiError(
      response.status,
      body?.error?.code || 'request_failed',
      body?.error?.message || 'La operacion no pudo completarse.',
    )
  }
  if (body === null) {
    throw new ApiError(response.status, 'invalid_response', 'La API devolvio una respuesta no valida.')
  }
  return body
}
