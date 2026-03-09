import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import type { AuthenticatedUser, LoginCredentials, RegisterPayload } from '@/types/auth'

import { getCurrentUser, login as loginRequest, register as registerRequest } from '@/services/auth'

import { clearStoredAuth, getAuthChangedEventName, getToken, setToken } from './auth'

interface AuthContextValue {
  usuario: AuthenticatedUser | null
  estaAutenticado: boolean
  carregando: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient()

  const [usuario, setUsuario] = useState<AuthenticatedUser | null>(null)
  const [carregando, setCarregando] = useState(true)

  const syncFromToken = useCallback(async () => {
    const token = getToken()

    if (!token) {
      setUsuario(null)
      setCarregando(false)
      return
    }

    try {
      setCarregando(true)
      const currentUser = await getCurrentUser()
      setUsuario(currentUser)
    } catch {
      clearStoredAuth()
      setUsuario(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void syncFromToken()

    const handleAuthChange = () => {
      void syncFromToken()
    }

    const eventName = getAuthChangedEventName()
    window.addEventListener(eventName, handleAuthChange)
    window.addEventListener('storage', handleAuthChange)

    return () => {
      window.removeEventListener(eventName, handleAuthChange)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [syncFromToken])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginRequest(credentials)
    setToken(response.token)
    setUsuario(response.user)
    await queryClient.invalidateQueries()
  }, [queryClient])

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerRequest(payload)
    setToken(response.token)
    setUsuario(response.user)
    await queryClient.invalidateQueries()
  }, [queryClient])

  const logout = useCallback(() => {
    clearStoredAuth()
    setUsuario(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(() => ({
    usuario,
    estaAutenticado: !!usuario,
    carregando,
    login,
    register,
    logout,
    refreshUser: syncFromToken,
  }), [carregando, login, logout, register, syncFromToken, usuario])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook para acessar o contexto de autenticação
 *
 * @returns Objeto com usuario, estaAutenticado e carregando
 * @throws Error se usado fora do AuthProvider
 *
 * @example
 * ```tsx
 * const { usuario, estaAutenticado, carregando } = useAuth()
 * ```
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }

  return context
}
