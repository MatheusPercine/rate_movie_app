import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { cookieUtils } from '@/lib/auth/cookie-utils'
import { getTokenInfo } from '@/lib/auth/auth'

interface PrivateRouteProps {
  children: ReactNode
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  // const location = useLocation()
  // // valida apenas o auth_token; ignora qualquer auth_refresh_token padrão
  // const hasAuthToken = cookieUtils.hasCookie('auth_token') && cookieUtils.isCookieValid('auth_token')

  // if (!hasAuthToken) {
  //   return <Navigate to="/login" replace state={{ from: location }} />
  // }

  // // Obtém permissão do token para validar acesso às rotas
  // const token = cookieUtils.getCookie('auth_token')
  // const tokenInfo = token ? getTokenInfo(token) : null
  // const permissaoNum = tokenInfo?.permissao != null ? Number(tokenInfo.permissao) : null

  // // Mapeamento de permissões: 1=Admin, 2/3=SolicitanteNormal, 4/5=Viewer
  // const isAdmin = permissaoNum === 1
  // const isSolicitanteNormal = permissaoNum === 2 || permissaoNum === 3
  // const isViewer = permissaoNum === 4 || permissaoNum === 5

  // // Regras de acesso:
  // // Admin (1): Acesso total
  // // SolicitanteNormal (2, 3): Não pode aprovar agendamentos
  // // Viewer (4, 5): Não pode criar nem aprovar agendamentos
  
  // // Bloqueia para Solicitante Normal e viewers
  // if (location.pathname.startsWith('/aprovar_agendamentos') || (location.pathname.startsWith('/gerenciar_usuarios')) || (location.pathname.startsWith('/gerenciar_salas'))) {
  //   if (!isAdmin || permissaoNum === null) {
  //     return <Navigate to="/agenda" replace />
  //   }
  // }

  // // Bloqueia criação de agendamentos somente para viewers
  // if (location.pathname.startsWith('/novo_agendamento') || location.pathname.startsWith('/descricao_agendamento') ) {
  //   if (isViewer || permissaoNum === null) {
  //     return <Navigate to="/agenda" replace />
  //   }
  // }

  return <>{children}</>
}
