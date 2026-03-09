import { create } from 'zustand'

import { createServiceLogger } from '@/lib/logger'
import type { Usuario } from '@/types/auth'
import type { SolicitanteResponse } from '@/types/solicitante'

import { authService } from './auth-service'
import { getTokenInfo } from './auth'
import { cookieUtils, authCookieConfig } from './cookie-utils'

export interface AuthState {
  // Estado
  usuario: Usuario | null
  estaAutenticado: boolean
  carregando: boolean
  erro: string | null
  solicitante: SolicitanteResponse | null

  // Ações
  login: (email: string, senha: string) => Promise<boolean>
  confirmarCodigo2FA: (email: string, codigo: string) => Promise<boolean>
  trocarSenha: (
    email: string,
    novaSenha: string,
    tokenTrocaSenha?: string,
  ) => Promise<boolean>
  esqueciSenha: (email: string) => Promise<boolean>
  logout: () => void
  logoutTodasSessoes: () => Promise<void>
  renovarToken: () => Promise<boolean>
  verificarAutenticacao: () => Promise<void>
  limparErro: () => void
  setSolicitante: (s: SolicitanteResponse | null) => void
}

// Validadores de tokens
const isJWT = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false
  const partes = token.split('.')
  return partes.length === 3 && partes.every((part) => part.length > 0)
}

// Refresh tokens podem ser opacos (qualquer string controlada pelo servidor)
const validarRefreshToken = (token: string | undefined | null): token is string => {
  if (!token || typeof token !== 'string') return false
  return token.trim().length > 0
}

// Access token deve ser JWT
const validarAccessToken = (token: string | undefined | null): boolean => {
  if (!token || typeof token !== 'string') return false
  return isJWT(token)
}

const authLogger = createServiceLogger('auth-store')

const sanitizeMensagem = (
  mensagem: string | null | undefined,
  fallback: string,
): string => {
  if (typeof mensagem !== 'string') {
    return fallback
  }

  const mensagemNormalizada = mensagem.trim()
  return mensagemNormalizada.length > 0 ? mensagemNormalizada : fallback
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      // Estado inicial
      usuario: null,
      estaAutenticado: false,
      carregando: false,
      erro: null,
      solicitante: null,

      // Login - Primeira etapa (envia código 2FA)
      login: async (email: string, senha: string) => {
        try {
          set({ carregando: true, erro: null })

          const resultado = await authService.login(email, senha)

          if (resultado.sucesso) {
            // Salva email para próxima etapa - SEMPRE vai para 2FA
            sessionStorage.setItem('auth_email', email)
            set({ carregando: false })
            return true
          } else {
            set({
              carregando: false,
              erro: resultado.mensagem ?? 'Erro no login',
            })
            return false
          }
        } catch (erro) {
          set({
            carregando: false,
            erro:
              erro instanceof Error ? erro.message : 'Erro inesperado no login',
          })
          return false
        }
      },

      // Confirmação do código 2FA - Segunda etapa
      confirmarCodigo2FA: async (email: string, codigo: string) => {
        try {
          set({ carregando: true, erro: null })

          const resultado = await authService.confirmarCodigo2FA(email, codigo)

          // Se a API indica que precisa trocar senha, mesmo com 200 OK, trata como sucesso para redirecionamento
          if (resultado.dados?.precisaTrocarSenha) {
            sessionStorage.setItem('auth_email', email)
            sessionStorage.setItem(
              'tokenTrocaSenha',
              resultado.dados.tokenTrocaSenha ?? '',
            )
            sessionStorage.setItem('auth_context', 'password_reset')
            set({ carregando: false, erro: null })
            window.location.href = '/auth/trocar-senha'
            return false
          }

          // Se a API indica que senha expirou (dados.senhaExpirada: true)
          if (resultado.dados?.senhaExpirada) {
            sessionStorage.setItem('auth_email', email)
            sessionStorage.setItem(
              'tokenTrocaSenha',
              resultado.dados.tokenTrocaSenha ?? '',
            )
            sessionStorage.setItem('auth_context', 'password_expired')
            set({ carregando: false, erro: null })
            window.location.href = '/auth/trocar-senha'
            return false
          }

          // Se não precisa trocar senha, verifica o sucesso normal
          if (resultado.sucesso) {
            // Login bem-sucedido - salva tokens nos cookies
            if (resultado.dados) {
              const { token, refreshToken, usuario } = resultado.dados

              // Valida tokens antes de salvar
              if (validarAccessToken(token) && validarRefreshToken(refreshToken)) {
                // Salva tokens nos cookies com configurações de segurança
                cookieUtils.setCookie(
                  'auth_token',
                  token,
                  authCookieConfig.token,
                )
                cookieUtils.setCookie(
                  'auth_refresh_token',
                  refreshToken,
                  authCookieConfig.refreshToken,
                )

                set({
                  usuario,
                  estaAutenticado: true,
                  carregando: false,
                  erro: null,
                })
              } else {
                set({
                  carregando: false,
                  erro: 'Tokens inválidos recebidos do servidor',
                })
                return false
              }
            }

            // Limpa dados temporários
            sessionStorage.removeItem('auth_email')
            sessionStorage.removeItem('tokenTrocaSenha')

            return true
          } else {
            // Se não foi sucesso e não precisa trocar senha, define o erro
            set({
              carregando: false,
              erro: resultado.mensagem ?? 'Erro ao confirmar código 2FA.',
            })
            return false
          }
        } catch (erro) {
          set({
            carregando: false,
            erro: erro instanceof Error ? erro.message : 'Erro na verificação',
          })
          return false
        }
      },

      // Troca de senha
      trocarSenha: async (
        email: string,
        novaSenha: string,
        tokenTrocaSenha?: string,
      ) => {
        try {
          set({ carregando: true, erro: null })

          const resultado = await authService.trocarSenha(
            email,
            novaSenha,
            tokenTrocaSenha,
            import.meta.env.VITE_SYSTEM_ID as string,
          )

          if (resultado.sucesso) {
            const { token, refreshToken, usuario } = resultado.dados

            // Valida tokens antes de salvar
            const tokenValido = validarAccessToken(token)
            const refreshTokenValido = validarRefreshToken(refreshToken)

            if (tokenValido && refreshTokenValido) {
              // Salva tokens nos cookies com configurações de segurança
              cookieUtils.setCookie('auth_token', token, authCookieConfig.token)
              cookieUtils.setCookie(
                'auth_refresh_token',
                refreshToken,
                authCookieConfig.refreshToken,
              )

              set({
                usuario,
                estaAutenticado: true,
                carregando: false,
                erro: null,
              })

              // Limpa dados temporários
              sessionStorage.removeItem('auth_email')
              sessionStorage.removeItem('tokenTrocaSenha')

              return true
            } else {
              set({
                carregando: false,
                erro: 'Formato de tokens inválido recebido do servidor',
              })
              return false
            }
          } else {
            const mensagemErro = sanitizeMensagem(
              resultado.mensagem,
              'Erro ao trocar senha',
            )
            set({
              carregando: false,
              erro: mensagemErro,
            })
            return false
          }
        } catch (erro) {
          set({
            carregando: false,
            erro: erro instanceof Error ? erro.message : 'Erro ao trocar senha',
          })
          return false
        }
      },

      // Esqueci a senha
      esqueciSenha: async (email: string) => {
        try {
          set({ carregando: true, erro: null })

          const resultado = await authService.esqueciSenha(email)

          if (resultado.sucesso) {
            sessionStorage.setItem('auth_email', email)
            set({ carregando: false })
            return true
          } else {
            const mensagemErro = sanitizeMensagem(
              resultado.mensagem,
              'Erro ao solicitar recuperação',
            )
            set({
              carregando: false,
              erro: mensagemErro,
            })
            return false
          }
        } catch (erro) {
          set({
            carregando: false,
            erro:
              erro instanceof Error
                ? erro.message
                : 'Erro ao solicitar recuperação',
          })
          return false
        }
      },

      // Logout
      logout: () => {
        const refreshToken = cookieUtils.getCookie('auth_refresh_token')

        // Invalida token no servidor (não bloqueia UI)
        if (refreshToken && validarRefreshToken(refreshToken)) {
          authService.logout(refreshToken).catch((erro) => {
            authLogger.warn(
              { action: 'logout', scope: 'single-session' },
              erro instanceof Error
                ? erro.message
                : 'Erro desconhecido ao encerrar sessão',
            )
          })
        }

        // Remove tokens dos cookies
        cookieUtils.removeCookie('auth_token', authCookieConfig.token)
        cookieUtils.removeCookie(
          'auth_refresh_token',
          authCookieConfig.refreshToken,
        )

        set({
          usuario: null,
          estaAutenticado: false,
          carregando: false,
          erro: null,
          solicitante: null,
        })

        // Limpa dados da sessão
        sessionStorage.clear()

        // Remove dados antigos do localStorage (se existirem)
        localStorage.removeItem('auth-storage')
      },

      // Logout de todas as sessões
      logoutTodasSessoes: async () => {
        try {
          const refreshToken = cookieUtils.getCookie('auth_refresh_token')

          if (refreshToken && validarRefreshToken(refreshToken)) {
            await authService.logoutTodasSessoes(refreshToken)
          }

          // Remove tokens dos cookies
          cookieUtils.removeCookie('auth_token', authCookieConfig.token)
          cookieUtils.removeCookie(
            'auth_refresh_token',
            authCookieConfig.refreshToken,
          )

          set({
            usuario: null,
            estaAutenticado: false,
            carregando: false,
            erro: null,
            solicitante: null,
          })

          sessionStorage.clear()

          // Remove dados antigos do localStorage (se existirem)
          localStorage.removeItem('auth-storage')
        } catch (erro) {
          authLogger.warn(
            { action: 'logout', scope: 'all-sessions' },
            erro instanceof Error
              ? erro.message
              : 'Erro desconhecido ao encerrar todas as sessões',
          )
        }
      },

      // Renovação de token
      renovarToken: async () => {
        try {
          const refreshToken = cookieUtils.getCookie('auth_refresh_token')

          if (!validarRefreshToken(refreshToken)) {
            authLogger.warn(
              { action: 'renovar-token', status: 'invalid-refresh-token' },
              'Refresh token ausente ou inválido',
            )
            return false
          }

          authLogger.info(
            { action: 'renovar-token', status: 'requesting' },
            'Solicitando renovação de token',
          )

          let sistemaId = import.meta.env.VITE_SYSTEM_ID as string | undefined

          if (!sistemaId) {
            const tokenAtual = cookieUtils.getCookie('auth_token')
            const info = tokenAtual ? getTokenInfo(tokenAtual) : null
            if (info?.sistemaId) {
              sistemaId = info.sistemaId
            }
          }

          const resultado = await authService.renovarToken(refreshToken, sistemaId)

          if (resultado.sucesso) {
            const {
              token,
              refreshToken: newRefreshToken,
              usuario,
            } = resultado.dados

            // Valida novos tokens antes de salvar
            if (validarAccessToken(token) && validarRefreshToken(newRefreshToken)) {
              // Atualiza tokens nos cookies
              cookieUtils.setCookie('auth_token', token, authCookieConfig.token)
              cookieUtils.setCookie(
                'auth_refresh_token',
                newRefreshToken,
                authCookieConfig.refreshToken,
              )

              set({
                usuario,
                estaAutenticado: true,
              })

              authLogger.info(
                { action: 'renovar-token', status: 'success' },
                'Token renovado com sucesso',
              )
              return true
            } else {
              authLogger.error(
                { action: 'renovar-token', status: 'invalid-tokens' },
                'Tokens recebidos são inválidos',
              )
              return false
            }
          } else {
            // Token inválido, faz logout
            const mensagemErro = sanitizeMensagem(
              resultado.mensagem,
              'Falha na renovação do token',
            )
            authLogger.warn(
              { action: 'renovar-token', status: 'failed' },
              mensagemErro,
            )
            get().logout()
            return false
          }
        } catch (erro) {
          authLogger.error(
            { action: 'renovar-token', status: 'error' },
            erro instanceof Error ? erro.message : 'Erro desconhecido na renovação',
          )
          get().logout()
          return false
        }
      },

      // Verificação inicial de autenticação
      verificarAutenticacao: async () => {
        try {
          const token = cookieUtils.getCookie('auth_token')
          const refreshToken = cookieUtils.getCookie('auth_refresh_token')

          if (!validarAccessToken(token) || !validarRefreshToken(refreshToken)) {
            authLogger.info(
              { action: 'verificar-autenticacao', status: 'no-cookies' },
              'Cookies de autenticação ausentes ou inválidos',
            )
            set({ carregando: false, estaAutenticado: false })
            return
          }

          authLogger.info(
            { action: 'verificar-autenticacao', status: 'checking' },
            'Verificando token de acesso',
          )

          // Verifica se o token ainda é válido
          const resultado = await authService.verificarAcesso()

          if (resultado.sucesso) {
            authLogger.info(
              { action: 'verificar-autenticacao', status: 'valid' },
              'Token de acesso válido',
            )
            set({ estaAutenticado: true, carregando: false })
          } else {
            // Tenta renovar o token
            authLogger.info(
              { action: 'verificar-autenticacao', status: 'expired' },
              'Token expirado, tentando renovar',
            )
            const renovado = await get().renovarToken()
            if (!renovado) {
              authLogger.warn(
                { action: 'verificar-autenticacao', status: 'renewal-failed' },
                'Falha na renovação, usuário será desconectado',
              )
              set({ estaAutenticado: false, carregando: false })
            }
          }
        } catch (erro) {
          authLogger.error(
            { action: 'verificar-autenticacao', status: 'error' },
            erro instanceof Error ? erro.message : 'Erro desconhecido na verificação',
          )
          set({ estaAutenticado: false, carregando: false })
        }
      },

      // Limpar erro
      limparErro: () => set({ erro: null }),

      // Definir/limpar solicitante associado ao usuário logado
      setSolicitante: (s: SolicitanteResponse | null) => set({ solicitante: s }),
    }))
