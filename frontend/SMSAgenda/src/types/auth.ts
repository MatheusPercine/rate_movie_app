// Tipos para autenticação baseados na documentação da API

export interface Usuario {
  id: string
  email: string
  nomeCompleto: string
  tipoUsuario: string
  precisaTrocarSenha: boolean
  emailConfirmado: boolean
  ativo: boolean
}

export interface Sistema {
  id: string
  nome: string
  descricao: string
}

export interface Permissao {
  id: string
  nome: string
  descricao: string
}

export interface LoginRequest {
  email: string
  senha: string
  sistemaId?: string
}

export interface LoginResponse {
  sucesso: boolean
  dados: {
    mensagem: string
    sistema?: Sistema
    permissao: string
  }
  mensagem?: string
}

export interface ConfirmarCodigo2FARequest {
  email: string
  codigo: string
  sistemaId?: string
}

export interface RegisterRequest {
  email: string
  nomeCompleto: string
  cpf: string
}

export interface RegisterResponse {
  sucesso: boolean
  dados?: {
    usuarioId: string
    mensagem?: string
  }
  mensagem?: string
}

export interface UsuarioPermissaoSistemaRequest {
  usuarioId: string
  sistemaId: string
  permissaoId: number
}

export interface UsuarioPermissaoSistemaResponse {
  id: string
  usuarioId: string
  nomeUsuario: string
  sistemaId: string
  nomeSistema: string
  permissaoId: number
  nomePermissao: string
  atribuidoEm: string
  atualizadoEm: string
}

export interface ConfirmarCodigo2FAResponse {
  sucesso: boolean
  dados?: {
    token: string
    refreshToken: string
    usuario: Usuario
    // Campos adicionais para fluxo de recuperação de senha e senha expirada
    mensagem?: string
    precisaTrocarSenha?: boolean
    senhaExpirada?: boolean
    tokenTrocaSenha?: string
  }
  mensagem?: string | null
}

export interface TrocarSenhaRequest {
  email: string
  novaSenha: string
  tokenTrocaSenha?: string
  sistemaId: string;
}

export interface TrocarSenhaResponse {
  sucesso: boolean
  dados: {
    token: string
    refreshToken: string
    usuario: Usuario
  }
  mensagem: string
}

export interface EsqueciSenhaRequest {
  email: string
}

export interface EsqueciSenhaResponse {
  sucesso: boolean
  dados: string
  mensagem: string
}

export interface RefreshTokenRequest {
  refreshToken: string
  sistemaId?: string
}

export interface RefreshTokenResponse {
  sucesso: boolean
  dados: {
    token: string
    refreshToken: string
    expiresIn: number
    refreshTokenExpiresIn: number
    usuario: Usuario
  }
  mensagem?: string
}

export interface LogoutRequest {
  refreshToken: string
}

export interface LogoutResponse {
  sucesso: boolean
  dados: string
  mensagem: string
}

export interface VerificarAcessoResponse {
  sucesso: boolean
  dados: {
    temAcesso: boolean
    permissao: string
    permissaoId: string
    sistema: Sistema
    dataVinculo: string
    mensagem: string
  }
}

export interface SessaoAtiva {
  id: string
  criadoEm: string
  expiracao: string
  doisFatoresConfirmado: boolean
  ehSessaoAtual: boolean
}

export interface SessoesAtivasResponse {
  sucesso: boolean
  dados: {
    quantidadeSessoes: number
    sessoes: SessaoAtiva[]
  }
}

export interface JWTPayload {
  sub: string // email
  usuarioId: string
  tipoUsuario: string
  nomeCompleto: string
  nomePermissao: string
  exp: number
  iss: string
  aud: string
}

export interface UsuarioListItem {
  id: string
  nome: string
  email: string
  status: boolean
  emailConfirmado: boolean
  criadoEm: string
}

export interface BuscarUsuariosResponse {
  sucesso: boolean
  mensagem?: string
  dados?: {
    items: UsuarioListItem[]
  }
}

// Interface para o item individual de permissão do sistema
export interface UsuarioPermissaoSistemaItem {
  id: string // ID da permissão do sistema (authPermId)
  usuarioId: string
  nomeUsuario: string
  sistemaId: string
  nomeSistema: string
  permissaoId: number // 1=Admin, 2/3=Solicitante, 4/5=Viewer
  nomePermissao: string
  atribuidoEm: string
  atualizadoEm: string
}

// Interface para a resposta do GET /api/usuario-permissao-sistema
export interface BuscarPermissoesUsuarioSistemaResponse {
  sucesso: boolean
  mensagem?: string
  dados?: {
    items: UsuarioPermissaoSistemaItem[]
    totalItems: number
    pageNumber: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}
