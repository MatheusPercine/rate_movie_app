import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { NavMain } from "./nav-main";
import { Separator } from "./ui/separator";
import {
  type SidebarFooterProps,
  SidebarFooter as SidebarFooterNew,
} from "./sidebar-footer";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarContent,
  SidebarFooter,
} from "./ui/sidebar";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: {
    title: string;
    url: string;
  }[];
}

export interface LogoConfig {
  /** URL da logo principal */
  mainLogoUrl: string;
  /** Texto alternativo da logo */
  mainLogoAlt?: string;
  /** URL da logo secundária (badge) */
  badgeLogoUrl?: string;
  /** Texto da badge */
  badgeText?: string;
  /** Subtexto da badge (linha adicional) */
  badgeSubtext?: string;
  /** Link ao clicar na logo */
  logoLink?: string;
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /** Itens de navegação */
  navItems: NavItem[];
  /** Configuração de logo */
  logoConfig: LogoConfig;
  /** Configuração do footer com versão e usuário */
  footerConfig?: SidebarFooterProps;
  /** Conteúdo customizado do footer (alternativa ao footerConfig) */
  footerContent?: React.ReactNode;
}

/**
 * Componente AppSidebar reutilizável baseado em shadcn/ui
 *
 * @example
 * ```tsx
 * import { AppSidebar } from '@subg-riosaude/subg-components'
 * import { Home, PenBoxIcon } from 'lucide-react'
 *
 * <AppSidebar
 *   navItems={[
 *     { title: 'Início', url: '/', icon: Home },
 *     {
 *       title: 'Contratos',
 *       url: '/contratos',
 *       icon: PenBoxIcon,
 *       items: [
 *         { title: 'Cadastrar Contrato', url: '/contratos/cadastrar' },
 *         { title: 'Lista de Contratos', url: '/contratos' }
 *       ]
 *     }
 *   ]}
 *   logoConfig={{
 *     mainLogoUrl: '/logo.png',
 *     mainLogoAlt: 'Logo Prefeitura',
 *     badgeText: 'CAC',
 *     badgeLogoUrl: '/badge-logo.png',
 *     logoLink: '/dashboard'
 *   }}
 *   footerContent={<CustomFooter />}
 * />
 * ```
 */
export const AppSidebar = ({
  navItems,
  logoConfig,
  footerConfig,
  footerContent,
  ...props
}: AppSidebarProps) => {
  // Renderizar footer
  const renderFooter = () => {
    // Se footerContent for fornecido, usar ele (modo custom)
    if (footerContent) {
      return <SidebarFooter>{footerContent}</SidebarFooter>;
    }

    // Se footerConfig for fornecido, usar SidebarFooterNew
    // Nota: SidebarFooterNew já tem seu próprio layout, não precisa de wrapper
    if (footerConfig) {
      return <SidebarFooterNew {...footerConfig} />;
    }

    // Sem footer
    return null;
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="h-svh" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="">
              <div className="flex flex-col items-center space-y-3 group-data-[state=collapsed]:space-y-2">
                {/* Logo principal limpa - sem quadrado */}
                {/* <Link to={logoConfig.logoLink || "/"}> */}
                  <div className="logo-container relative transition-all duration-500 group-data-[state=collapsed]:scale-75 hover:scale-110">
                    <img
                      src={logoConfig.mainLogoUrl}
                      alt={logoConfig.mainLogoAlt || "Logo"}
                      className="h-24 w-52 object-contain drop-shadow-lg transition-all duration-500 group-data-[state=collapsed]:h-24 group-data-[state=collapsed]:w-24"
                    />
                  </div>
                {/* </Link> */}

                {/* Badge CAC redesenhada com ícone maior */}
                {logoConfig.badgeText && (
                  <div className="group-data-[state=collapsed]:hidden w-full">
                    <div className="px-4 py-3">
                      <Separator className="bg-sidebar-border/50" />
                    </div>
                    <div className="flex gap-5 items-center overflow-hidden rounded-md bg-gray-600 px-4 py-3 opacity-80 transition-all duration-300 hover:scale-105 hover:opacity-95">
                      {logoConfig.badgeLogoUrl && (
                        <div className="flex w-20 h-10 items-center justify-center shrink-  ">
                          <img
                            src={logoConfig.badgeLogoUrl}
                            alt="Logo CAC"
                            className="h-32 w-32 object-contain opacity-95 drop-shadow-sm"
                            style={{ animationDuration: "6s" }}
                          />
                        </div>
                      )}
                      {/* Texto CAC */}
                      <div className="flex flex-col">
                        <span className="text-sidebar-foreground ml-[-20px] text-md font-bold tracking-wider uppercase drop-shadow-sm ">
                          {logoConfig.badgeText}
                        </span>
                        {logoConfig.badgeSubtext && (
                          <span className="text-sidebar-foreground  ml-[-20px] text-sm tracking-wider drop-shadow-sm">
                            {logoConfig.badgeSubtext}
                          </span>
                        )}
                      </div>
                      {/* Efeito de brilho animado */}
                      <div className="via-sidebar-foreground/10 absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent transition-transform duration-1000 ease-out group-hover/cac:translate-x-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="px-4 py-2">
          <Separator className="bg-sidebar-border/50" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      {renderFooter()}
    </Sidebar>
  );
};
