import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/lib/auth/auth-context'

interface PrivateRouteProps {
  children: ReactNode
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation()
  const { estaAutenticado, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando autenticação...
      </div>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
