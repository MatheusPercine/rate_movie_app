import axios from 'axios'

import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UsuarioPermissaoSistemaRequest,
  UsuarioPermissaoSistemaResponse,
  BuscarPermissoesUsuarioSistemaResponse,
  ConfirmarCodigo2FARequest,
  ConfirmarCodigo2FAResponse,
  TrocarSenhaRequest,
  TrocarSenhaResponse,
  EsqueciSenhaRequest,
  EsqueciSenhaResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse,
  VerificarAcessoResponse,
  BuscarUsuariosResponse,
} from '@/types/auth'
import { Search } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL_AUTH as string

// Interface para erros da API
interface ApiError {
  response?: {
    data?: Record<string, unknown>
    status?: number
    statusText?: string
  }
  message?: string
}

// Configuração do axios para autenticação
const authApi = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authService = {
  // Registro de novo usuário
  async register(
    email: string,
    nomeCompleto: string,
    cpf: string,
  ): Promise<RegisterResponse> {
    const payload: RegisterRequest = {
      email,
      nomeCompleto,
      cpf,
    }

    try {
      const response = await authApi.post<RegisterResponse>('/Auth/register', payload)
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as RegisterResponse
      }
      throw new Error('Erro de conexão com o servidor')
    }
  },

  // Dar permissão ao usuário no sistema
  async darPermissaoSistema(
    usuarioId: string,
    sistemaId: string,
    permissaoId: number,
  ): Promise<UsuarioPermissaoSistemaResponse> {
    const payload: UsuarioPermissaoSistemaRequest = {
      usuarioId,
      sistemaId,
      permissaoId,
    }

    try {
      const response = await authApi.post<UsuarioPermissaoSistemaResponse>(
        '/usuario-permissao-sistema',
        payload,
      )
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as UsuarioPermissaoSistemaResponse
      }
      throw new Error('Erro ao dar permissão ao usuário')
    }
  },

  // Atualizar permissão do usuário no sistema (via ID da permissão)
  async atualizarPermissaoSistema(
    authPermId: string,
    payload: UsuarioPermissaoSistemaRequest,
  ): Promise<UsuarioPermissaoSistemaResponse> {
    try {
      const response = await authApi.put<UsuarioPermissaoSistemaResponse>(
        `/usuario-permissao-sistema/${authPermId}`,
        payload,
      )
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as UsuarioPermissaoSistemaResponse
      }
      throw new Error('Erro ao atualizar permissão do usuário')
    }
  },

  // Login - Primeira etapa (envia código 2FA)
  async login(email: string, senha: string): Promise<LoginResponse> {
    const payload: LoginRequest = {
      email,
      senha,
      sistemaId: import.meta.env.VITE_SYSTEM_ID as string,
    }

    try {
      const response = await authApi.post<LoginResponse>('/Auth/login', payload)
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as LoginResponse
      }
      throw new Error('Erro de conexão com o servidor')
    }
  },

  // Confirmação do código 2FA - Segunda etapa
  async confirmarCodigo2FA(
    email: string,
    codigo: string,
  ): Promise<ConfirmarCodigo2FAResponse> {
    const payload: ConfirmarCodigo2FARequest = { email, codigo, sistemaId: import.meta.env.VITE_SYSTEM_ID as string }

    try {
      const response = await authApi.post<ConfirmarCodigo2FAResponse>(
        '/Auth/confirmar-codigo-2fa',
        payload,
      )
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as ConfirmarCodigo2FAResponse
      }
      throw new Error('Erro de conexão com o servidor')
    }
  },

  // Troca de senha
  async trocarSenha(
    email: string,
    novaSenha: string,
    tokenTrocaSenha: string | undefined,
    sistemaId: string,
  ): Promise<TrocarSenhaResponse> {
    const payload: TrocarSenhaRequest = { email, novaSenha, tokenTrocaSenha, sistemaId }

    try {
      const response = await authApi.post<TrocarSenhaResponse>(
        '/Auth/trocar-senha',
        payload,
      )
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as TrocarSenhaResponse
      }
      throw new Error('Erro de conexão com o servidor')
    }
  },

  // Esqueci a senha
  async esqueciSenha(email: string): Promise<EsqueciSenhaResponse> {
    const payload: EsqueciSenhaRequest = { email,  }

    try {
      const response = await authApi.post<EsqueciSenhaResponse>(
        '/Auth/esqueci-senha',
        payload,
      )
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as EsqueciSenhaResponse
      }
      throw new Error('Erro de conexão com o servidor')
    }
  },

  // Renovação de token
  async renovarToken(refreshToken: string, sistemaId?: string): Promise<RefreshTokenResponse> {
    const payload: RefreshTokenRequest = { refreshToken, sistemaId }

    try {
      const response = await authApi.post<RefreshTokenResponse>(
        '/Auth/refresh-token',
        payload,
      )
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as RefreshTokenResponse
      }
      throw new Error('Erro de conexão com o servidor')
    }
  },

  // Logout
  async logout(refreshToken: string): Promise<LogoutResponse> {
    const payload: LogoutRequest = { refreshToken }

    try {
      const response = await authApi.post<LogoutResponse>('/Auth/logout', payload)
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as LogoutResponse
      }
      throw new Error('Erro de conexão com o servidor')
    }
  },

  // Logout de todas as sessões
  async logoutTodasSessoes(refreshToken: string): Promise<LogoutResponse> {
    const payload: LogoutRequest = { refreshToken }

    try {
      const response = await authApi.post<LogoutResponse>(
        '/Auth/logout-all-sessions',
        payload,
      )
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as LogoutResponse
      }
      throw new Error('Erro de conexão com o servidor')
    }
  },

  // Verificar acesso ao sistema
  async verificarAcesso(): Promise<VerificarAcessoResponse> {
    try {
      const response = await authApi.get<VerificarAcessoResponse>(
        `/usuario-permissao-sistema/verificar-acesso/${
          import.meta.env.VITE_SYSTEM_ID
        }`,
      )
      return response.data
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      if (apiError.response?.data) {
        return apiError.response.data as unknown as VerificarAcessoResponse
      }
      throw new Error('Erro de conexão com o servidor')
    }
  },

  // Buscar usuários (filtrar por email no client-side)
  async buscarUsuarioPorEmail(email: string): Promise<string | null> {

    console.log('Buscando usuário por email:', email)

    try {
      const response = await authApi.get<BuscarUsuariosResponse>('/usuarios', {
        params: {
          Search: email,
        },
        
      })

      console.log('Parâmetros de busca:', { Search: email })
      
      if (!response.data.sucesso || !response.data.dados?.items) {
        return null
      }
      
      const usuario = response.data.dados.items.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      )
      
      return usuario?.id || null
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      console.error('Erro ao buscar usuário por email:', apiError)
      return null
    }
  },

  // Buscar dados completos do usuário por email (incluindo setor)
  async buscarUsuarioCompletoEmail(email: string): Promise<{ id: string, setor?: string } | null> {
    
    console.log('Buscando usuário completo por email:', email)

    try {
      
      const response = await authApi.get<BuscarUsuariosResponse>('/usuarios', {
        params: {
          Search: email,
        },
      })

      console.log('Parâmetros de busca para usuário completo:', { Search: email })
      
      if (!response.data.sucesso || !response.data.dados?.items) {
        return null
      }
      
      // Busca o usuário pelo email (case-insensitive)
      const usuario = response.data.dados.items.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      )
      
      if (!usuario) {
        return null
      }

      // Retorna id e setor se disponível
      return {
        id: usuario.id,
        setor: (usuario as any).setor || undefined
      }
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      console.error('Erro ao buscar usuário completo por email:', apiError)
      return null
    }
  },

  // Buscar permissão do usuário no sistema (retorna o ID da permissão com menor permissaoId)
  async buscarPermissaoUsuarioSistema(
    usuarioId: string,
    sistemaId: string,
  ): Promise<{ authPermId: string; permissaoId: number; nomePermissao: string } | null> {
    try {
      const response = await authApi.get<BuscarPermissoesUsuarioSistemaResponse>(
        '/usuario-permissao-sistema',
        {
          params: {
            usuarioId,
            sistemaId,
            pageNumber: 1,
            pageSize: 10,
          },
        },
      )

      if (!response.data.sucesso || !response.data.dados?.items || response.data.dados.items.length === 0) {
        console.warn('Nenhuma permissão encontrada para o usuário no sistema')
        return null
      }

      // Ordena por permissaoId (menor = mais privilegiado) e pega o primeiro
      const permissoes = response.data.dados.items.sort((a, b) => a.permissaoId - b.permissaoId)
      const melhorPermissao = permissoes[0]

      console.log('Permissão encontrada:', {
        authPermId: melhorPermissao.id,
        permissaoId: melhorPermissao.permissaoId,
        nomePermissao: melhorPermissao.nomePermissao,
      })

      return {
        authPermId: melhorPermissao.id,
        permissaoId: melhorPermissao.permissaoId,
        nomePermissao: melhorPermissao.nomePermissao,
      }
    } catch (erro: unknown) {
      const apiError = erro as ApiError
      console.error('Erro ao buscar permissão do usuário no sistema:', apiError)
      return null
    }
  },
}
