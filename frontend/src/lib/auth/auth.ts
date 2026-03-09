const TOKEN_KEY = 'cinerate_auth_token'
const AUTH_CHANGED_EVENT = 'cinerate-auth-changed'

function decodeBase64UTF8(base64: string): string {
  const normalizedBase64 = base64.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalizedBase64.length % 4
  const base64WithPadding = padding ? normalizedBase64.padEnd(normalizedBase64.length + (4 - padding), '=') : normalizedBase64
  const binaryString = atob(base64WithPadding)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return new TextDecoder('utf-8').decode(bytes)
}

function emitAuthChanged(): void {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

function isJWT(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  return parts.length === 3 && parts.every((part) => part.length > 0)
}

export function getAuthChangedEventName(): string {
  return AUTH_CHANGED_EVENT
}

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  return token && isJWT(token) ? token : null
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  emitAuthChanged()
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  emitAuthChanged()
}

export function isAuthenticated(): boolean {
  const token = getToken()
  return !!token && !isTokenNearExpiry(token, 0)
}

export function getUsuario() {
  const token = getToken()
  if (!token) {
    return null
  }

  const payload = getTokenInfo(token)
  if (!payload) {
    return null
  }

  return {
    id: Number(payload.sub),
    name: payload.name,
    email: payload.email,
  }
}

export function logout(): void {
  clearStoredAuth()
}

export async function renovarToken(): Promise<boolean> {
  return false
}

export function hasAuthCookies(): boolean {
  return isAuthenticated()
}

export function clearAuthCookies(): void {
  clearStoredAuth()
}

export function isTokenNearExpiry(token: string, thresholdMs = 5 * 60 * 1000): boolean {
  try {
    const payload = getTokenInfo(token)
    if (!payload?.exp) {
      return true
    }

    const expiration = new Date(payload.exp).getTime()
    return expiration - Date.now() < thresholdMs
  } catch {
    return true
  }
}

export function getTokenInfo(token: string): any {
  try {
    const [, base64Payload] = token.split('.')
    const payloadString = decodeBase64UTF8(base64Payload)
    const payload = JSON.parse(payloadString) as Record<string, unknown>

    return {
      ...payload,
      sub: payload.sub,
      usuarioId: payload.sub,
      tipoUsuario: 'user',
      nomeCompleto: payload.name,
      permissao: 1,
      cpf: null,
      sistemaId: null,
      permissaoNome: 'user',
      exp: typeof payload.exp === 'number' ? new Date(payload.exp * 1000) : null,
      iss: payload.iss,
      aud: payload.aud,
      name: payload.name,
      email: payload.email,
    }
  } catch {
    return null
  }
}
