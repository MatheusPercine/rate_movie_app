import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { authService } from '../auth-service'
import { useAuthStore } from '../auth-store'
import { cookieUtils } from '../cookie-utils'

// Mocks
vi.mock('../auth-service', () => ({
  authService: {
    login: vi.fn(),
    confirmarCodigo2FA: vi.fn(),
    trocarSenha: vi.fn(),
    esqueciSenha: vi.fn(),
    logout: vi.fn(),
    logoutTodasSessoes: vi.fn(),
    renovarToken: vi.fn(),
    verificarAcesso: vi.fn(),
  },
}))

vi.mock('../cookie-utils', () => ({
  cookieUtils: {
    setCookie: vi.fn(),
    getCookie: vi.fn(),
    removeCookie: vi.fn(),
  },
  authCookieConfig: {
    token: { expires: 7, secure: true, sameSite: 'strict' as const },
    refreshToken: { expires: 30, secure: true, sameSite: 'strict' as const },
  },
}))

// Mock do window.location
const mockLocation = {
  href: '',
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn(),
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock do sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
})

// Mock do console.log para evitar logs nos testes
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Type helpers for mocked functions
const mockedAuthService = vi.mocked(authService)
const mockedCookieUtils = vi.mocked(cookieUtils)
// Already mocked objects don't need vi.mocked() wrapper
const mockedSessionStorage = mockSessionStorage
const mockedLocation = mockLocation

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedLocation.href = ''

    // Mock padr�o para cookies
    mockedCookieUtils.getCookie.mockReturnValue(null)
  })

  afterEach(() => {
    // Reset store para estado inicial
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
  })

  describe('Estado inicial', () => {
    it('deve ter estado inicial correto', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.usuario).toBeNull()
      expect(result.current.estaAutenticado).toBe(false)
      expect(result.current.carregando).toBe(false)
      expect(result.current.erro).toBeNull()
    })
  })

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.login.mockResolvedValue({
        sucesso: true,
        mensagem: 'C�digo enviado',
      })

      let loginResult: boolean
      await act(async () => {
        loginResult = await result.current.login(
          'test@email.com',
          'password123',
        )
      })

      expect(loginResult!).toBe(true)
      expect(mockedSessionStorage.setItem).toHaveBeenCalledWith(
        'auth_email',
        'test@email.com',
      )
      expect(result.current.carregando).toBe(false)
      expect(result.current.erro).toBeNull()
    })

    it('deve lidar com erro no login', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.login.mockResolvedValue({
        sucesso: false,
        mensagem: 'Credenciais inv�lidas',
      })

      let loginResult: boolean
      await act(async () => {
        loginResult = await result.current.login(
          'test@email.com',
          'wrongpassword',
        )
      })

      expect(loginResult!).toBe(false)
      expect(result.current.carregando).toBe(false)
      expect(result.current.erro).toBe('Credenciais inv�lidas')
    })

    it('deve lidar com exce��o no login', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.login.mockRejectedValue(new Error('Erro de rede'))

      let loginResult: boolean
      await act(async () => {
        loginResult = await result.current.login(
          'test@email.com',
          'password123',
        )
      })

      expect(loginResult!).toBe(false)
      expect(result.current.carregando).toBe(false)
      expect(result.current.erro).toBe('Erro de rede')
    })
  })

  describe('confirmarCodigo2FA', () => {
    const mockUsuario = { id: 1, email: 'test@email.com', nome: 'Test User' }
    const mockToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const mockRefreshToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

    it('deve confirmar c�digo 2FA com sucesso', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.confirmarCodigo2FA.mockResolvedValue({
        sucesso: true,
        dados: {
          token: mockToken,
          refreshToken: mockRefreshToken,
          usuario: mockUsuario,
        },
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.confirmarCodigo2FA(
          'test@email.com',
          '123456',
        )
      })

      expect(resultado!).toBe(true)
      expect(mockedCookieUtils.setCookie).toHaveBeenCalledWith(
        'auth_token',
        mockToken,
        expect.any(Object),
      )
      expect(mockedCookieUtils.setCookie).toHaveBeenCalledWith(
        'auth_refresh_token',
        mockRefreshToken,
        expect.any(Object),
      )
      expect(result.current.usuario).toEqual(mockUsuario)
      expect(result.current.estaAutenticado).toBe(true)
      expect(mockedSessionStorage.removeItem).toHaveBeenCalledWith('auth_email')
    })

    it('deve lidar com necessidade de trocar senha', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.confirmarCodigo2FA.mockResolvedValue({
        sucesso: true,
        dados: {
          token: 'mock_token',
          refreshToken: 'mock_refresh_token',
          usuario: mockUsuario,
          precisaTrocarSenha: true,
          tokenTrocaSenha: 'token_troca_senha_123',
        },
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.confirmarCodigo2FA(
          'test@email.com',
          '123456',
        )
      })

      expect(resultado!).toBe(false) // Retorna false pois ainda precisa trocar senha
      expect(mockedSessionStorage.setItem).toHaveBeenCalledWith(
        'tokenTrocaSenha',
        'token_troca_senha_123',
      )
      expect(mockedSessionStorage.setItem).toHaveBeenCalledWith(
        'auth_context',
        'password_reset',
      )
      expect(mockedLocation.href).toBe('/auth/trocar-senha')
    })

    it('deve lidar com senha expirada', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.confirmarCodigo2FA.mockResolvedValue({
        sucesso: true,
        dados: {
          token: 'mock_token',
          refreshToken: 'mock_refresh_token',
          usuario: mockUsuario,
          senhaExpirada: true,
          tokenTrocaSenha: 'token_senha_expirada_456',
          mensagem: 'Senha expirada detectada. Confirmação de código realizada. Prossiga com a redefinição da senha.',
        },
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.confirmarCodigo2FA(
          'test@email.com',
          '123456',
        )
      })

      expect(resultado!).toBe(false) // Retorna false pois senha expirada
      expect(mockedSessionStorage.setItem).toHaveBeenCalledWith(
        'tokenTrocaSenha',
        'token_senha_expirada_456',
      )
      expect(mockedSessionStorage.setItem).toHaveBeenCalledWith(
        'auth_context',
        'password_expired',
      )
      expect(mockedLocation.href).toBe('/auth/trocar-senha')
    })

    it('deve lidar com tokens inv�lidos', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.confirmarCodigo2FA.mockResolvedValue({
        sucesso: true,
        dados: {
          token: 'token_invalido',
          refreshToken: 'refresh_invalido',
          usuario: { id: 1, email: 'test@email.com', nome: 'Test' },
        },
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.confirmarCodigo2FA(
          'test@email.com',
          '123456',
        )
      })

      expect(resultado!).toBe(false)
      expect(result.current.erro).toBe('Tokens inválidos recebidos do servidor')
    })

    it('deve lidar com erro na confirma��o', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.confirmarCodigo2FA.mockResolvedValue({
        sucesso: false,
        mensagem: 'C�digo inv�lido',
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.confirmarCodigo2FA(
          'test@email.com',
          '123456',
        )
      })

      expect(resultado!).toBe(false)
      expect(result.current.erro).toBe('C�digo inv�lido')
    })
  })

  describe('trocarSenha', () => {
    it('deve trocar senha com sucesso', async () => {
      const { result } = renderHook(() => useAuthStore())

      const mockUsuario = { id: 1, email: 'test@email.com', nome: 'Test User' }
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const mockRefreshToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

      mockedAuthService.trocarSenha.mockResolvedValue({
        sucesso: true,
        dados: {
          token: mockToken,
          refreshToken: mockRefreshToken,
          usuario: mockUsuario,
        },
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.trocarSenha(
          'test@email.com',
          'novaSenha123',
          'tokenTroca',
        )
      })

      expect(resultado!).toBe(true)
      expect(mockedCookieUtils.setCookie).toHaveBeenCalledWith(
        'auth_token',
        mockToken,
        expect.any(Object),
      )
      expect(mockedCookieUtils.setCookie).toHaveBeenCalledWith(
        'auth_refresh_token',
        mockRefreshToken,
        expect.any(Object),
      )
      expect(result.current.usuario).toEqual(mockUsuario)
      expect(result.current.estaAutenticado).toBe(true)
      expect(mockedSessionStorage.removeItem).toHaveBeenCalledWith('auth_email')
      expect(mockedSessionStorage.removeItem).toHaveBeenCalledWith(
        'tokenTrocaSenha',
      )
    })

    it('deve lidar com erro na troca de senha', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.trocarSenha.mockResolvedValue({
        sucesso: false,
        mensagem: 'Senha muito fraca',
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.trocarSenha(
          'test@email.com',
          'senha123',
        )
      })

      expect(resultado!).toBe(false)
      expect(result.current.erro).toBe('Senha muito fraca')
    })
  })

  describe('esqueciSenha', () => {
    it('deve solicitar recupera��o de senha com sucesso', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.esqueciSenha.mockResolvedValue({
        sucesso: true,
        mensagem: 'Email enviado',
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.esqueciSenha('test@email.com')
      })

      expect(resultado!).toBe(true)
      expect(mockedSessionStorage.setItem).toHaveBeenCalledWith(
        'auth_email',
        'test@email.com',
      )
      expect(result.current.carregando).toBe(false)
    })
  })

  describe('logout', () => {
    it('deve fazer logout corretamente', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Simular estado autenticado
      act(() => {
        result.current.usuario = {
          id: 1,
          email: 'test@email.com',
          nome: 'Test',
        }
        result.current.estaAutenticado = true
      })

      const mockRefreshToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      mockedCookieUtils.getCookie.mockReturnValue(mockRefreshToken)
      mockedAuthService.logout.mockResolvedValue()

      act(() => {
        result.current.logout()
      })

      expect(mockedCookieUtils.removeCookie).toHaveBeenCalledWith(
        'auth_token',
        expect.any(Object),
      )
      expect(mockedCookieUtils.removeCookie).toHaveBeenCalledWith(
        'auth_refresh_token',
        expect.any(Object),
      )
      expect(result.current.usuario).toBeNull()
      expect(result.current.estaAutenticado).toBe(false)
      expect(mockedSessionStorage.clear).toHaveBeenCalled()
    })
  })

  describe('renovarToken', () => {
    it('deve renovar token com sucesso', async () => {
      const { result } = renderHook(() => useAuthStore())

      const mockRefreshToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const mockNovoToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const mockNovoRefreshToken =
        'novo_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const mockUsuario = { id: 1, email: 'test@email.com', nome: 'Test User' }

      mockedCookieUtils.getCookie.mockReturnValue(mockRefreshToken)
      mockedAuthService.renovarToken.mockResolvedValue({
        sucesso: true,
        dados: {
          token: mockNovoToken,
          refreshToken: mockNovoRefreshToken,
          usuario: mockUsuario,
        },
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.renovarToken()
      })

      expect(resultado!).toBe(true)
      expect(mockedCookieUtils.setCookie).toHaveBeenCalledWith(
        'auth_token',
        mockNovoToken,
        expect.any(Object),
      )
      expect(mockedCookieUtils.setCookie).toHaveBeenCalledWith(
        'auth_refresh_token',
        mockNovoRefreshToken,
        expect.any(Object),
      )
      expect(result.current.usuario).toEqual(mockUsuario)
      expect(result.current.estaAutenticado).toBe(true)
    })

    it('deve fazer logout quando renova��o falha', async () => {
      const { result } = renderHook(() => useAuthStore())

      const mockRefreshToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      mockedCookieUtils.getCookie.mockReturnValue(mockRefreshToken)
      mockedAuthService.renovarToken.mockResolvedValue({
        sucesso: false,
        mensagem: 'Token expirado',
      })

      // Simular estado autenticado inicial
      act(() => {
        result.current.estaAutenticado = true
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.renovarToken()
      })

      expect(resultado!).toBe(false)
      expect(result.current.estaAutenticado).toBe(false)
      expect(mockedCookieUtils.removeCookie).toHaveBeenCalled()
    })

    it('deve retornar false quando n�o h� refresh token', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedCookieUtils.getCookie.mockReturnValue(null)

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.renovarToken()
      })

      expect(resultado!).toBe(false)
    })
  })

  describe('verificarAutenticacao', () => {
    it('deve verificar autentica��o com tokens v�lidos', async () => {
      const { result } = renderHook(() => useAuthStore())

      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const mockRefreshToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

      mockedCookieUtils.getCookie
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(mockRefreshToken)

      mockedAuthService.verificarAcesso.mockResolvedValue({
        sucesso: true,
      })

      await act(async () => {
        await result.current.verificarAutenticacao()
      })

      expect(result.current.estaAutenticado).toBe(true)
      expect(result.current.carregando).toBe(false)
    })

    it('deve tentar renovar quando verifica��o falha', async () => {
      const { result } = renderHook(() => useAuthStore())

      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const mockRefreshToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

      mockedCookieUtils.getCookie
        .mockReturnValue(mockToken)
        .mockReturnValue(mockRefreshToken)

      mockedAuthService.verificarAcesso.mockResolvedValue({
        sucesso: false,
      })

      mockedAuthService.renovarToken.mockResolvedValue({
        sucesso: true,
        dados: {
          token: mockToken,
          refreshToken: mockRefreshToken,
          usuario: { id: 1, email: 'test@email.com', nome: 'Test' },
        },
      })

      await act(async () => {
        await result.current.verificarAutenticacao()
      })

      expect(mockedAuthService.renovarToken).toHaveBeenCalled()
    })

    it('deve marcar como n�o autenticado quando n�o h� tokens', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedCookieUtils.getCookie.mockReturnValue(null)

      await act(async () => {
        await result.current.verificarAutenticacao()
      })

      expect(result.current.estaAutenticado).toBe(false)
      expect(result.current.carregando).toBe(false)
    })
  })

  describe('limparErro', () => {
    it('deve limpar erro', () => {
      const { result } = renderHook(() => useAuthStore())

      // Simular erro
      act(() => {
        result.current.erro = 'Algum erro'
      })

      expect(result.current.erro).toBe('Algum erro')

      act(() => {
        result.current.limparErro()
      })

      expect(result.current.erro).toBeNull()
    })
  })

  describe('Valida��o de tokens', () => {
    it('deve validar tokens JWT corretamente', async () => {
      const { result } = renderHook(() => useAuthStore())

      const tokenJWTValido =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const tokenCriptografadoValido =
        'abcdef123456789012345678901234567890ABCDEF'

      mockedAuthService.confirmarCodigo2FA.mockResolvedValue({
        sucesso: true,
        dados: {
          token: tokenJWTValido,
          refreshToken: tokenCriptografadoValido,
          usuario: { id: 1, email: 'test@email.com', nome: 'Test' },
        },
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.confirmarCodigo2FA(
          'test@email.com',
          '123456',
        )
      })

      expect(resultado!).toBe(true)
      expect(result.current.estaAutenticado).toBe(true)
    })

    it('deve rejeitar tokens com formato inv�lido', async () => {
      const { result } = renderHook(() => useAuthStore())

      mockedAuthService.confirmarCodigo2FA.mockResolvedValue({
        sucesso: true,
        dados: {
          token: 'token.muito.curto',
          refreshToken: 'abc',
          usuario: { id: 1, email: 'test@email.com', nome: 'Test' },
        },
      })

      let resultado: boolean
      await act(async () => {
        resultado = await result.current.confirmarCodigo2FA(
          'test@email.com',
          '123456',
        )
      })

      expect(resultado!).toBe(false)
      expect(result.current.erro).toBe('Tokens inválidos recebidos do servidor')
    })
  })
})
