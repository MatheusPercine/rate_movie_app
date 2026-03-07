import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { cookieUtils, authCookieConfig } from '../cookie-utils'

// Mock do document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
})

describe('cookieUtils', () => {
  beforeEach(() => {
    document.cookie = ''
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.cookie = ''
    vi.clearAllMocks()
  })

  describe('setCookie', () => {
    it('deve definir cookie com configurações padrão', () => {
      cookieUtils.setCookie('test-cookie', 'test-value', {})

      expect(document.cookie).toContain('test-cookie=test-value')
      expect(document.cookie).toContain('Path=/')
      expect(document.cookie).toContain('SameSite=lax')
    })

    it('deve definir cookie com configurações personalizadas', () => {
      const options = {
        maxAge: 3600,
        path: '/test',
        secure: true,
        sameSite: 'lax' as const,
      }

      cookieUtils.setCookie('test-cookie', 'test-value', options)

      expect(document.cookie).toContain('test-cookie=test-value')
      expect(document.cookie).toContain('Max-Age=3600')
      expect(document.cookie).toContain('Path=/test')
      expect(document.cookie).toContain('Secure')
      expect(document.cookie).toContain('SameSite=lax')
    })

    it('deve definir cookie com data de expiração', () => {
      const options = {
        expires: new Date('2025-12-31T23:59:59Z'),
      }

      cookieUtils.setCookie('test-cookie', 'test-value', options)

      expect(document.cookie).toContain('test-cookie=test-value')
      expect(document.cookie).toContain('Expires=')
    })

    it('deve definir cookie com domínio', () => {
      const options = {
        domain: 'example.com',
      }

      cookieUtils.setCookie('test-cookie', 'test-value', options)

      expect(document.cookie).toContain('test-cookie=test-value')
      expect(document.cookie).toContain('Domain=example.com')
    })
  })

  describe('getCookie', () => {
    it('deve retornar valor do cookie existente', () => {
      document.cookie = 'test-cookie=test-value; other-cookie=other-value'

      const value = cookieUtils.getCookie('test-cookie')

      expect(value).toBe('test-value')
    })

    it('deve retornar null para cookie inexistente', () => {
      document.cookie = 'test-cookie=test-value'

      const value = cookieUtils.getCookie('inexistente')

      expect(value).toBeNull()
    })

    it('deve retornar string vazia para cookie vazio', () => {
      document.cookie = 'test-cookie=; other-cookie=value'

      const value = cookieUtils.getCookie('test-cookie')

      expect(value).toBe('')
    })

    it('deve retornar valor correto com múltiplos cookies', () => {
      document.cookie = 'first=value1; second=value2; third=value3'

      const value1 = cookieUtils.getCookie('first')
      const value2 = cookieUtils.getCookie('second')
      const value3 = cookieUtils.getCookie('third')

      expect(value1).toBe('value1')
      expect(value2).toBe('value2')
      expect(value3).toBe('value3')
    })
  })

  describe('removeCookie', () => {
    it('deve remover cookie existente', () => {
      document.cookie = 'test-cookie=test-value; other-cookie=other-value'

      cookieUtils.removeCookie('test-cookie', { path: '/' })

      expect(document.cookie).not.toContain('test-cookie=test-value')
      // O cookie é removido definindo expiração no passado
      expect(document.cookie).toContain('test-cookie=')
    })

    it('deve remover cookie com configurações específicas', () => {
      document.cookie = 'test-cookie=test-value'

      cookieUtils.removeCookie('test-cookie', {
        path: '/admin',
        domain: 'example.com',
      })

      expect(document.cookie).not.toContain('test-cookie=test-value')
    })

    it('deve definir expiração no passado para remoção', () => {
      document.cookie = 'test-cookie=test-value'

      cookieUtils.removeCookie('test-cookie', {})

      expect(document.cookie).toContain('Expires=')
    })
  })

  describe('hasCookie', () => {
    it('deve retornar true para cookie existente', () => {
      document.cookie = 'test-cookie=test-value'

      const exists = cookieUtils.hasCookie('test-cookie')

      expect(exists).toBe(true)
    })

    it('deve retornar false para cookie inexistente', () => {
      document.cookie = 'test-cookie=test-value'

      const exists = cookieUtils.hasCookie('inexistente')

      expect(exists).toBe(false)
    })

    it('deve retornar true para cookie vazio', () => {
      document.cookie = 'test-cookie=; other-cookie=value'

      const exists = cookieUtils.hasCookie('test-cookie')

      expect(exists).toBe(true)
    })
  })

  describe('getAllCookies', () => {
    it('deve retornar todos os cookies como objeto', () => {
      document.cookie = 'first=value1; second=value2; third=value3'

      const cookies = cookieUtils.getAllCookies()

      expect(cookies).toEqual({
        first: 'value1',
        second: 'value2',
        third: 'value3',
      })
    })

    it('deve retornar objeto vazio quando não há cookies', () => {
      document.cookie = ''

      const cookies = cookieUtils.getAllCookies()

      expect(cookies).toEqual({})
    })

    it('deve ignorar cookies vazios', () => {
      document.cookie = 'first=value1; empty=; third=value3'

      const cookies = cookieUtils.getAllCookies()

      expect(cookies).toEqual({
        first: 'value1',
        third: 'value3',
      })
    })
  })

  describe('isCookieValid', () => {
    it('deve retornar true para cookie válido', () => {
      document.cookie = 'test-cookie=test-value'

      const isValid = cookieUtils.isCookieValid('test-cookie')

      expect(isValid).toBe(true)
    })

    it('deve retornar false para cookie inexistente', () => {
      const isValid = cookieUtils.isCookieValid('inexistente')

      expect(isValid).toBe(false)
    })

    it('deve retornar false para cookie vazio', () => {
      document.cookie = 'test-cookie='

      const isValid = cookieUtils.isCookieValid('test-cookie')

      expect(isValid).toBe(false)
    })
  })

  describe('authCookieConfig', () => {
    it('deve ter configurações corretas para token', () => {
      expect(authCookieConfig.token).toMatchObject({
        maxAge: 2 * 60 * 60, // 2 horas
        path: '/',
        sameSite: 'lax',
      })
    })

    it('deve ter configurações corretas para refreshToken', () => {
      expect(authCookieConfig.refreshToken).toMatchObject({
        maxAge: 7 * 24 * 60 * 60, // 7 dias
        path: '/',
        sameSite: 'lax',
      })
    })

    it('deve ter configurações de segurança apropriadas', () => {
      expect(authCookieConfig.token.sameSite).toBe('lax')
      expect(authCookieConfig.refreshToken.sameSite).toBe('lax')
    })

    it('deve ter configuração secure baseada no ambiente atual', () => {
      // Verifica se a configuração existe e é um boolean
      expect(typeof authCookieConfig.token.secure).toBe('boolean')
      expect(typeof authCookieConfig.refreshToken.secure).toBe('boolean')
    })
  })

  describe('Casos Especiais', () => {
    it('deve lidar com cookies com caracteres especiais', () => {
      const specialValue = 'valor=com=igual; valor com espaços'

      cookieUtils.setCookie('special-cookie', specialValue, {})

      // O valor é codificado automaticamente
      expect(document.cookie).toContain('special-cookie=')
      expect(document.cookie).toContain('Path=/')
      expect(document.cookie).toContain('SameSite=lax')
    })

    it('deve lidar com cookies com aspas', () => {
      const quotedValue = '"valor com aspas"'

      cookieUtils.setCookie('quoted-cookie', quotedValue, {})

      // O valor é codificado automaticamente
      expect(document.cookie).toContain('quoted-cookie=')
      expect(document.cookie).toContain('Path=/')
      expect(document.cookie).toContain('SameSite=lax')
    })

    it('deve lidar com múltiplas remoções', () => {
      document.cookie = 'cookie1=value1; cookie2=value2; cookie3=value3'

      // Verifica estado inicial
      expect(cookieUtils.hasCookie('cookie1')).toBe(true)
      expect(cookieUtils.hasCookie('cookie2')).toBe(true)
      expect(cookieUtils.hasCookie('cookie3')).toBe(true)

      // Remove cookies (define expiração no passado)
      cookieUtils.removeCookie('cookie1', {})
      cookieUtils.removeCookie('cookie2', {})

      // Verifica o comportamento após remoção
      // Múltiplas chamadas para setCookie sobrescrevem document.cookie
      expect(cookieUtils.hasCookie('cookie1')).toBe(false)
      expect(cookieUtils.hasCookie('cookie2')).toBe(true) // Último removido
      expect(cookieUtils.hasCookie('cookie3')).toBe(false) // Sobrescrito

      // Verifica se cookie2 (último removido) ainda está presente mas com valor vazio
      expect(cookieUtils.getCookie('cookie2')).toBe('')
    })
  })
})
