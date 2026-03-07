import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type {
  ConfirmarCodigo2FARequest,
  EsqueciSenhaRequest,
  LoginRequest,
  RegisterRequest,
  TrocarSenhaRequest,
  Usuario,
} from '@/types/auth'
import { solicitanteService } from '@/services/solicitante-service'
import { useAuthStore } from './auth-store'

import { createServiceLogger } from '../logger'

import { getTokenInfo } from './auth'
import { authService } from './auth-service'
import { cookieUtils, authCookieConfig } from './cookie-utils'

const authLogger = createServiceLogger('auth-queries')

/**
 * Query para buscar dados do usuário atual
 * Extrai informações diretamente do token JWT
 * Apenas executa se enabled=true (quando há cookies válidos)
 */
export const useMeQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<Usuario> => {
      authLogger.info(
        { action: 'fetch-user', status: 'decoding-token' },
        'Extraindo dados do usuário do token JWT',
      )

      try {
        // Obtém token dos cookies
        const token = cookieUtils.getCookie('auth_token')

        if (!token) {
          authLogger.warn(
            { action: 'fetch-user', status: 'no-token' },
            'Token não encontrado nos cookies',
          )
          throw new Error('Token não encontrado')
        }

        // Decodifica token
        const payload = getTokenInfo(token)

        if (!payload) {
          authLogger.error(
            { action: 'fetch-user', status: 'invalid-token' },
            'Não foi possível decodificar o token',
          )
          throw new Error('Token inválido')
        }

        authLogger.debug(
          {
            action: 'fetch-user',
            status: 'token-decoded',
            usuarioId: payload.usuarioId,
            nomePermissao: payload.permissaoNome,
          },
          'Token decodificado com sucesso',
        )

        // Mapeia payload do token para interface Usuario
        const usuario: Usuario = {
          id: payload.usuarioId,
          email: payload.sub,
          nomeCompleto: payload.nomeCompleto,
          tipoUsuario: payload.permissaoNome,
          precisaTrocarSenha: false,
          emailConfirmado: true,
          ativo: true,
        }

        authLogger.info(
          {
            action: 'fetch-user',
            status: 'success',
            usuarioId: usuario.id,
            tipoUsuario: usuario.tipoUsuario,
          },
          'Dados do usuário extraídos do token com sucesso',
        )

        return usuario
      } catch (error) {
        authLogger.error(
          {
            action: 'fetch-user',
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Erro ao extrair dados do usuário do token',
        )
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: false, // Não tenta novamente em caso de erro
    ...options,
  })
}

/**
 * Mutation para registro de novo usuário
 */
/**
 * Mutation para registro de novo usuário
 */
export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: async (data: RegisterRequest & { setor: string }) => {
      authLogger.info(
        { action: 'register', status: 'requesting' },
        'Iniciando registro de novo usuário',
      )

      const { setor, ...registerData } = data
      let usuarioId: string | undefined

      // Flag para identificar se é usuário novo ou existente
      let isExistingUser = false

      // Passo 1: Tentar registrar o usuário
      try {
        const resultado = await authService.register(
          registerData.email,
          registerData.nomeCompleto,
          registerData.cpf,
        )

        if (!resultado.sucesso) {
          // Verifica se é erro de email já cadastrado
          const mensagemErro = resultado.mensagem?.toLowerCase() || ''
          if (mensagemErro.includes('já está cadastrado') || mensagemErro.includes('já cadastrado') || mensagemErro.includes('already')) {
            authLogger.warn(
              { action: 'register', status: 'user-exists', email: registerData.email },
              'Usuário já existe - tentando buscar ID e dar permissão',
            )
            
            isExistingUser = true
            
            // Usuário já existe, busca o ID e setor no GET /api/usuarios
            const usuarioCompleto = await authService.buscarUsuarioCompletoEmail(registerData.email)
            
            if (!usuarioCompleto) {
              authLogger.error(
                { action: 'register', status: 'user-not-found', email: registerData.email },
                'Usuário já cadastrado mas não encontrado no GET /api/usuarios',
              )
              throw new Error(
                'Este email já possui cadastro mas houve um erro ao recuperar suas informações. ' +
                'Por favor, entre em contato com o suporte.'
              )
            }
            
            usuarioId = usuarioCompleto.id
            
            // Se o usuário já tem setor cadastrado, usa ele; senão usa o fornecido no registro
            if (usuarioCompleto.setor) {
              sessionStorage.setItem('pending_setor', usuarioCompleto.setor)
              authLogger.info(
                { action: 'register', status: 'user-exists-with-setor', setor: usuarioCompleto.setor },
                'Usuário já tem setor cadastrado, usando ele',
              )
            }
            
            authLogger.info(
              { action: 'register', status: 'user-exists-found', usuarioId },
              'ID do usuário existente recuperado, continuando fluxo de permissão',
            )
          } else {
            authLogger.error(
              { action: 'register', status: 'failed', mensagem: resultado.mensagem },
              resultado.mensagem ?? 'Erro ao registrar usuário',
            )
            throw new Error(resultado.mensagem ?? 'Erro ao registrar usuário')
          }
        } else {
          if (!resultado.dados?.usuarioId) {
            authLogger.error(
              { action: 'register', status: 'failed' },
              'Usuário registrado mas ID não foi retornado',
            )
            throw new Error('Erro ao processar registro: ID do usuário não retornado')
          }

          usuarioId = resultado.dados.usuarioId

          authLogger.info(
            { action: 'register', status: 'success', usuarioId },
            'Usuário registrado com sucesso',
          )
        }
      } catch (error) {
        throw error
      }

      // Passo 2: Tentar dar permissão no sistema da agenda
      const sistemaId = import.meta.env.VITE_SYSTEM_ID as string
      const permissaoId = 4 // Permissão padrão para novos usuários (Viewer)

      authLogger.info(
        { 
          action: 'register-permission', 
          status: 'requesting',
          usuarioId,
          sistemaId,
          permissaoId
        },
        'Tentando dar permissão ao usuário no sistema',
      )

      try {
        // Dá a permissão ao usuário
        await authService.darPermissaoSistema(
          usuarioId,
          sistemaId,
          permissaoId,
        )

        authLogger.info(
          { action: 'register-permission', status: 'granted' },
          'Permissão concedida com sucesso',
        )

        // Busca o authPermId via GET (pega a permissão com menor permissaoId = mais privilegiada)
        const permissaoData = await authService.buscarPermissaoUsuarioSistema(
          usuarioId,
          sistemaId,
        )

        if (permissaoData) {
          console.log(' [Register] AuthPermId recuperado via GET:', permissaoData.authPermId)
          console.log(' [Register] Detalhes:', {
            authPermId: permissaoData.authPermId,
            permissaoId: permissaoData.permissaoId,
            nomePermissao: permissaoData.nomePermissao,
          })
          
          sessionStorage.setItem('pending_authPermId', permissaoData.authPermId)
          
          authLogger.info(
            { 
              action: 'register-permission', 
              status: 'id-retrieved',
              authPermId: permissaoData.authPermId,
              permissaoId: permissaoData.permissaoId,
              nomePermissao: permissaoData.nomePermissao
            },
            'AuthPermId recuperado via GET com sucesso',
          )
        } else {
          authLogger.warn(
            { action: 'register-permission', status: 'id-not-found' },
            'Permissão concedida mas authPermId não foi encontrado - será buscado no login',
          )
        }
      } catch (error) {
        authLogger.warn(
          {
            action: 'register-permission',
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          },
          'Erro ao conceder permissão - authPermId será buscado no login',
        )
      }

      // Solicitante será criado no login (após obter token de autenticação)
      // Salva setor no sessionStorage para uso no login
      if (setor.trim()) {
        const setorFinal = setor.trim()
        console.log(' [Register] Salvando setor no sessionStorage:', setorFinal)
        sessionStorage.setItem('pending_setor', setorFinal)
        console.log(' [Register] Setor salvo. Verificando:', sessionStorage.getItem('pending_setor'))
      }

      authLogger.info(
        { action: 'register', status: 'completed' },
        'Registro completo: Usuário e Permissão criados (Solicitante será criado no login)',
      )

      return { sucesso: true, dados: { usuarioId, isExistingUser } }
    },
  })
}

/*
 Mutation para login (primeira etapa - envia código 2FA)
 */
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async ({ email, senha }: LoginRequest) => {
      authLogger.info(
        { action: 'login', status: 'requesting' },
        'Iniciando login',
      )

      const resultado = await authService.login(email, senha)

      if (!resultado.sucesso) {
        // Verifica se é erro de falta de permissão
        const mensagemErro = resultado.mensagem?.toLowerCase() || ''
        if (mensagemErro.includes('não tem acesso') || mensagemErro.includes('solicite permissão')) {
          authLogger.info(
            { action: 'login', status: 'missing-permission', email },
            'Usuário sem permissão detectado - marcando para redirecionar ao registro',
          )
          
          // Lança erro especial para redirecionar ao registro
          const erro = new Error('REDIRECT_TO_REGISTER')
          ;(erro as any).shouldRedirectToRegister = true
          throw erro
        }
        
        authLogger.error(
          { action: 'login', status: 'failed' },
          resultado.mensagem ?? 'Erro no login',
        )
        throw new Error(resultado.mensagem ?? 'Erro no login')
      }

      authLogger.info(
        { action: 'login', status: 'success' },
        'Código 2FA enviado com sucesso',
      )

      return resultado
    },
  })
}

/**
 * Mutation para confirmar código 2FA (segunda etapa)
 */
export const useConfirm2FAMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, codigo }: ConfirmarCodigo2FARequest) => {
      authLogger.info(
        { action: 'confirm-2fa', status: 'requesting' },
        'Confirmando código 2FA',
      )

      const resultado = await authService.confirmarCodigo2FA(email, codigo)

      // Verifica se precisa trocar senha ou se senha expirou
      if (resultado.dados?.precisaTrocarSenha || resultado.dados?.senhaExpirada) {
        authLogger.info(
          {
            action: 'confirm-2fa',
            status: resultado.dados?.senhaExpirada ? 'password-expired' : 'password-change-required',
            senhaExpirada: resultado.dados?.senhaExpirada,
            precisaTrocarSenha: resultado.dados?.precisaTrocarSenha
          },
          resultado.dados?.senhaExpirada ? 'Senha expirada detectada' : 'Troca de senha obrigatória detectada',
        )

        // Salva tokens se fornecidos
        if (resultado.dados) {
          cookieUtils.setCookie(
            'auth_token',
            resultado.dados.token,
            authCookieConfig.token,
          )
          cookieUtils.setCookie(
            'auth_refresh_token',
            resultado.dados.refreshToken,
            authCookieConfig.refreshToken,
          )

          // Invalida cache para buscar usuário
          await queryClient.invalidateQueries({ queryKey: ['me'] })
        }

        return { ...resultado, requiresPasswordChange: true }
      }

      if (!resultado.sucesso) {
        authLogger.error(
          { action: 'confirm-2fa', status: 'failed' },
          resultado.mensagem ?? 'Erro ao confirmar código 2FA',
        )
        throw new Error(resultado.mensagem ?? 'Erro ao confirmar código 2FA')
      }

      // Salva tokens nos cookies
      if (resultado.dados) {
        cookieUtils.setCookie(
          'auth_token',
          resultado.dados.token,
          authCookieConfig.token,
        )
        cookieUtils.setCookie(
          'auth_refresh_token',
          resultado.dados.refreshToken,
          authCookieConfig.refreshToken,
        )

        authLogger.info(
          { action: 'confirm-2fa', status: 'success' },
          'Autenticação 2FA concluída com sucesso',
        )

        // Sincronizar Solicitante: buscar existente ou criar se não existir
        try {
          const usuario = resultado.dados.usuario
          
          // Decodifica token para obter permissão
          const token = cookieUtils.getCookie('auth_token')
          const tokenInfo = token ? getTokenInfo(token) : null
          const permissaoNum = tokenInfo?.permissao != null ? Number(tokenInfo.permissao) : undefined
          
          // Log da permissão recebida no token
          authLogger.info(
            { 
              action: 'confirm-2fa-permission', 
              status: 'verified',
              permissao: permissaoNum,
              permissaoNome: tokenInfo?.permissaoNome
            },
            'Permissão verificada no token após 2FA',
          )
          
          // Mapeamento de permissões: API → Banco Agenda
          // Admin: 1 → 1
          // Solicitante: 2 ou 3 → 0
          // Viewer: 4 ou 5 → 2
          let tipo = 0 // padrão: solicitante
          if (permissaoNum === 1) {
            tipo = 1 // solicitante admin
          } else if (permissaoNum === 2 || permissaoNum === 3) {
            tipo = 0 // solicitante normal
          } else if (permissaoNum === 4 || permissaoNum === 5) {
            tipo = 2 // viewer
          }
          
          // Recupera setor e authPermId do sessionStorage (salvos durante registro)
          console.log('🔍 [2FA] Verificando sessionStorage completo:', {
            pending_setor: sessionStorage.getItem('pending_setor'),
            pending_authPermId: sessionStorage.getItem('pending_authPermId'),
            auth_email: sessionStorage.getItem('auth_email'),
            allKeys: Object.keys(sessionStorage)
          })
          let setorSalvo = sessionStorage.getItem('pending_setor')
          let authPermIdSalvo = sessionStorage.getItem('pending_authPermId')
          console.log('🔍 [2FA] Setor recuperado:', setorSalvo)
          console.log('🔍 [2FA] AuthPermId recuperado:', authPermIdSalvo)
          
          // Se não tiver authPermId no sessionStorage, busca via GET
          if (!authPermIdSalvo && tokenInfo?.usuarioId) {
            console.log('⚠️ [2FA] AuthPermId não encontrado no sessionStorage - buscando via GET')
            authLogger.info(
              { action: 'confirm-2fa', status: 'fetching-authPermId', usuarioId: tokenInfo.usuarioId },
              'Buscando authPermId via GET /api/usuario-permissao-sistema',
            )
            
            const sistemaId = import.meta.env.VITE_SYSTEM_ID as string
            const permissaoData = await authService.buscarPermissaoUsuarioSistema(
              tokenInfo.usuarioId,
              sistemaId,
            )
            
            if (permissaoData) {
              authPermIdSalvo = permissaoData.authPermId
              console.log('✅ [2FA] AuthPermId recuperado via GET:', authPermIdSalvo)
              console.log('📊 [2FA] Detalhes da permissão:', {
                authPermId: permissaoData.authPermId,
                permissaoId: permissaoData.permissaoId,
                nomePermissao: permissaoData.nomePermissao,
              })
              
              authLogger.info(
                { 
                  action: 'confirm-2fa', 
                  status: 'authPermId-retrieved',
                  authPermId: authPermIdSalvo,
                  permissaoId: permissaoData.permissaoId,
                  nomePermissao: permissaoData.nomePermissao
                },
                'AuthPermId recuperado via GET com sucesso',
              )
            } else {
              authLogger.warn(
                { action: 'confirm-2fa', status: 'authPermId-not-found' },
                'Não foi possível recuperar authPermId via GET',
              )
            }
          }
          
          console.log('🔐 [Auth] Iniciando sincronização de Solicitante após 2FA')
          console.log('🔐 [Auth] Dados do token:', {
            email: usuario.email,
            nome: usuario.nomeCompleto,
            permissao: tokenInfo?.permissao,
            permissaoNum,
            tipoCalculado: tipo,
            setor: setorSalvo,
            authPermId: authPermIdSalvo
          })
          
          authLogger.debug(
            { 
              action: 'confirm-2fa-solicitante', 
              status: 'checking-permission',
              permissao: tokenInfo?.permissao,
              permissaoNome: tokenInfo?.permissaoNome
            },
            'Verificando permissão do usuário',
          )
          
          authLogger.info(
            { 
              action: 'confirm-2fa-solicitante', 
              status: 'syncing',
              email: usuario.email,
              permissao: tokenInfo?.permissao,
              tipoDerivado: tipo,
              setor: setorSalvo
            },
            'Sincronizando solicitante (buscar ou criar)',
          )
          
          // Sincroniza (busca existente ou cria novo)
          // Se não tiver setor no sessionStorage, usa string vazia (backend não aceita null/undefined)
          const solicitante = await solicitanteService.sincronizar({
            nome: usuario.nomeCompleto,
            email: usuario.email,
            tipo,
            setor: setorSalvo || '',
            authId: tokenInfo?.usuarioId,
            authPermId: authPermIdSalvo || undefined
          })

          console.log(' [Auth] Solicitante sincronizado:', solicitante)

          // Guarda o solicitante no store para uso nos agendamentos
          useAuthStore.getState().setSolicitante(solicitante)
          
          authLogger.info(
            { action: 'confirm-2fa', status: 'solicitante-ready', solicitanteId: solicitante.id },
            'Solicitante pronto para uso',
          )
          
          // Remove setor e authPermId do sessionStorage após sincronização bem-sucedida
          console.log(' [Auth] Removendo pending_setor e pending_authPermId do sessionStorage')
          sessionStorage.removeItem('pending_setor')
          sessionStorage.removeItem('pending_authPermId')
        } catch (error) {
          console.error(' [Auth] ERRO ao sincronizar solicitante:', error)
          if (error instanceof Error) {
            console.error(' [Auth] Stack trace:', error.stack)
          }
          authLogger.warn(
            { 
              action: 'confirm-2fa', 
              status: 'solicitante-error',
              error: error instanceof Error ? error.message : String(error)
            },
            'Erro ao criar/buscar solicitante',
          )
          // Não bloqueia o login se falhar ao criar solicitante
        }

        // Invalida cache para buscar usuário atualizado
        await queryClient.invalidateQueries({ queryKey: ['me'] })
      }

      return resultado
    },
  })
}

/**
 * Mutation para trocar senha
 */
export const usePasswordChangeMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      novaSenha,
      tokenTrocaSenha,
    }: TrocarSenhaRequest) => {
      authLogger.info(
        { action: 'change-password', status: 'requesting' },
        'Solicitando troca de senha',
      )

      // Trocar senha espera sistemaId (vindo do request object)
      const resultado = await authService.trocarSenha(
        email,
        novaSenha,
        tokenTrocaSenha,
        (typeof (import.meta.env.VITE_SYSTEM_ID) !== 'undefined' ? (import.meta.env.VITE_SYSTEM_ID as string) : ''),
      )

      if (!resultado.sucesso) {
        authLogger.error(
          { action: 'change-password', status: 'failed' },
          resultado.mensagem ?? 'Erro ao trocar senha',
        )
        throw new Error(resultado.mensagem ?? 'Erro ao trocar senha')
      }

      // Salva tokens nos cookies
      cookieUtils.setCookie(
        'auth_token',
        resultado.dados.token,
        authCookieConfig.token,
      )
      cookieUtils.setCookie(
        'auth_refresh_token',
        resultado.dados.refreshToken,
        authCookieConfig.refreshToken,
      )

      authLogger.info(
        { action: 'change-password', status: 'success' },
        'Senha alterada com sucesso',
      )

      // Sincronizar Solicitante após troca de senha (mesmo fluxo do 2FA)
      try {
        const usuario = resultado.dados.usuario
        
        // Decodifica token para obter permissão
        const token = cookieUtils.getCookie('auth_token')
        const tokenInfo = token ? getTokenInfo(token) : null
        const permissaoNum = tokenInfo?.permissao != null ? Number(tokenInfo.permissao) : undefined
        
        // Log da permissão recebida no token
        authLogger.info(
          { 
            action: 'change-password-permission', 
            status: 'verified',
            permissao: permissaoNum,
            permissaoNome: tokenInfo?.permissaoNome
          },
          'Permissão verificada no token após troca de senha',
        )
        
        // Mapeamento de permissões: API - Banco Agenda
        // Mapeamento de permissões: API → Banco Agenda
        // Admin: 1 → 1
        // Solicitante: 2 ou 3 → 0
        // Viewer: 4 ou 5 → 2
        let tipo = 0 // padrão: solicitante
        if (permissaoNum === 1) {
          tipo = 1 // admin
        } else if (permissaoNum === 2 || permissaoNum === 3) {
          tipo = 0 // solicitante
        } else if (permissaoNum === 4 || permissaoNum === 5) {
          tipo = 2 // viewer
        }
        
        // Recupera setor e authPermId do sessionStorage (salvos durante registro)
        console.log('🔍 [Password Change] Verificando sessionStorage completo:', {
          pending_setor: sessionStorage.getItem('pending_setor'),
          pending_authPermId: sessionStorage.getItem('pending_authPermId'),
          auth_email: sessionStorage.getItem('auth_email'),
          allKeys: Object.keys(sessionStorage)
        })
        const setorSalvo = sessionStorage.getItem('pending_setor')
        const authPermIdSalvo = sessionStorage.getItem('pending_authPermId')
        console.log('🔍 [Password Change] Setor recuperado:', setorSalvo)
        console.log('🔍 [Password Change] AuthPermId recuperado:', authPermIdSalvo)
        
        console.log('🔐 [Password Change] Iniciando sincronização de Solicitante após troca de senha')
        console.log('🔐 [Password Change] Dados do token:', {
          email: usuario.email,
          nome: usuario.nomeCompleto,
          permissao: tokenInfo?.permissao,
          permissaoNum,
          tipoCalculado: tipo,
          setor: setorSalvo,
          authPermId: authPermIdSalvo
        })
        
        authLogger.info(
          { 
            action: 'change-password-solicitante', 
            status: 'syncing',
            email: usuario.email,
            permissao: tokenInfo?.permissao,
            tipoDerivado: tipo,
            setor: setorSalvo
          },
          'Sincronizando solicitante (buscar ou criar)',
        )
        
        // Sincroniza (busca existente ou cria novo)
        // Se não tiver setor no sessionStorage, usa string vazia (backend não aceita null/undefined)
        const solicitante = await solicitanteService.sincronizar({
          nome: usuario.nomeCompleto,
          email: usuario.email,
          tipo,
          setor: setorSalvo || '',
          authId: tokenInfo?.usuarioId,
          authPermId: authPermIdSalvo || undefined
        })

        console.log('🔐 [Password Change] Solicitante sincronizado:', solicitante)

        // Guarda o solicitante no store para uso nos agendamentos
        useAuthStore.getState().setSolicitante(solicitante)
        
        authLogger.info(
          { action: 'change-password', status: 'solicitante-ready', solicitanteId: solicitante.id },
          'Solicitante pronto para uso',
        )
        
        // Remove setor e authPermId do sessionStorage após sincronização bem-sucedida
        console.log('🧹 [Password Change] Removendo pending_setor e pending_authPermId do sessionStorage')
        sessionStorage.removeItem('pending_setor')
        sessionStorage.removeItem('pending_authPermId')
        console.log('🧹 [Password Change] Removendo pending_setor do sessionStorage')
        sessionStorage.removeItem('pending_setor')
      } catch (error) {
        console.error('❌ [Password Change] ERRO ao sincronizar solicitante:', error)
        if (error instanceof Error) {
          console.error('❌ [Password Change] Stack trace:', error.stack)
        }
        authLogger.warn(
          { 
            action: 'change-password', 
            status: 'solicitante-error',
            error: error instanceof Error ? error.message : String(error)
          },
          'Erro ao criar/buscar solicitante',
        )
        // Não bloqueia a troca de senha se falhar ao criar solicitante
      }

      // Invalida cache para buscar usuário atualizado
      await queryClient.invalidateQueries({ queryKey: ['me'] })

      return resultado
    },
  })
}

/**
 * Mutation para recuperar senha (esqueci senha)
 */
export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: async ({ email }: EsqueciSenhaRequest) => {
      authLogger.info(
        { action: 'forgot-password', status: 'requesting' },
        'Solicitando recuperação de senha',
      )

      const resultado = await authService.esqueciSenha(email)

      if (!resultado.sucesso) {
        authLogger.error(
          { action: 'forgot-password', status: 'failed' },
          resultado.mensagem ?? 'Erro ao solicitar recuperação',
        )
        throw new Error(resultado.mensagem ?? 'Erro ao solicitar recuperação')
      }

      authLogger.info(
        { action: 'forgot-password', status: 'success' },
        'Email de recuperação enviado',
      )

      return resultado
    },
  })
}

/**
 * Mutation para logout
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const refreshToken = cookieUtils.getCookie('auth_refresh_token')

      authLogger.info(
        { action: 'logout', status: 'requesting' },
        'Realizando logout',
      )

      if (refreshToken) {
        try {
          await authService.logout(refreshToken)
          authLogger.info(
            { action: 'logout', status: 'success' },
            'Sessão encerrada no servidor',
          )
        } catch (erro) {
          authLogger.warn(
            { action: 'logout', status: 'server-error' },
            erro instanceof Error
              ? erro.message
              : 'Erro ao encerrar sessão no servidor',
          )
          // Continua o logout local mesmo se falhar no servidor
        }
      }
    },
    onSettled: () => {
      // Remove cookies
      cookieUtils.removeCookie('auth_token', authCookieConfig.token)
      cookieUtils.removeCookie(
        'auth_refresh_token',
        authCookieConfig.refreshToken,
      )

      // Limpa todo cache do React Query
      queryClient.removeQueries()

      // Limpa sessionStorage
      sessionStorage.clear()

      toast.success("Logout concluído")

      authLogger.info(
        { action: 'logout', status: 'completed' },
        'Logout local concluído',
      )
    },
  })
}

/**
 * Mutation para logout de todas as sessões
 */
export const useLogoutAllSessionsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const refreshToken = cookieUtils.getCookie('auth_refresh_token')

      authLogger.info(
        { action: 'logout-all', status: 'requesting' },
        'Encerrando todas as sessões',
      )

      if (refreshToken) {
        await authService.logoutTodasSessoes(refreshToken)
        authLogger.info(
          { action: 'logout-all', status: 'success' },
          'Todas as sessões encerradas no servidor',
        )
      }
    },
    onSettled: () => {
      // Remove cookies
      cookieUtils.removeCookie('auth_token', authCookieConfig.token)
      cookieUtils.removeCookie(
        'auth_refresh_token',
        authCookieConfig.refreshToken,
      )

      // Limpa todo cache
      queryClient.removeQueries()

      authLogger.info(
        { action: 'logout-all', status: 'completed' },
        'Logout de todas as sessões concluído, redirecionando...',
      )

      // Salva flag para mostrar toast após reload
      // Precisa ser feito ANTES de limpar sessionStorage
      sessionStorage.setItem('show_logout_success_toast', 'true')

      // Limpa sessionStorage (exceto a flag do toast)
      const logoutToastFlag = sessionStorage.getItem('show_logout_success_toast')
      sessionStorage.clear()
      if (logoutToastFlag) {
        sessionStorage.setItem('show_logout_success_toast', logoutToastFlag)
      }

      // Força reload completo da página para garantir estado limpo
      // Não usa navigate() para evitar race conditions com React Query e Context
      // Toast será mostrado após o reload na página de login
      window.location.href = '/login'
    },
  })
}
