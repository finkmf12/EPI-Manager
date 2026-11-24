export class ApiError extends Error {
  readonly status: number
  readonly details: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
export const API_BASE_URL = (configuredBaseUrl || 'http://localhost:8080').replace(/\/$/, '')

function messageFromPayload(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    for (const key of ['message', 'detail', 'error']) {
      const value = body[key]
      if (typeof value === 'string' && value.trim()) return value
    }
  }
  return fallback
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'omit',
      cache: 'no-store',
    })
  } catch {
    throw new ApiError(
      'Não foi possível conectar à API. Verifique o endereço e se o Back-End está em execução.',
      0,
    )
  }

  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') ?? ''
  let payload: unknown
  try {
    payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text()
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    const fallback = response.status === 401
      ? 'Sua sessão expirou. Entre novamente.'
      : response.status === 403
        ? 'Seu perfil não possui permissão para esta operação.'
        : `A API retornou o status ${response.status}.`
    throw new ApiError(messageFromPayload(payload, fallback), response.status, payload)
  }

  return payload as T
}
