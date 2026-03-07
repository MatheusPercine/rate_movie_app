import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from './ui/dropdown-menu'
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react'
import { useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar'


export interface NavUserProps {
  /** Dados do usuário */
  user?: {
    name: string
    email: string
    avatar?: string
  }
  /** Callback ao clicar em "Sair" */
  onLogout?: () => void
  /** Callback ao clicar em "Perfil" */
  onProfile?: () => void
  /** Callback ao clicar em "Configurações" */
  onSettings?: () => void
}

/**
 * Componente de usuário para a sidebar
 * Exibe avatar, nome e email com dropdown de ações
 *
 * @example
 * ```tsx
 * <NavUser
 *   user={{
 *     name: 'João Silva',
 *     email: 'joao@example.com',
 *     avatar: '/avatar.jpg'
 *   }}
 *   onLogout={() => console.log('Logout')}
 *   onProfile={() => navigate('/profile')}
 * />
 * ```
 */
export function NavUser({
  user,
  onLogout,
  onProfile,
  onSettings,
}: NavUserProps) {
  const { isMobile, state } = useSidebar()
  
  // Em modo mobile, sempre usar estado expandido
  const effectiveState = isMobile ? 'expanded' : state

  // Placeholder se não houver usuário
  const displayUser = user || {
    name: 'Usuário',
    email: 'usuario@example.com',
  }

  // Iniciais do usuário para o avatar fallback
  const getInitials = (name: string) => {
    const words = name.trim().split(' ').filter(w => w.length > 0);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    // Pega primeira letra do primeiro e último nome
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  // Gera uma cor consistente baseada no nome
  const getColorFromName = (name: string) => {
    const colors = [
      { bg: '!bg-blue-500', text: '!text-white' },
      { bg: '!bg-green-500', text: '!text-white' },
      { bg: '!bg-purple-500', text: '!text-white' },
      { bg: '!bg-pink-500', text: '!text-white' },
      { bg: '!bg-indigo-500', text: '!text-white' },
      { bg: '!bg-cyan-500', text: '!text-white' },
      { bg: '!bg-teal-500', text: '!text-white' },
      { bg: '!bg-orange-500', text: '!text-white' },
      { bg: '!bg-red-500', text: '!text-white' },
      { bg: '!bg-amber-500', text: '!text-white' },
    ];
    
    // Gera um hash simples do nome para escolher a cor
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  const userColor = getColorFromName(displayUser.name);
  const isCollapsed = effectiveState === 'collapsed';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={`group/user relative overflow-hidden bg-gray-600 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg data-[state=open]:scale-[1.01] cursor-pointer ${
                isCollapsed 
                  ? 'mt-2 mb-2 h-12 w-12 !p-2 mx-auto justify-center' 
                  : 'mt-5 mb-3 h-15 py-4'
              }`}
            >
              {/* Efeito de brilho animado */}
              <div className="via-sidebar-foreground/10 absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent transition-transform duration-1000 ease-out group-hover/user:translate-x-full group-data-[state=open]:translate-x-full" />

              {/* Efeito de luz ambiente suave */}
              <div className="from-sidebar-primary/5 to-sidebar-primary/10 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-data-[state=open]:opacity-100" />

              {/* Efeito de pulsação no estado ativo */}
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 transition-all duration-500 group-data-[state=open]:animate-pulse" />

              <div className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                <div className="relative">
                  <Avatar className={`rounded-xl border-2 border-gray-700/40 shadow-lg backdrop-blur-sm transition-all duration-500 group-hover/user:border-gray-700/60 group-hover/user:shadow-xl group-data-[state=open]:scale-105 ${isCollapsed ? 'h-8 w-8' : 'h-9 w-9'}`}>
                    {displayUser.avatar && (
                      <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                    )}
                    <AvatarFallback className={`rounded-xl ${isCollapsed ? 'text-xs' : 'text-sm'} font-bold ${userColor.bg} ${userColor.text}`}>
                      {getInitials(displayUser.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Indicador de status online */}
                  {!isCollapsed && (
                    <div className="absolute -right-0.5 -bottom-0.5">
                      <div className="relative">
                        {/* Anel externo pulsante */}
                        <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-400/40 group-data-[state=open]:bg-green-300/60" />
                        {/* Anel médio */}
                        <div className="absolute inset-0.5 h-2 w-2 animate-pulse rounded-full bg-green-400/70" />
                        {/* Núcleo sólido */}
                        <div className="border-sidebar relative h-3 w-3 rounded-full border-2 bg-gradient-to-br from-green-400 to-green-500 shadow-lg transition-all duration-300 group-data-[state=open]:scale-110 group-data-[state=open]:shadow-green-400/40" />
                        {/* Brilho interno */}
                        <div className="absolute inset-0.5 h-1.5 w-1.5 rounded-full bg-green-200/90" />
                      </div>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <>
                    <div className="grid flex-1 transform text-left text-sm leading-tight transition-all duration-500 group-hover/user:translate-x-1 group-data-[state=open]:translate-x-2">
                      <span className="text-sidebar-foreground truncate font-semibold drop-shadow-sm transition-colors duration-300 group-data-[state=open]:font-bold">
                        {displayUser.name}
                      </span>
                      <span className="text-sidebar-foreground/70 truncate text-xs font-medium transition-all duration-300 group-data-[state=open]:font-semibold">
                        {displayUser.email}
                      </span>
                    </div>

                    <ChevronsUpDown className="text-sidebar-foreground/60 group-hover/user:text-sidebar-foreground ml-auto size-4 transition-all duration-500 group-hover/user:scale-125 group-hover/user:rotate-180 group-data-[state=open]:scale-125 group-data-[state=open]:rotate-180" />
                  </>
                )}
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="border-sidebar-border bg-sidebar/95 w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg backdrop-blur-md"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="border-sidebar-border/30 bg-sidebar-accent m-1 flex items-center gap-3 rounded-lg border px-2 py-2 text-left text-sm shadow-sm backdrop-blur-sm">
                <div className="relative">
                  <Avatar className="h-9 w-9 rounded-xl border-2 border-gray-700/40 shadow-md backdrop-blur-sm">
                    {displayUser.avatar && (
                      <AvatarImage
                        src={displayUser.avatar}
                        alt={displayUser.name}
                      />
                    )}
                    <AvatarFallback className={`rounded-xl text-xs font-bold ${userColor.bg} ${userColor.text}`}>
                      {getInitials(displayUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-0.5 -bottom-0.5">
                    <div className="relative">
                      <div className="border-sidebar h-3 w-3 rounded-full border-2 bg-gradient-to-br from-green-400 to-green-500 shadow-md" />
                      <div className="absolute inset-0.5 h-2 w-2 rounded-full bg-green-200/90" />
                    </div>
                  </div>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="text-sidebar-foreground truncate font-semibold drop-shadow-sm">
                    {displayUser.name}
                  </span>
                  <span className="text-sidebar-foreground/70 truncate text-xs font-medium">
                    {displayUser.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border/50" />

            {/* Perfil */}
            {onProfile && (
              <DropdownMenuItem
                onClick={onProfile}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:bg-sidebar-primary focus:text-sidebar-primary-foreground"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
            )}

            {/* Configurações */}
            {onSettings && (
              <DropdownMenuItem
                onClick={onSettings}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:bg-sidebar-primary focus:text-sidebar-primary-foreground"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
            )}

            {(onProfile || onSettings) && <DropdownMenuSeparator className="bg-sidebar-border/50" />}

            {/* Sair */}
            {onLogout && (
              <DropdownMenuItem
                onClick={onLogout}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:bg-sidebar-primary focus:text-sidebar-primary-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
