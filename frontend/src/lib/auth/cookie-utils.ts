// Utilitário para gerenciar cookies de forma segura

interface CookieOptions {
  expires?: Date
  maxAge?: number
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  httpOnly?: boolean
}

export const cookieUtils = {
  // Define um cookie
  setCookie(name: string, value: string, options: CookieOptions = {}): void {
    const {
      expires,
      maxAge,
      path = '/',
      domain,
      secure = false,
      sameSite = 'lax',
    } = options

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

    if (expires) {
      cookieString += `; Expires=${expires.toUTCString()}`
    }

    if (maxAge) {
      cookieString += `; Max-Age=${maxAge}`
    }

    if (path) {
      cookieString += `; Path=${path}`
    }

    if (domain) {
      cookieString += `; Domain=${domain}`
    }

    if (secure) {
      cookieString += '; Secure'
    }

    cookieString += `; SameSite=${sameSite}`

    document.cookie = cookieString
  },

  // Obtém o valor de um cookie
  getCookie(name: string): string | null {
    const nameEQ = `${encodeURIComponent(name)}=`
    const cookies = document.cookie.split(';')

    for (const cookieItem of cookies) {
      let cookie = cookieItem
      while (cookie.startsWith(' ')) {
        cookie = cookie.substring(1, cookie.length)
      }
      if (cookie.startsWith(nameEQ)) {
        return decodeURIComponent(
          cookie.substring(nameEQ.length, cookie.length),
        )
      }
    }
    return null
  },

  // Remove um cookie
  removeCookie(name: string, options: CookieOptions = {}): void {
    const { path = '/', domain } = options

    // Define o cookie com data de expiração no passado
    const expires = new Date(0)

    this.setCookie(name, '', {
      ...options,
      expires,
      maxAge: 0,
      path,
      domain,
    })
  },

  // Verifica se um cookie existe
  hasCookie(name: string): boolean {
    return this.getCookie(name) !== null
  },

  // Obtém todos os cookies como objeto
  getAllCookies(): Record<string, string> {
    const cookies: Record<string, string> = {}
    const cookieArray = document.cookie.split(';')

    for (const rawCookie of cookieArray) {
      const [name, value] = rawCookie.trim().split('=')
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value)
      }
    }

    return cookies
  },

  // Valida se um cookie é válido (não expirado)
  isCookieValid(name: string): boolean {
    const cookie = this.getCookie(name)
    if (!cookie) return false

    // Verifica se o cookie tem um formato válido (JWT tem 3 partes)
    if (name.includes('token') && cookie.split('.').length !== 3) {
      return false
    }

    return true
  },
}

// Configurações específicas para tokens de autenticação
export const authCookieConfig = {
  token: {
    path: '/',
    secure: false,
    sameSite: 'lax' as const,
    maxAge: 2 * 60 * 60, // 2 horas (JWT token)
  },
  refreshToken: {
    path: '/',
    secure: false,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 dias (Refresh token)
  },
}
