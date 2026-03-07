import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Badge } from "./ui/badge";
import {
  Home,
  Settings,
  Bell,
  HelpCircle,
  Check,
  CheckCircle,
  CheckSquare,
  ArchiveIcon,
  CalendarCog,
  Users,
  UserCog,
  User,
  UserCheck,
  UserX,
  ClipboardList,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  DoorClosed,
  DoorClosedLocked,
} from "lucide-react";
import PageBreadcrumb from "./page-breadcrumb";
import { useAuthStore } from "@/lib/auth/auth-store";
import { cookieUtils } from "@/lib/auth/cookie-utils";
import { getTokenInfo } from "@/lib/auth/auth";

// Largura mínima para colapsar a sidebar automaticamente (em pixels)
const SIDEBAR_COLLAPSE_BREAKPOINT = 1300;

export function CompleteLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Estado inicial baseado no tamanho da tela
    return window.innerWidth >= SIDEBAR_COLLAPSE_BREAKPOINT;
  });
  
  // Monitora o tamanho da janela e ajusta a sidebar em telas menores
  useEffect(() => {
    const handleResize = () => {
      const shouldBeOpen = window.innerWidth >= SIDEBAR_COLLAPSE_BREAKPOINT;
      // Só força o fechamento em telas pequenas, não força abertura
      if (window.innerWidth < SIDEBAR_COLLAPSE_BREAKPOINT && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    // Adiciona listener de resize
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);
  
  // Lê dados do usuário do token
  const token = cookieUtils.getCookie("auth_token");
  const tokenInfo = token ? getTokenInfo(token) : null;
  const user = {
    name: tokenInfo?.nomeCompleto ?? "Usuário",
    email: tokenInfo?.sub ?? "",
    // Em Vite, arquivos na pasta public são servidos na raiz
    //avatar: "/perfil.jpg",
  };

  // Navegação completa com hierarquia
  // Decodifica permissão do token (se existir)
  const permissao = tokenInfo?.permissao;
  
  // Converte permissão para número de forma segura
  const permissaoNum = permissao != null ? Number(permissao) : null;
  
  // Mapeamento de permissões:
  // 1 = Admin (acesso total)
  // 2, 3 = Solicitante (não pode Gerenciar)
  // 4, 5 = Viewer (apenas visualizar)
  const isAdmin = permissaoNum === 1;
  const isSolicitante = permissaoNum === 2 || permissaoNum === 3;
  const isViewer = permissaoNum === 4 || permissaoNum === 5;
  
  const podeGerenciar = isAdmin;
  const podeCriar = isAdmin || isSolicitante;

  const navItems = [
    {
      title: "Agenda",
      url: "/agenda",
      icon: Home,
    },
    // Mostra somente se pode criar (bloqueia visualizadores)
    ...(podeCriar
      ? [
          {
            title: "Novo Agendamento",
            url: "/novo_agendamento",
            icon: CalendarPlus,
          },
        ]
      : []),
    // Mostra somente se pode Gerenciar (bloqueia solicitantes e visualizadores)
    ...(podeGerenciar
      ? [
          {
            title: "Gerenciar Agendamentos",
            url: "/gerenciar_agendamentos",
            icon: ClipboardList,
          },
          {
            title: "Gerenciar Usuários",
            url: "/gerenciar_usuarios",
            icon: Users,
          },
          {
            title: "Gerenciar Salas",
            url: "/gerenciar_salas",
            icon: DoorClosedLocked,
          },
        ]
      : []),
    {
      title: "Suporte",
      url: "/suporte",
      icon: HelpCircle,
    },
  ];

  // Handlers de ações do usuário
  const handleLogout = () => {
    const logout = useAuthStore.getState().logout;
    // 1) Limpa cookies e estado de auth
    logout();
    // 2) Redireciona para login
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    navigate("/settings/profile");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      
      <AppSidebar
        // Navegação
        navItems={navItems}
        // Logo com badge
        logoConfig={{
          mainLogoUrl: "/logo-prefeitura.png",
          mainLogoAlt: "Logo Prefeitura do Rio",
          badgeText: "SMSAgenda",
          badgeSubtext: "Agendamentos",
          badgeLogoUrl: "/logo-smsagenda.png",
          // logoLink: "/dashboard",
        }}
        // Footer completo com usuário e versão
        footerConfig={{
          userConfig: {
            user,
            onLogout: handleLogout,
            // onProfile: handleProfile,
            // onSettings: handleSettings,
          },
          showVersion: true,
          developerText: "Desenvolvido pela SUBG",
        }}
        // Props adicionais da Sidebar (shadcn)
        variant="sidebar"
        collapsible="icon"
        className="border-r"
      />

      <SidebarInset>
        {/* Header com todos os recursos */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-white px-4 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Toggle da sidebar */}

            {/* Breadcrumb */}
            <PageBreadcrumb
              labelMap={{
                reports: "Relatórios",
                sales: "Vendas",
                financial: "Financeiro",
                analytics: "Analytics",
                products: "Produtos",
                catalog: "Catálogo",
                inventory: "Estoque",
                suppliers: "Fornecedores",
                customers: "Clientes",
                list: "Lista",
                new: "Novo",
                finance: "Financeiro",
                invoices: "Faturas",
                payments: "Pagamentos",
                billing: "Cobranças",
                docs: "Documentos",
                settings: "Configurações",
                profile: "Perfil",
                account: "Conta",
                notifications: "Notificações",
                security: "Segurança",
                integrations: "Integrações",
                descricao_agendamento: "Descrição de Agendamento",
              }}
            />
          </div>

          {/* Actions no header */}
          <div className="flex items-center gap-2">
            {/* <Badge variant="outline" className="hidden md:flex">
              Ambiente: Produção
            </Badge>

            <button className="relative p-2 hover:bg-gray-100 rounded-md">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-md">
              <HelpCircle className="h-5 w-5" />
            </button> */}
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-auto p-4 bg-gray-50">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
