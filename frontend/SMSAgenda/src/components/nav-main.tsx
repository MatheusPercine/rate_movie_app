import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSidebar, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from './ui/sidebar'



export interface NavMainItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export interface NavMainProps {
  items: NavMainItem[]
}

/**
 * Componente de navegação principal da sidebar
 *
 * @example
 * ```tsx
 * import { NavMain } from '@subg-riosaude/subg-components'
 * import { Home, Settings } from 'lucide-react'
 *
 * <NavMain
 *   items={[
 *     { title: 'Início', url: '/', icon: Home },
 *     {
 *       title: 'Configurações',
 *       url: '/settings',
 *       icon: Settings,
 *       items: [{ title: 'Geral', url: '/settings/general' }]
 *     }
 *   ]}
 * />
 * ```
 */
export const NavMain = ({ items }: NavMainProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { state, isMobile } = useSidebar()
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  
  // Em modo mobile, sempre usar estado expandido
  const effectiveState = isMobile ? 'expanded' : state

  const isItemActive = (
    itemUrl: string,
    subItems?: { title: string; url: string }[],
  ) => {
    if (location.pathname === itemUrl) {
      return true
    }

    if (subItems) {
      const hasActiveSubItem = subItems.some(
        (subItem) => location.pathname === subItem.url,
      )
      if (hasActiveSubItem) {
        return true
      }
      if (itemUrl !== '#' && itemUrl !== '/') {
        return location.pathname.startsWith(itemUrl)
      }
    }

    return false
  }

  const isSubItemActive = (subItemUrl: string) => {
    return location.pathname === subItemUrl
  }

  const handleItemClick = (item: NavMainItem) => {
    if (item.items?.length) {
      setOpenItems((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(item.title)) {
          newSet.delete(item.title)
        } else {
          newSet.add(item.title)
        }
        return newSet
      })
    } else {
      navigate(item.url)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={effectiveState === 'collapsed' ? 'sr-only' : ''}>
        Menu Inicial
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = isItemActive(item.url, item.items)
          const isOpen = openItems.has(item.title) || isActive
          return (
            <Collapsible key={item.title} asChild open={isOpen}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={effectiveState === 'collapsed' ? item.title : undefined}
                  isActive={isActive}
                  className={
                    isActive
                      ? '[&[data-active=true]]:text-sidebar-primary cursor-pointer [&[data-active=true]]:bg-transparent [&[data-active=true]]:font-medium'
                      : effectiveState === 'collapsed'
                        ? 'hover:text-sidebar-primary cursor-pointer justify-center'
                        : 'hover:text-sidebar-primary cursor-pointer transition-all duration-200'
                  }
                  onClick={() => handleItemClick(item)}
                >
                  <item.icon
                    className={effectiveState === 'collapsed' ? 'h-5 w-5' : ''}
                  />
                  <span className={effectiveState === 'collapsed' ? 'sr-only' : ''}>
                    {item.title}
                  </span>
                </SidebarMenuButton>
                {item.items?.length && effectiveState !== 'collapsed' ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction
                        className="cursor-pointer data-[state=open]:rotate-90"
                        onClick={() => handleItemClick(item)}
                      >
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const isSubActive = isSubItemActive(subItem.url)
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className={
                                  isSubActive
                                    ? '[&[data-active=true]]:text-sidebar-primary [&[data-active=true]]:bg-transparent [&[data-active=true]]:font-medium'
                                    : 'hover:text-sidebar-primary'
                                }
                              >
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
