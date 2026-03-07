import { useAuthStore } from './auth-store'
import { cookieUtils } from './cookie-utils'

// Função auxiliar para decodificar base64 com suporte correto a UTF-8
function decodeBase64UTF8(base64: string): string {
  // Decodifica base64 para bytes
  const binaryString = atob(base64)

  // Converte bytes para array de códigos
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Decodifica UTF-8 corretamente
  return new TextDecoder('utf-8').decode(bytes)
}

// Função para validar formato de token JWT
const validarTokenJWT = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false
  const partes = token.split('.')
  return partes.length === 3 && partes.every((part) => part.length > 0)
}

// Refresh tokens podem ser opacos (não-JWT); aceitarmos qualquer string não vazia
const validarRefreshToken = (token: string | null | undefined): boolean => {
  if (!token || typeof token !== 'string') return false
  return token.trim().length > 0
}

// Função para obter o token JWT atual dos cookies
export function getToken(): string | null {
  const token = cookieUtils.getCookie('auth_token')

  if (token && validarTokenJWT(token)) {
    return token
  }
  return null
}

// Função para obter o refresh token dos cookies
export function getRefreshToken(): string | null {
  const refreshToken = cookieUtils.getCookie('auth_refresh_token')
  if (validarRefreshToken(refreshToken)) {
    return refreshToken
  }
  return null
}

// Função para verificar se o usuário está autenticado
export function isAuthenticated(): boolean {
  return useAuthStore.getState().estaAutenticado
}

// Função para obter informações do usuário
export function getUsuario() {
  return useAuthStore.getState().usuario
}

// Função para fazer logout
export function logout(): void {
  useAuthStore.getState().logout()
}

// Função para renovar token automaticamente
export async function renovarToken(): Promise<boolean> {
  return await useAuthStore.getState().renovarToken()
}

// Função para verificar se os cookies de autenticação existem e são válidos
export function hasAuthCookies(): boolean {
  const token = cookieUtils.getCookie('auth_token')
  const refreshToken = cookieUtils.getCookie('auth_refresh_token')

  // Valida apenas o auth_token como JWT
  // O refresh_token pode ser um token opaco (não JWT), então só verificamos a existência
  return !!(
    token &&
    refreshToken &&
    validarTokenJWT(token)
  )
}

// Função para limpar todos os cookies de autenticação
export function clearAuthCookies(): void {
  cookieUtils.removeCookie('auth_token')
  cookieUtils.removeCookie('auth_refresh_token')
}

// Função para validar se um token está próximo de expirar
export function isTokenNearExpiry(token: string): boolean {
  try {
    const [, base64Payload] = token.split('.')
    const payloadString = decodeBase64UTF8(base64Payload)
    const payload = JSON.parse(payloadString) as { exp: number }
    const exp = payload.exp * 1000 // Converte para milissegundos
    const now = Date.now()
    const timeUntilExpiry = exp - now

    // Retorna true se faltar menos de 5 minutos para expirar
    return timeUntilExpiry < 5 * 60 * 1000
  } catch {
    return true // Se não conseguir decodificar, considera como próximo de expirar
  }
}

/**
 * Seleciona a permissão mais adequada quando há múltiplas permissões
 * Mapeamento da agenda:
 * - 1 = Admin
 * - 2, 3 = Solicitante
 * - 4, 5 = Viewer
 * 
 * Regra: Sempre usa a permissão com menor número (menor = maior privilégio)
 */
function selecionarPermissaoValida(permissoes: number | number[] | string | string[]): number {
  // Se for valor único, converte e retorna
  if (!Array.isArray(permissoes)) {
    return Number(permissoes)
  }

  // Converte strings para números e retorna o menor (maior privilégio)
  const permissoesNumericas = permissoes.map(p => Number(p)).sort((a, b) => a - b)
  
  // Retorna a menor permissão (maior privilégio)
  return permissoesNumericas[0] || 4
}

// Função para obter informações do token (sem validação de assinatura)
export function getTokenInfo(token: string) {
  try {
    // Decodifica o payload do JWT com suporte correto a UTF-8
    const [, base64Payload] = token.split('.')
    const payloadString = decodeBase64UTF8(base64Payload)
    const payload = JSON.parse(payloadString)

    // Trata permissão que pode vir como array
    const permissaoSelecionada = selecionarPermissaoValida(payload.permissao)

    return {
      sub: payload.sub,
      usuarioId: payload.usuarioId,
      tipoUsuario: payload.tipoUsuario,
      nomeCompleto: payload.nomeCompleto,
      permissao: permissaoSelecionada,
      cpf: payload.cpf,
      sistemaId: payload.sistemaId,
      permissaoNome: Array.isArray(payload.permissaoNome) 
        ? payload.permissaoNome[0] 
        : payload.permissaoNome,
      exp: new Date(payload.exp * 1000),
      iss: payload.iss,
      aud: payload.aud,
    }
  } catch {
    return null
  }
}
