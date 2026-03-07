# Documentação Técnica do Front-End — SMSAgenda

## Aspectos Tecnológicos da Interface do Usuário

---

## Sumário

1. [Introdução](#1-introdução)
2. [Arquitetura Geral do Front-End](#2-arquitetura-geral-do-front-end)
3. [Stack Tecnológica](#3-stack-tecnológica)
   - 3.1 [React 19 e TypeScript](#31-react-19-e-typescript)
   - 3.2 [Vite como Bundler e Dev Server](#32-vite-como-bundler-e-dev-server)
   - 3.3 [Tailwind CSS v4 e Sistema de Design](#33-tailwind-css-v4-e-sistema-de-design)
   - 3.4 [Shadcn/UI e Radix UI](#34-shadcnui-e-radix-ui)
4. [Estrutura de Diretórios e Organização do Código](#4-estrutura-de-diretórios-e-organização-do-código)
5. [Sistema de Roteamento](#5-sistema-de-roteamento)
   - 5.1 [Configuração de Rotas](#51-configuração-de-rotas)
   - 5.2 [Rotas Protegidas e Controle de Acesso](#52-rotas-protegidas-e-controle-de-acesso)
6. [Gerenciamento de Estado](#6-gerenciamento-de-estado)
   - 6.1 [Zustand — Estado Global](#61-zustand--estado-global)
   - 6.2 [React Query (TanStack Query) — Estado do Servidor](#62-react-query-tanstack-query--estado-do-servidor)
   - 6.3 [Context API — Contexto de Autenticação](#63-context-api--contexto-de-autenticação)
7. [Sistema de Autenticação e Segurança](#7-sistema-de-autenticação-e-segurança)
   - 7.1 [Fluxo de Autenticação com 2FA](#71-fluxo-de-autenticação-com-2fa)
   - 7.2 [Gerenciamento de Tokens JWT](#72-gerenciamento-de-tokens-jwt)
   - 7.3 [Gerenciamento de Cookies](#73-gerenciamento-de-cookies)
   - 7.4 [Renovação Automática de Tokens](#74-renovação-automática-de-tokens)
   - 7.5 [Sistema de Permissões](#75-sistema-de-permissões)
8. [Camada de Serviços e Comunicação com API](#8-camada-de-serviços-e-comunicação-com-api)
   - 8.1 [Configuração do Axios](#81-configuração-do-axios)
   - 8.2 [Interceptadores de Requisição e Resposta](#82-interceptadores-de-requisição-e-resposta)
   - 8.3 [Serviço de Autenticação](#83-serviço-de-autenticação)
   - 8.4 [Serviço de Solicitante](#84-serviço-de-solicitante)
9. [Tipagem e Contratos de Dados](#9-tipagem-e-contratos-de-dados)
10. [Componentes e Interface do Usuário](#10-componentes-e-interface-do-usuário)
    - 10.1 [Componentes de Layout](#101-componentes-de-layout)
    - 10.2 [Sistema de Sidebar e Navegação](#102-sistema-de-sidebar-e-navegação)
    - 10.3 [Biblioteca de Componentes UI](#103-biblioteca-de-componentes-ui)
    - 10.4 [Componentes Personalizados](#104-componentes-personalizados)
11. [Páginas da Aplicação](#11-páginas-da-aplicação)
    - 11.1 [Agenda (Visualização Principal)](#111-agenda-visualização-principal)
    - 11.2 [Novo Agendamento](#112-novo-agendamento)
    - 11.3 [Descrição do Agendamento](#113-descrição-do-agendamento)
    - 11.4 [Gerenciar Agendamentos](#114-gerenciar-agendamentos)
    - 11.5 [Gerenciar Salas](#115-gerenciar-salas)
    - 11.6 [Gerenciar Usuários](#116-gerenciar-usuários)
    - 11.7 [Páginas de Autenticação](#117-páginas-de-autenticação)
12. [Validação de Formulários](#12-validação-de-formulários)
13. [Sistema de Logging](#13-sistema-de-logging)
14. [Responsividade e Experiência Mobile](#14-responsividade-e-experiência-mobile)
15. [Containerização e Deploy](#15-containerização-e-deploy)
    - 15.1 [Docker e Multi-Stage Build](#151-docker-e-multi-stage-build)
    - 15.2 [Nginx como Servidor de Produção](#152-nginx-como-servidor-de-produção)
    - 15.3 [Docker Compose](#153-docker-compose)
16. [Variáveis de Ambiente e Configuração](#16-variáveis-de-ambiente-e-configuração)
17. [Qualidade de Código e Ferramentas de Desenvolvimento](#17-qualidade-de-código-e-ferramentas-de-desenvolvimento)
18. [Considerações Finais](#18-considerações-finais)
19. [O Backend de Autenticação](#19-o-backend-de-autenticação)
    - 19.1 [Visão Geral da API de Autenticação](#191-visão-geral-da-api-de-autenticação)
    - 19.2 [Endpoints e Recursos Expostos](#192-endpoints-e-recursos-expostos)
    - 19.3 [Modelo de Permissões e Sistemas](#193-modelo-de-permissões-e-sistemas)
    - 19.4 [Estrutura de Respostas da API](#194-estrutura-de-respostas-da-api)
    - 19.5 [Tokens e Sessões](#195-tokens-e-sessões)
20. [Relação entre o Front-End e o Backend de Autenticação](#20-relação-entre-o-front-end-e-o-backend-de-autenticação)
    - 20.1 [Arquitetura de Comunicação Dual-Backend](#201-arquitetura-de-comunicação-dual-backend)
    - 20.2 [Instâncias Axios Separadas](#202-instâncias-axios-separadas)
    - 20.3 [Fluxo Completo de Registro e Provisionamento](#203-fluxo-completo-de-registro-e-provisionamento)
    - 20.4 [Fluxo Completo de Login e Sincronização](#204-fluxo-completo-de-login-e-sincronização)
    - 20.5 [Mapeamento de Permissões entre Backends](#205-mapeamento-de-permissões-entre-backends)
    - 20.6 [Sincronização do Solicitante (Upsert)](#206-sincronização-do-solicitante-upsert)
    - 20.7 [Renovação de Tokens e Propagação para a API de Agendamentos](#207-renovação-de-tokens-e-propagação-para-a-api-de-agendamentos)
    - 20.8 [Gerenciamento de Usuários com Escrita Dupla](#208-gerenciamento-de-usuários-com-escrita-dupla)

---

## 1. Introdução

O **SMSAgenda** é uma aplicação web para gerenciamento de agendamentos de salas de reunião, desenvolvida no contexto da Secretaria Municipal de Saúde. O front-end da aplicação foi construído como uma *Single Page Application* (SPA) moderna, utilizando tecnologias amplamente adotadas pelo mercado e pela comunidade de desenvolvimento web.

Este documento descreve, de forma técnica e detalhada, os aspectos tecnológicos que compõem a camada de interface do usuário (*front-end*) do sistema SMSAgenda, abordando a arquitetura de software, as bibliotecas e frameworks empregados, os padrões de projeto adotados, os mecanismos de segurança implementados e a infraestrutura de deploy.

---

## 2. Arquitetura Geral do Front-End

A arquitetura do front-end do SMSAgenda segue o modelo de **Single Page Application (SPA)**, na qual toda a lógica de renderização de páginas ocorre no lado do cliente (*client-side rendering*). O navegador carrega um único documento HTML que serve como ponto de entrada, e todo o roteamento e renderização subsequente são gerenciados pelo JavaScript executado no browser.

A aplicação adota uma **arquitetura em camadas**, organizada da seguinte forma:

```
┌──────────────────────────────────────────────────────┐
│                    Camada de Apresentação             │
│          (Páginas, Componentes, Layout, UI)           │
├──────────────────────────────────────────────────────┤
│                  Camada de Gerenciamento de Estado    │
│        (Zustand, React Query, Context API)            │
├──────────────────────────────────────────────────────┤
│                    Camada de Serviços                 │
│          (Axios, Auth Service, API Service)           │
├──────────────────────────────────────────────────────┤
│                    Camada de Tipos                    │
│            (TypeScript Interfaces e Types)            │
├──────────────────────────────────────────────────────┤
│                Camada de Utilitários                  │
│      (Logger, Cookie Utils, CPF Utils, Versão)        │
└──────────────────────────────────────────────────────┘
```

O ponto de entrada da aplicação (`main.tsx`) estabelece a hierarquia de provedores (*providers*) que envolvem toda a árvore de componentes:

```
StrictMode
  └── BrowserRouter          (Roteamento)
       └── QueryClientProvider  (Cache de dados do servidor)
            └── AuthProvider      (Contexto de autenticação)
                 └── App           (Componente raiz com rotas)
```

Essa hierarquia garante que todos os componentes da aplicação tenham acesso ao sistema de roteamento, ao cache de dados do servidor e ao contexto de autenticação do usuário.

---

## 3. Stack Tecnológica

### 3.1 React 19 e TypeScript

O front-end é construído sobre o **React 19** (`react: ^19.1.1`), a versão mais recente da biblioteca de interfaces de usuário mantida pela Meta (anteriormente Facebook). O React implementa o paradigma de **programação declarativa baseada em componentes**, onde a interface é descrita como uma função do estado da aplicação.

O projeto utiliza exclusivamente **componentes funcionais** com **React Hooks**, dispensando o uso de componentes de classe. Os hooks mais utilizados na aplicação incluem:

- **`useState`**: Gerenciamento de estado local dos componentes.
- **`useEffect`**: Efeitos colaterais como chamadas à API e manipulação do DOM.
- **`useContext`**: Consumo de contextos compartilhados (autenticação).
- **`useNavigate`** e **`useLocation`**: Navegação programática e acesso à localização atual.
- **`useParams`**: Extração de parâmetros de rotas dinâmicas.

O **TypeScript** (`typescript: ~5.8.3`) é utilizado em toda a base de código, fornecendo **tipagem estática** que permite a detecção de erros em tempo de compilação. A configuração do TypeScript adota o modo `strict: true`, garantindo verificações rigorosas de tipos, incluindo checagem de valores nulos e indefinidos. O *target* de compilação é `ES2022`, possibilitando o uso de funcionalidades modernas do ECMAScript.

### 3.2 Vite como Bundler e Dev Server

O **Vite** (`vite: ^7.1.7`) é o *build tool* utilizado no projeto, substituindo alternativas tradicionais como Webpack ou Create React App. O Vite oferece:

- **Hot Module Replacement (HMR)** instantâneo: atualizações em tempo real durante o desenvolvimento, sem necessidade de recarregar a página.
- **Build otimizado com Rollup**: para produção, o Vite utiliza o Rollup como *bundler*, gerando *bundles* otimizados com *tree-shaking* (eliminação de código não utilizado), *code splitting* (divisão de código por rotas) e minificação.
- **Suporte nativo a ESM**: módulos ECMAScript são tratados nativamente, sem necessidade de transpilação durante o desenvolvimento.
- **Proxy de desenvolvimento**: a configuração inclui um proxy que encaminha requisições `/api` para o servidor backend (`http://devcac:6004`), evitando problemas de CORS em ambiente de desenvolvimento.

O plugin `@vitejs/plugin-react-swc` é utilizado para compilação do React com **SWC** (*Speedy Web Compiler*), um compilador escrito em Rust que substitui o Babel com ganhos significativos de performance na compilação.

A configuração define **aliases de importação** (`@/` → `./src/`), permitindo importações absolutas como `@/components/ui/button` em vez de caminhos relativos complexos.

### 3.3 Tailwind CSS v4 e Sistema de Design

O **Tailwind CSS v4** (`tailwindcss: ^4.1.15`) é o framework de estilização adotado, implementando a abordagem de **utility-first CSS**. Nessa filosofia, os estilos são aplicados diretamente nos elementos HTML por meio de classes utilitárias predefinidas, eliminando a necessidade de criar arquivos CSS separados para cada componente.

O sistema de design é configurado no arquivo `index.css` utilizando a diretiva `@theme inline`, que define variáveis CSS customizadas para todo o projeto:

- **Cores institucionais**: `--azul-claro` (#42b9eb), `--azul-medio` (#2a688f), `--azul-escuro` (#13335a).
- **Sistema de cores da sidebar**: variáveis separadas para fundo, texto, destaque e borda da barra lateral.
- **Sistema de raios de borda**: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, derivados de uma variável base `--radius`.
- **Suporte a tema escuro**: variáveis CSS redefinidas dentro do seletor `.dark`, permitindo troca de tema sem alteração de classes nos componentes.
- **Tipografia personalizada**: utilização da fonte **Cera Pro** em três variações de peso (Regular 400, Medium 500, Black 900).
- **Animação de shimmer**: animação customizada para componentes *skeleton* de carregamento.

A integração com o Vite é feita pelo plugin `@tailwindcss/vite`, que processa as classes Tailwind em tempo de build.

### 3.4 Shadcn/UI e Radix UI

O projeto utiliza o **Shadcn/UI** como sistema de componentes, conforme configurado no arquivo `components.json`. O Shadcn/UI não é uma biblioteca instalada via npm, mas sim um gerador de componentes que copia o código-fonte diretamente para o projeto, permitindo **total customização**. A configuração adota o estilo `new-york` com **variáveis CSS** para cores e o **Lucide React** como biblioteca de ícones.

Os componentes gerados pelo Shadcn/UI são baseados no **Radix UI**, uma biblioteca de primitivos de interface (*headless UI*) que fornece:

- **Acessibilidade nativa**: todos os componentes seguem as especificações WAI-ARIA.
- **Comportamento sem estilo**: os componentes fornecem apenas a lógica de interação, deixando a estilização livre.
- **Composição**: componentes são construídos por composição de primitivos menores.

A aplicação utiliza os seguintes primitivos Radix UI:

| Primitivo | Finalidade |
|-----------|------------|
| `@radix-ui/react-dialog` | Modais e diálogos de confirmação |
| `@radix-ui/react-dropdown-menu` | Menus suspensos contextuais |
| `@radix-ui/react-select` | Campos de seleção acessíveis |
| `@radix-ui/react-popover` | Popovers para filtros e calendários |
| `@radix-ui/react-tooltip` | Dicas de contexto (*tooltips*) |
| `@radix-ui/react-checkbox` | Caixas de seleção nos filtros de salas |
| `@radix-ui/react-tabs` | Navegação por abas |
| `@radix-ui/react-accordion` | Seções expansíveis |
| `@radix-ui/react-alert-dialog` | Diálogos de alerta com confirmação |
| `@radix-ui/react-avatar` | Avatares de usuário na sidebar |
| `@radix-ui/react-collapsible` | Itens recolhíveis da navegação |
| `@radix-ui/react-scroll-area` | Áreas de rolagem estilizadas |
| `@radix-ui/react-separator` | Separadores visuais |
| `@radix-ui/react-switch` | Switches de alternância |
| `@radix-ui/react-toggle` | Botões de alternância |
| `@radix-ui/react-progress` | Barras de progresso |
| `@radix-ui/react-slider` | Controles deslizantes |
| `@radix-ui/react-label` | Rótulos acessíveis para formulários |
| `@radix-ui/react-radio-group` | Grupos de botões de rádio |
| `@radix-ui/react-navigation-menu` | Menus de navegação |
| `@radix-ui/react-hover-card` | Cards exibidos ao passar o mouse |
| `@radix-ui/react-menubar` | Barras de menu |
| `@radix-ui/react-context-menu` | Menus de contexto (clique direito) |
| `@radix-ui/react-aspect-ratio` | Controle de proporção de elementos |
| `@radix-ui/react-slot` | Composição de componentes via slot |

---

## 4. Estrutura de Diretórios e Organização do Código

O código-fonte do front-end está organizado dentro do diretório `SMSAgenda/src/`, seguindo uma estrutura baseada em **separação por responsabilidade funcional**:

```
src/
├── main.tsx                  # Ponto de entrada da aplicação
├── App.tsx                   # Definição de rotas e componente raiz
├── index.css                 # Estilos globais e variáveis CSS
├── App.css                   # Estilos específicos do componente App
│
├── assets/                   # Recursos estáticos
│   └── icons/                # Ícones da aplicação
│
├── components/               # Componentes reutilizáveis
│   ├── layout.tsx            # Layout principal com sidebar
│   ├── app-sidebar.tsx       # Componente da sidebar
│   ├── nav-main.tsx          # Navegação principal
│   ├── nav-user.tsx          # Menu do usuário
│   ├── page-breadcrumb.tsx   # Breadcrumb automático
│   ├── sidebar-footer.tsx    # Rodapé da sidebar
│   ├── button-custom.tsx     # Botões personalizados
│   ├── agenda-skeleton.tsx   # Skeleton de carregamento
│   └── ui/                   # ~45 componentes Shadcn/UI
│
├── fonts/                    # Fontes customizadas
│   └── fonts.css             # Declarações @font-face
│
├── hooks/                    # React Hooks customizados
│   └── use-mobile.ts         # Detecção de dispositivo móvel
│
├── lib/                      # Bibliotecas e utilitários
│   ├── utils.ts              # Função cn() para classes CSS
│   ├── logger.ts             # Sistema de logging estruturado
│   ├── versao.ts             # Utilitários de versão/build
│   └── auth/                 # Módulo de autenticação
│       ├── auth-context.tsx  # Provider de autenticação
│       ├── auth-queries.ts   # Mutations React Query
│       ├── auth-service.ts   # Serviço HTTP de autenticação
│       ├── auth-store.ts     # Store Zustand de autenticação
│       ├── auth.ts           # Funções utilitárias de auth
│       └── cookie-utils.ts   # Gerenciamento de cookies
│
├── pages/                    # Páginas/telas da aplicação
│   ├── Agenda.tsx            # Visualização de agenda
│   ├── NovoAgendamento.tsx   # Criação de agendamentos
│   ├── DescricaoAgendamento.tsx # Detalhes do agendamento
│   ├── GerenciarAgendamentos.tsx # Gestão de agendamentos
│   ├── GerenciarSalas.tsx    # Gestão de salas
│   ├── GerenciarUsuarios.tsx # Gestão de usuários
│   ├── MeusAgendamentos.tsx  # Meus agendamentos
│   ├── Suporte.tsx           # Página de suporte
│   ├── login.tsx             # Tela de login
│   ├── register.tsx          # Tela de registro
│   ├── verify-form.tsx       # Verificação de código 2FA
│   ├── forgot-password-form.tsx # Esqueci minha senha
│   └── reset-password-form.tsx  # Redefinição de senha
│
├── routes/                   # Definições de rotas
│   └── PrivateRoute.tsx      # Componente de rota protegida
│
├── services/                 # Serviços de comunicação
│   ├── api.tsx               # Instância Axios configurada
│   └── solicitante-service.ts # Serviço CRUD de solicitante
│
├── types/                    # Definições de tipos TypeScript
│   ├── auth.ts               # Tipos de autenticação
│   └── solicitante.ts        # Tipos de solicitante
│
└── utils/                    # Funções utilitárias
    └── cpf-utils.ts          # Formatação e validação de CPF
```

---

## 5. Sistema de Roteamento

### 5.1 Configuração de Rotas

O roteamento da aplicação é implementado com o **React Router DOM v7** (`react-router-dom: ^7.9.4`), o padrão de fato para roteamento em aplicações React. O componente `BrowserRouter` é configurado no `main.tsx`, e as rotas são declaradas no `App.tsx` utilizando os componentes `Routes` e `Route`.

A aplicação define as seguintes rotas:

| Rota | Componente | Proteção | Descrição |
|------|-----------|----------|-----------|
| `/` | `Navigate → /agenda` | — | Redirecionamento automático |
| `/agenda` | `Agenda` | Autenticado | Visualização da agenda |
| `/novo_agendamento` | `NovoAgendamento` | Autenticado + Não-Viewer | Criação de agendamento |
| `/descricao_agendamento/:id` | `DescricaoAgendamento` | Autenticado + Não-Viewer | Detalhes de um agendamento |
| `/gerenciar_agendamentos` | `GerenciarAgendamentos` | Autenticado | Gestão de agendamentos |
| `/gerenciar_salas` | `GerenciarSalas` | Autenticado + Admin | Gestão de salas |
| `/gerenciar_usuarios` | `GerenciarUsuarios` | Autenticado + Admin | Gestão de usuários |
| `/suporte` | `Suporte` | Autenticado | Informações de suporte |
| `/login` | `LoginForm` | Pública | Formulário de login |
| `/registrar` | `RegisterForm` | Pública | Formulário de registro |
| `/auth/esqueci-senha` | `ForgotPasswordForm` | Pública | Recuperação de senha |
| `/auth/verificar-codigo` | `VerifyForm` | Pública | Verificação 2FA |
| `/auth/trocar-senha` | `ResetPasswordForm` | Pública | Redefinição de senha |

As rotas protegidas são envolvidas pelo componente `PrivateRoute` e pelo `CompleteLayout`, que fornece a estrutura visual padrão com sidebar e header.

### 5.2 Rotas Protegidas e Controle de Acesso

O componente `PrivateRoute` implementa um mecanismo de **controle de acesso baseado em papéis** (RBAC — *Role-Based Access Control*). A cada requisição de navegação, o componente:

1. **Verifica a existência de um token JWT** válido nos cookies do navegador.
2. **Decodifica o payload do token** para extrair o nível de permissão do usuário.
3. **Aplica regras de acesso** baseadas no papel do usuário:

| Permissão | Código | Acesso |
|-----------|--------|--------|
| Admin | 1 | Acesso total a todas as rotas |
| Solicitante Normal | 2, 3 | Não pode acessar aprovação de agendamentos, gerenciamento de usuários e salas |
| Viewer (Visualizador) | 4, 5 | Não pode criar nem aprovar agendamentos; não gerencia usuários e salas |

Caso o usuário não possua token válido, é redirecionado para `/login`. Caso possua token, mas sem permissão para a rota, é redirecionado para `/agenda`.

---

## 6. Gerenciamento de Estado

A aplicação adota uma estratégia de **gerenciamento de estado distribuído**, utilizando três mecanismos complementares conforme a natureza dos dados.

### 6.1 Zustand — Estado Global

O **Zustand** (`zustand: ^5.0.8`) é utilizado para gerenciar o estado global da aplicação, particularmente no módulo de autenticação (`auth-store.ts`). O Zustand foi escolhido por sua simplicidade e leveza em relação a alternativas como Redux, oferecendo:

- **API minimalista**: Criação de *stores* com a função `create`.
- **Sem boilerplate**: Não requer *reducers*, *actions* ou *dispatchers* separados.
- **Acesso direto**: Estado pode ser acessado fora de componentes React via `useAuthStore.getState()`.
- **Reatividade seletiva**: Componentes re-renderizam apenas quando a fatia específica do estado que consomem é alterada.

O `AuthState` gerencia: dados do usuário autenticado, estado de carregamento, erros, dados do solicitante e ações de login, logout, renovação de token e troca de senha.

### 6.2 React Query (TanStack Query) — Estado do Servidor

O **TanStack React Query** (`@tanstack/react-query: ^5.90.8`) é utilizado para gerenciar o **estado do servidor** — dados que residem na API e precisam ser buscados, cacheados e sincronizados. Os benefícios incluem:

- **Cache automático**: Dados buscados são armazenados em memória e reutilizados.
- **Invalidação inteligente**: O cache pode ser invalidado seletivamente quando dados são modificados.
- **Stale-while-revalidate**: Dados obsoletos são exibidos imediatamente enquanto novos dados são buscados em segundo plano.
- **Gerenciamento de mutations**: Operações de escrita (POST, PUT, DELETE) são gerenciadas com feedback de carregamento e erro.

No módulo de autenticação, são definidas diversas *mutations* e *queries*:

| Hook | Tipo | Finalidade |
|------|------|-----------|
| `useMeQuery` | Query | Obtém dados do usuário logado a partir do token JWT |
| `useLoginMutation` | Mutation | Primeira etapa do login (envia código 2FA) |
| `useConfirm2FAMutation` | Mutation | Confirma código 2FA e finaliza login |
| `useRegisterMutation` | Mutation | Registro de novo usuário |
| `usePasswordChangeMutation` | Mutation | Troca de senha |
| `useForgotPasswordMutation` | Mutation | Solicita recuperação de senha |
| `useLogoutMutation` | Mutation | Encerra sessão atual |
| `useLogoutAllSessionsMutation` | Mutation | Encerra todas as sessões do usuário |

A *query* `useMeQuery` possui configuração de **staleTime** de 5 minutos e **gcTime** (*garbage collection time*) de 10 minutos, otimizando o número de requisições ao servidor.

### 6.3 Context API — Contexto de Autenticação

A **React Context API** é utilizada para prover o estado de autenticação a toda a árvore de componentes. O `AuthProvider` encapsula a lógica de verificação de autenticação, combinando:

- **Verificação de cookies**: Monitora a existência de tokens válidos nos cookies.
- **Polling periódico**: A cada 500ms, verifica se os cookies de autenticação mudaram (ex.: após troca de senha).
- **Subscrição ao cache**: Observa mudanças na *query cache* do React Query para reagir a invalidações.

O hook `useAuth()` expõe três valores:
- `usuario`: Dados do usuário autenticado (ou `null`).
- `estaAutenticado`: Booleano indicando se o usuário está autenticado.
- `carregando`: Booleano indicando se a verificação está em andamento.

---

## 7. Sistema de Autenticação e Segurança

### 7.1 Fluxo de Autenticação com 2FA

O sistema implementa um fluxo de autenticação em **duas etapas** (*Two-Factor Authentication — 2FA*):

```
┌─────────┐    Email/Senha     ┌────────────┐    Código 2FA    ┌──────────────┐
│  Login   │ ──────────────► │ Verificar  │ ──────────────► │  Autenticado │
│  Form    │                   │  Código    │                   │  (Dashboard) │
└─────────┘                    └────────────┘                   └──────────────┘
      │                              │
      │ (Senha expirada)             │ (Código inválido)
      ▼                              ▼
┌─────────────┐              ┌──────────────┐
│ Trocar      │              │ Reenviar     │
│ Senha       │              │ Código       │
└─────────────┘              └──────────────┘
```

1. **Etapa 1 — Credenciais**: O usuário informa email e senha. O backend valida as credenciais e envia um código de verificação para o email cadastrado.
2. **Etapa 2 — Código 2FA**: O usuário informa o código de 6 dígitos recebido por email. O backend valida o código e retorna os tokens JWT.

Fluxos especiais tratados:
- **Senha expirada**: Se o backend indica `senhaExpirada: true`, o usuário é redirecionado para trocar a senha.
- **Primeira troca de senha**: Se `precisaTrocarSenha: true`, o fluxo é idêntico ao de senha expirada.
- **Usuário sem permissão**: Se o login retorna erro de acesso, o front-end redireciona para a página de registro.

### 7.2 Gerenciamento de Tokens JWT

Os tokens de acesso são armazenados em **cookies do navegador** (não em `localStorage` ou `sessionStorage`), conforme boas práticas de segurança:

- **`auth_token`** (Access Token): Token JWT com validade de 2 horas, utilizado para autorizar requisições à API.
- **`auth_refresh_token`** (Refresh Token): Token opaco com validade de 7 dias, utilizado para renovar o access token.

A função `getTokenInfo()` decodifica o payload do JWT (sem verificação de assinatura no front-end — a verificação ocorre no backend) e extrai informações como: email, ID do usuário, nome completo, tipo de permissão, CPF e ID do sistema.

A decodificação utiliza `atob()` seguida de `TextDecoder('utf-8')` para tratamento correto de caracteres Unicode (como acentos em nomes brasileiros).

### 7.3 Gerenciamento de Cookies

O módulo `cookie-utils.ts` implementa uma abstração para manipulação de cookies com suporte a:

- **Configuração de segurança**: `SameSite`, `Secure`, `Path`, `Domain`, `MaxAge`, `Expires`.
- **Codificação/decodificação**: Nomes e valores são codificados com `encodeURIComponent` para segurança.
- **Operações CRUD**: `setCookie`, `getCookie`, `removeCookie`, `hasCookie`, `getAllCookies`.
- **Validação de formato**: `isCookieValid` verifica se tokens nos cookies têm formato JWT (3 partes separadas por ponto).

### 7.4 Renovação Automática de Tokens

A renovação de tokens é implementada em duas camadas:

1. **Renovação proativa** (interceptador de requisição): Antes de cada requisição à API, o interceptador do Axios verifica se o token está próximo de expirar (menos de 5 minutos). Caso esteja, o token é renovado **antes** de enviar a requisição, evitando erros 401.

2. **Renovação reativa** (interceptador de resposta): Se uma requisição retorna erro 401 (*Unauthorized*), o interceptador tenta renovar o token e **refazer a requisição automaticamente**, de forma transparente para o usuário.

Um mecanismo de **flag de exclusão mútua** (`isRefreshing`) evita múltiplas renovações simultâneas quando diversas requisições são disparadas ao mesmo tempo.

### 7.5 Sistema de Permissões

O sistema implementa três níveis de permissão, derivados do token JWT:

| Permissão API | Nome | Código Interno | Capacidades |
|:---:|:---:|:---:|---|
| 1 | Administrador | 1 | Acesso total: gerenciar salas, usuários, aprovar/recusar/cancelar agendamentos |
| 2, 3 | Solicitante Normal | 0 | Criar agendamentos, visualizar agenda completa |
| 4, 5 | Visualizador (Viewer) | 2 | Apenas visualizar agenda (títulos ocultos, mostra "Reunião Marcada") |

O mapeamento entre os códigos da API de autenticação e os códigos internos do sistema de agenda é feito durante o login, na sincronização do solicitante.

---

## 8. Camada de Serviços e Comunicação com API

### 8.1 Configuração do Axios

O **Axios** (`axios: ^1.13.1`) é a biblioteca HTTP utilizada para comunicação com as APIs backend. A aplicação mantém **duas instâncias do Axios**:

1. **`api`** (em `services/api.tsx`): Instância principal para comunicação com a API de agendamentos (`VITE_API_BASE_URL`). Configurada com interceptadores de autenticação.

2. **`authApi`** (em `lib/auth/auth-service.ts`): Instância dedicada para comunicação com a API de autenticação (`VITE_API_URL_AUTH`), com timeout de 10 segundos.

A URL base é definida por variáveis de ambiente, com *fallback* para o proxy do Vite (`/api`) em desenvolvimento.

### 8.2 Interceptadores de Requisição e Resposta

O interceptador de **requisição** (`request interceptor`):
- Obtém o token JWT atual dos cookies.
- Verifica se o token está próximo de expirar.
- Se necessário, renova proativamente o token.
- Adiciona o header `Authorization: Bearer <token>` a todas as requisições.

O interceptador de **resposta** (`response interceptor`):
- Detecta respostas com status 401 (não autorizado).
- Tenta renovar o token e refazer a requisição falhada.
- Marca a requisição com `_retry` para evitar loops infinitos.

### 8.3 Serviço de Autenticação

O `authService` centraliza todas as operações de autenticação, comunicando-se com os endpoints da API:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `register` | `POST /Auth/register` | Registro de novo usuário |
| `login` | `POST /Auth/login` | Login (1ª etapa) |
| `confirmarCodigo2FA` | `POST /Auth/confirmar-codigo-2fa` | Verificação 2FA |
| `trocarSenha` | `POST /Auth/trocar-senha` | Troca de senha |
| `esqueciSenha` | `POST /Auth/esqueci-senha` | Recuperação de senha |
| `renovarToken` | `POST /Auth/refresh-token` | Renovação de token |
| `logout` | `POST /Auth/logout` | Encerrar sessão |
| `logoutTodasSessoes` | `POST /Auth/logout-all-sessions` | Encerrar todas as sessões |
| `verificarAcesso` | `GET /usuario-permissao-sistema/verificar-acesso/:id` | Verificar acesso ao sistema |
| `darPermissaoSistema` | `POST /usuario-permissao-sistema` | Conceder permissão |
| `atualizarPermissaoSistema` | `PUT /usuario-permissao-sistema/:id` | Atualizar permissão |
| `buscarPermissaoUsuarioSistema` | `GET /usuario-permissao-sistema` | Buscar permissão |
| `buscarUsuarioPorEmail` | `GET /usuarios` | Buscar usuário por email |

Todos os métodos tratam erros da API, retornando respostas estruturadas ou lançando exceções.

### 8.4 Serviço de Solicitante

O `solicitanteService` gerencia o vínculo entre o usuário autenticado e seu registro como "solicitante" no sistema de agendamentos:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `buscarPorId` | `GET /Solicitante/:id` | Busca por ID numérico |
| `buscarPorAuthId` | `GET /Solicitante/authid/:authId` | Busca por UUID da API Auth |
| `buscarPorEmail` | `GET /Solicitante` | Busca por email (legado) |
| `criar` | `POST /Solicitante` | Cria novo registro |
| `atualizar` | `PUT /Solicitante/:id` | Atualiza registro existente |
| `sincronizar` | Composto | Busca ou cria/atualiza automaticamente |

O método `sincronizar` implementa um padrão **upsert**: busca o solicitante pelo `authId` (ou email como *fallback*); se não encontrado, cria; se encontrado e com dados desatualizados (tipo, nome, setor, IDs), atualiza.

---

## 9. Tipagem e Contratos de Dados

O TypeScript é utilizado extensivamente para definir **contratos de dados** que espelham as estruturas retornadas pelas APIs. Os principais tipos são:

**Autenticação (`types/auth.ts`)**:
- `Usuario`: Representa o usuário autenticado (id, email, nomeCompleto, tipoUsuario, etc.).
- `LoginRequest` / `LoginResponse`: Contrato da requisição/resposta de login.
- `ConfirmarCodigo2FARequest` / `ConfirmarCodigo2FAResponse`: Contrato da verificação 2FA.
- `RegisterRequest` / `RegisterResponse`: Contrato de registro.
- `TrocarSenhaRequest` / `TrocarSenhaResponse`: Contrato de troca de senha.
- `RefreshTokenRequest` / `RefreshTokenResponse`: Contrato de renovação de token.
- `JWTPayload`: Estrutura do payload decodificado do JWT.
- `UsuarioPermissaoSistemaItem`: Permissão do usuário em um sistema.

**Solicitante (`types/solicitante.ts`)**:
- `SolicitanteRequest`: Dados para criar/atualizar um solicitante (nome, email, tipo, setor, authId, authPermId).
- `SolicitanteResponse`: Resposta completa do solicitante com ID numérico.

A tipagem garante que incompatibilidades entre o front-end e o back-end sejam detectadas em tempo de compilação.

---

## 10. Componentes e Interface do Usuário

### 10.1 Componentes de Layout

O componente `CompleteLayout` (`layout.tsx`) define a estrutura visual padrão para todas as páginas autenticadas:

```
┌──────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────────────────┐ │
│ │          │ │        Header (Breadcrumb)       │ │
│ │          │ ├──────────────────────────────────┤ │
│ │ Sidebar  │ │                                  │ │
│ │          │ │         Conteúdo (children)       │ │
│ │          │ │                                  │ │
│ │          │ │                                  │ │
│ └──────────┘ └──────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

O layout adapta automaticamente os itens de navegação com base no nível de permissão do usuário:
- **Admin**: Acesso a Agenda, Novo Agendamento, Gerenciar Agendamentos, Gerenciar Salas, Gerenciar Usuários, Suporte.
- **Solicitante**: Agenda, Novo Agendamento, Suporte.
- **Viewer**: Agenda, Suporte.

A sidebar colapsa automaticamente em telas com largura inferior a 1300px, utilizando a funcionalidade `open={false}` do `SidebarProvider`.

### 10.2 Sistema de Sidebar e Navegação

O sistema de sidebar é composto por múltiplos componentes:

- **`AppSidebar`**: Componente principal que monta o layout da sidebar com logo, navegação e rodapé.
- **`NavMain`**: Renderiza os itens de navegação com suporte a sub-itens colapsáveis. Detecta a rota ativa e aplica estilização de destaque.
- **`NavUser`**: Exibe avatar do usuário com menu suspenso contendo opções de perfil e logout.
- **`PageBreadcrumb`**: Gera automaticamente a trilha de navegação (*breadcrumb*) com base na rota atual, usando um mapa de rótulos.
- **`SidebarFooter`**: Exibe informações de versão do sistema com tooltip contendo *metadata* de build (versão, número do build, SHA do commit, data).

### 10.3 Biblioteca de Componentes UI

O diretório `components/ui/` contém aproximadamente **45 componentes** reutilizáveis gerados pelo Shadcn/UI. Cada componente segue o padrão de composição (*compound component pattern*), onde componentes maiores são construídos pela combinação de sub-componentes menores:

```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecione" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opcao1">Opção 1</SelectItem>
    <SelectItem value="opcao2">Opção 2</SelectItem>
  </SelectContent>
</Select>
```

A função utilitária `cn()` (`lib/utils.ts`) combina as bibliotecas **clsx** e **tailwind-merge** para mesclagem inteligente de classes CSS, resolvendo conflitos entre classes Tailwind automaticamente.

### 10.4 Componentes Personalizados

Além dos componentes do Shadcn/UI, a aplicação define componentes personalizados:

- **`ButtonCustomOutline`**: Botão com contorno azul institucional.
- **`ButtonCustomMdl`**: Botão para uso em modais/diálogos.
- **`ButtonCustomAprovar`**: Botão verde para ações de aprovação.
- **`ButtonCustomRecusar`**: Botão vermelho para ações de recusa.
- **`ButtonCustomCancelar`**: Botão vermelho para ações de cancelamento.
- **`AgendaSkeleton`**: Componente *skeleton* que exibe uma representação visual da agenda durante o carregamento, com três variantes (Dia, Semana, Mês).

---

## 11. Páginas da Aplicação

### 11.1 Agenda (Visualização Principal)

A página `Agenda.tsx` (~1248 linhas) é a tela principal da aplicação, implementando um calendário interativo com **três modos de visualização**:

- **Dia**: Grade vertical com slots de 15 minutos (09:00–17:45), exibindo agendamentos como cartões posicionados conforme horário e duração.
- **Semana**: Grade com 5 colunas (segunda a sexta) × slots de 15 minutos.
- **Mês**: Grade mensal com dias úteis, exibindo indicadores de agendamentos.

**Funcionalidades técnicas notáveis**:
- **Cache de dados**: Os agendamentos são buscados para um intervalo de ±30 dias em relação à data selecionada. Navegações dentro desse intervalo utilizam dados do cache, evitando requisições desnecessárias.
- **Filtro de salas**: Um popover permite selecionar quais salas exibir, com cores diferenciadas por sala.
- **Persistência de estado**: A data selecionada e o formato de visualização são persistidos no `sessionStorage`, mantendo a posição do usuário ao navegar entre páginas.
- **Distinção de propriedade**: Para solicitantes não-admin, a API retorna `meus` (agendamentos do usuário) e `outros` (agendamentos de terceiros com informações limitadas), garantindo privacidade.
- **Cálculo dinâmico de posição**: Os cartões de agendamento são posicionados calculando `top` e `height` baseados na conversão de horários para índices na grade de 15 minutos.

### 11.2 Novo Agendamento

A página `NovoAgendamento.tsx` (~1129 linhas) implementa o formulário de criação de agendamentos com:

- **Persistência de rascunho**: O estado do formulário é salvo no `localStorage`, permitindo que o usuário retome o preenchimento após sair da página.
- **Validação de data**: Implementa regras de negócio complexas para o período mínimo de antecedência, variando conforme o dia do mês.
- **Validação de horário**: Duração mínima de 10 minutos, horários dentro do período de funcionamento da sala.
- **Verificação de conflitos**: Antes de submeter, verifica se existe conflito com agendamentos aprovados (regra de intervalo mínimo de 30 minutos).
- **Seleção de sala**: Filtrada pela capacidade necessária, com pré-visualização de imagem.
- **Termos de uso**: Modal obrigatório de aceitação antes da submissão.

### 11.3 Descrição do Agendamento

A página `DescricaoAgendamento.tsx` (~793 linhas) exibe os detalhes completos de um agendamento, incluindo:

- **Layout de duas colunas**: Informações do agendamento à esquerda, imagem e dados da sala à direita.
- **Ações condicionais**: Botões de Aprovar, Recusar e Cancelar exibidos conforme permissão do usuário e status do agendamento.
- **Verificação de expiração**: Um timer a cada 10 segundos verifica se o agendamento expirou.
- **Guardas de concorrência**: Antes de executar ações (aprovar/recusar/cancelar), busca o status atual do agendamento para evitar conflitos de estado.

### 11.4 Gerenciar Agendamentos

A página `GerenciarAgendamentos.tsx` (~1064 linhas) é a tela administrativa para gestão de todos os agendamentos do sistema:

- **Tabela paginada server-side**: Dados paginados vindos da API.
- **Múltiplos filtros**: Título (busca textual), sala (select), status (com padrão PENDENTE), período (date picker).
- **Ações em massa**: Aprovar, recusar, cancelar, marcar como falha técnica.
- **Detecção de conflitos**: Antes de aprovar, verifica a regra de intervalo mínimo de 30 minutos entre agendamentos na mesma sala.
- **Atualização periódica**: Timer a cada 30 segundos verificando expiração de agendamentos.

### 11.5 Gerenciar Salas

A página `GerenciarSalas.tsx` (~295 linhas) permite a administração de salas de reunião:

- **Alternância de disponibilidade**: Toggle para marcar salas como Disponível/Indisponível.
- **Filtro por nome**: Campo de busca textual.
- **Tabela com detalhes**: Nome, capacidade, equipamentos, horários de funcionamento.

### 11.6 Gerenciar Usuários

A página `GerenciarUsuarios.tsx` (~510 linhas) permite a gestão de usuários e suas permissões:

- **Alteração de permissões**: Dropdown para alterar entre Visualizador, Solicitante Normal e Solicitante Administrador.
- **Filtros**: Nome, email, setor, tipo de usuário.
- **Sincronização dupla**: Ao alterar permissão, atualiza tanto na API de autenticação quanto na API de agendamentos (solicitante).

### 11.7 Páginas de Autenticação

As páginas de autenticação implementam fluxos específicos:

- **Login (`login.tsx`)**: Formulário com animações Framer Motion, validação de campos, redirecionamento para 2FA.
- **Registro (`register.tsx`)**: Formulário com validação de CPF (algoritmo oficial), formatação automática com máscara, campo de setor, e diálogo de sucesso informando a senha temporária.
- **Verificação 2FA (`verify-form.tsx`)**: Input OTP de 6 dígitos com suporte a Ctrl+V, timer regressivo de 5 minutos, funcionalidade de reenvio de código.
- **Esqueci a Senha (`forgot-password-form.tsx`)**: Formulário de email que dispara o envio do código de recuperação.
- **Redefinição de Senha (`reset-password-form.tsx`)**: Formulário com medidor de força de senha, checklist de 6 requisitos (maiúscula, minúscula, número, especial, comprimento, sem espaços).

---

## 12. Validação de Formulários

A aplicação utiliza a combinação de **React Hook Form** (`react-hook-form: ^7.65.0`), **Zod** (`zod: ^4.1.12`) e **@hookform/resolvers** para validação de formulários:

- **React Hook Form**: Gerencia o estado do formulário com performance otimizada (atualizações não controladas — *uncontrolled*).
- **Zod**: Define schemas de validação tipados em TypeScript, garantindo correspondência entre validação em runtime e tipos em compilação.
- **Resolvers**: Conectam os schemas Zod ao React Hook Form.

Validações específicas implementadas:
- **CPF**: Validação algorítmica oficial (dois dígitos verificadores), formatação automática com máscara `000.000.000-00`.
- **Senha**: Mínimo 8 caracteres, letra maiúscula, minúscula, número, caractere especial, sem espaços.
- **Email**: Validação de formato.
- **Datas**: Validação de período mínimo de antecedência, dias úteis.
- **Horários**: Validação de intervalo mínimo de 10 minutos, dentro do horário de funcionamento.

---

## 13. Sistema de Logging

O módulo `logger.ts` implementa um **sistema de logging estruturado** para a aplicação, com as seguintes características:

- **Cinco níveis de log**: `trace`, `debug`, `info`, `warn`, `error`.
- **Prefixos contextuais**: Cada logger é criado com um nome de serviço, componente ou hook.
- **Logging condicional**: Os níveis `trace` e `debug` só emitem saída em ambiente de desenvolvimento (`import.meta.env.DEV`).
- **Contexto estruturado**: Suporte a objetos de contexto serializados em JSON.
- **Fábricas especializadas**:
  - `createServiceLogger('auth')` → `[auth] mensagem`
  - `createComponentLogger('Agenda')` → `[component:Agenda] mensagem`
  - `createHookLogger('useAuth')` → `[hook:useAuth] mensagem`
- **Logger global**: Instância padrão `logger` com prefixo `[app]`.
- **Função `logError`**: Captura nome, mensagem e stack trace de erros.

---

## 14. Responsividade e Experiência Mobile

A aplicação implementa responsividade através de múltiplos mecanismos:

- **Tailwind CSS responsive**: Utilização de prefixos responsivos (`sm:`, `md:`, `lg:`, `xl:`) para adaptar layouts.
- **Hook `useIsMobile`**: Detecta dispositivos com largura inferior a 768px usando `window.matchMedia`, com listener de mudança.
- **Sidebar responsiva**: Colapsa automaticamente em telas menores, transformando-se em um menu deslizante.
- **Componente `Drawer` (vaul)**: Em dispositivos móveis, dialogs são substituídos por drawers deslizantes vindos da parte inferior da tela.
- **Grid flexível**: As grades da agenda adaptam-se ao tamanho disponível.

A biblioteca **Framer Motion** (`framer-motion: ^12.23.24`) e **Motion** (`motion: ^12.23.24`) são utilizadas para animações de entrada e saída em páginas de autenticação, com transições suaves de opacidade e deslocamento.

---

## 15. Containerização e Deploy

### 15.1 Docker e Multi-Stage Build

O deploy da aplicação utiliza **Docker** com um **multi-stage build** em duas etapas:

**Estágio 1 — Build** (`node:20-slim`):
1. Instala o gerenciador de pacotes **pnpm** (`v9.12.3`).
2. Copia `pnpm-lock.yaml` e `package.json` para otimizar o cache de camadas Docker.
3. Instala dependências com `--frozen-lockfile` (garante reprodutibilidade).
4. Copia o código-fonte e executa `pnpm run build`.
5. Variáveis de ambiente (`VITE_API_BASE_URL`, `VITE_API_URL_AUTH`, `VITE_SYSTEM_ID`) são injetadas como **build args**, sendo incorporadas ao bundle JavaScript em tempo de compilação.

**Estágio 2 — Runtime** (`nginx:1.25-alpine`):
1. Copia apenas os artefatos estáticos gerados (`/app/dist`) para o diretório do Nginx.
2. Aplica a configuração customizada do Nginx.
3. Expõe a porta 80.

Essa abordagem resulta em uma imagem de produção leve (baseada em Alpine Linux), contendo apenas o servidor web e os arquivos estáticos, sem dependências de Node.js.

### 15.2 Nginx como Servidor de Produção

O **Nginx** (`v1.25`) serve como servidor web de produção, configurado com:

- **SPA Fallback**: `try_files $uri $uri/ /index.html` — garante que todas as rotas do React Router sejam servidas pelo `index.html`, permitindo navegação client-side.
- **Compressão gzip**: Habilitada para tipos de conteúdo text/plain, CSS, XML, JavaScript, JSON e SVG, reduzindo o tamanho das transferências.
- **Cache agressivo para assets**: Arquivos em `/assets/` (com hash no nome gerado pelo Vite) recebem `expires 1y` e `Cache-Control: public, immutable`, maximizando o cache no navegador.
- **Proxy reverso** (opcional): Configuração comentada para redirecionar chamadas `/api/` para o backend, caso necessário.

### 15.3 Docker Compose

O `docker-compose.yml` orquestra o serviço de front-end:

- **Porta**: Mapeia `3000:80` (porta 3000 do host para porta 80 do container).
- **Restart policy**: `unless-stopped` — o container reinicia automaticamente, exceto se parado manualmente.
- **Timezone**: Configurado para `America/Sao_Paulo`.
- **Rede**: Rede bridge dedicada (`smsagenda-network`) para isolamento.
- **Labels**: Metadados para identificação do serviço.

---

## 16. Variáveis de Ambiente e Configuração

A aplicação utiliza variáveis de ambiente prefixadas com `VITE_` (padrão do Vite para exposição ao código client-side):

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_BASE_URL` | URL base da API de agendamentos | `http://devcac:6004/api` |
| `VITE_API_URL_AUTH` | URL base da API de autenticação | `http://devcac:7000` |
| `VITE_SYSTEM_ID` | UUID do sistema na API de autenticação | `0f7d734a-a964-4693-...` |
| `VITE_APP_VERSION` | Versão da aplicação | `1.0.0` |
| `VITE_BUILD_NUMBER` | Número do build | `42` |
| `VITE_COMMIT_SHA` | SHA do commit Git | `abc1234` |
| `VITE_BUILD_TIMESTAMP` | Data/hora do build | ISO 8601 |
| `VITE_AMBIENTE` | Ambiente (development/staging/production) | `production` |

O módulo `versao.ts` fornece funções para obter e formatar essas informações, exibidas no rodapé da sidebar.

---

## 17. Qualidade de Código e Ferramentas de Desenvolvimento

### ESLint

O **ESLint** (`eslint: ^9.36.0`) é configurado com o novo formato *flat config* (`eslint.config.js`), incluindo:

- **`@eslint/js`**: Regras recomendadas do JavaScript.
- **`typescript-eslint`**: Regras recomendadas para TypeScript.
- **`eslint-plugin-react-hooks`**: Regras para uso correto dos React Hooks (ex.: dependências do `useEffect`).
- **`eslint-plugin-react-refresh`**: Regras para compatibilidade com Hot Module Replacement.

### Gerenciador de Pacotes

O **pnpm** é o gerenciador de pacotes utilizado, oferecendo:

- **Instalação eficiente**: Utiliza *hard links* e *content-addressable storage*, economizando espaço em disco.
- **Lockfile determinístico**: `pnpm-lock.yaml` garante reprodutibilidade de builds.
- **Compatibilidade com workspaces**: Suporte nativo a monorepos (caso futuro).

### Scripts de Desenvolvimento

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `vite` | Inicia o servidor de desenvolvimento com HMR |
| `build` | `tsc -b && vite build` | Compila TypeScript e gera bundle de produção |
| `lint` | `eslint .` | Executa análise estática do código |
| `preview` | `vite preview` | Serve o build de produção localmente |

---

## 18. Considerações Finais

O front-end do SMSAgenda foi desenvolvido com foco em **manutenibilidade**, **segurança** e **experiência do usuário**. A escolha das tecnologias reflete tendências consolidadas do ecossistema React moderno:

- **React 19** com componentes funcionais e hooks como paradigma de desenvolvimento.
- **TypeScript** com modo strict para segurança de tipos em tempo de compilação.
- **Vite + SWC** para builds rápidos e experiência de desenvolvimento otimizada.
- **Tailwind CSS v4** com Shadcn/UI para estilização consistente e acessível.
- **Zustand + React Query** como solução de gerenciamento de estado escalável e performática.
- **Autenticação robusta** com 2FA, JWT, renovação automática de tokens e RBAC.
- **Docker + Nginx** para deploy containerizado, reprodutível e otimizado para produção.

A arquitetura modular e a separação clara de responsabilidades entre camadas permitem que novos desenvolvedores compreendam e contribuam com o projeto de forma produtiva, enquanto os mecanismos de segurança e validação protegem a integridade dos dados e o acesso ao sistema.

---

## 19. O Backend de Autenticação

O SMSAgenda opera com **dois backends independentes**. Enquanto o backend de agendamentos é responsável por salas, agendamentos e solicitantes, existe um **backend de autenticação centralizado** que é compartilhado por múltiplos sistemas da Secretaria Municipal de Saúde. Esta seção descreve as características desse backend de autenticação conforme observadas pelo front-end.

### 19.1 Visão Geral da API de Autenticação

A API de Autenticação é um serviço RESTful independente, acessível via a variável de ambiente `VITE_API_URL_AUTH`. Trata-se de uma **plataforma de identidade centralizada (Identity Provider)** que gerencia:

- **Cadastro de usuários**: registro com email, nome completo e CPF.
- **Autenticação em duas etapas (2FA)**: login com email/senha + código enviado por email.
- **Gerenciamento de sessões**: múltiplas sessões simultâneas com controle individual.
- **Emissão e renovação de tokens JWT**: access tokens com validade de 2 horas e refresh tokens com validade de 7 dias.
- **Controle de acesso por sistema**: cada sistema cadastrado possui um UUID (`sistemaId`), e os usuários recebem permissões vinculadas a sistemas específicos.
- **Políticas de senha**: expiração de senha, troca obrigatória no primeiro acesso e requisitos mínimos de complexidade.

A comunicação é feita exclusivamente via JSON, com uma instância Axios dedicada (`authApi`) configurada com timeout de 10 segundos e `baseURL` apontando para `{VITE_API_URL_AUTH}/api`.

### 19.2 Endpoints e Recursos Expostos

O backend de autenticação expõe os seguintes recursos consumidos pelo front-end:

**Autenticação (`/Auth`)**:

| Método HTTP | Endpoint | Finalidade | Payload Principal |
|:-----------:|----------|------------|-------------------|
| POST | `/Auth/register` | Cadastro de novo usuário | `{ email, nomeCompleto, cpf }` |
| POST | `/Auth/login` | 1ª etapa — envia código 2FA por email | `{ email, senha, sistemaId }` |
| POST | `/Auth/confirmar-codigo-2fa` | 2ª etapa — valida código e retorna tokens | `{ email, codigo, sistemaId }` |
| POST | `/Auth/trocar-senha` | Troca de senha (expirada ou voluntária) | `{ email, novaSenha, tokenTrocaSenha, sistemaId }` |
| POST | `/Auth/esqueci-senha` | Dispara email de recuperação de senha | `{ email }` |
| POST | `/Auth/refresh-token` | Renova access token usando refresh token | `{ refreshToken, sistemaId }` |
| POST | `/Auth/logout` | Encerra a sessão atual | `{ refreshToken }` |
| POST | `/Auth/logout-all-sessions` | Encerra todas as sessões do usuário | `{ refreshToken }` |

**Permissões por Sistema (`/usuario-permissao-sistema`)**:

| Método HTTP | Endpoint | Finalidade |
|:-----------:|----------|------------|
| GET | `/usuario-permissao-sistema/verificar-acesso/{sistemaId}` | Verifica se o usuário tem acesso ao sistema |
| GET | `/usuario-permissao-sistema?usuarioId=...&sistemaId=...` | Lista permissões do usuário em um sistema (paginado) |
| POST | `/usuario-permissao-sistema` | Concede permissão a um usuário em um sistema |
| PUT | `/usuario-permissao-sistema/{id}` | Atualiza nível de permissão existente |

**Usuários (`/usuarios`)**:

| Método HTTP | Endpoint | Finalidade |
|:-----------:|----------|------------|
| GET | `/usuarios` | Lista todos os usuários cadastrados (paginado) |

### 19.3 Modelo de Permissões e Sistemas

A API de autenticação implementa um modelo de **permissões vinculadas a sistemas**. Cada relação `usuário ↔ sistema` possui um registro próprio (`UsuarioPermissaoSistema`) com os seguintes atributos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único da vinculação (usado como `authPermId` no front-end) |
| `usuarioId` | UUID | ID do usuário na API de autenticação |
| `sistemaId` | UUID | ID do sistema (SMSAgenda = `VITE_SYSTEM_ID`) |
| `permissaoId` | int | Nível de permissão numérico |
| `nomePermissao` | string | Nome legível da permissão |
| `atribuidoEm` | datetime | Data de concessão |
| `atualizadoEm` | datetime | Data da última atualização |

Os **níveis de permissão** definidos na API de autenticação são:

| `permissaoId` | Nome | Significado para o SMSAgenda |
|:---:|:---:|---|
| 1 | Administrador | Acesso total: gerenciar salas, usuários, aprovar/recusar agendamentos |
| 2, 3 | Solicitante | Criar agendamentos, visualizar agenda completa |
| 4, 5 | Visualizador | Apenas visualizar a agenda (títulos ocultos) |

Quando um usuário possui **múltiplas permissões** no mesmo sistema, o front-end aplica a regra do **menor número = maior privilégio**, selecionando automaticamente a permissão mais privilegiada.

### 19.4 Estrutura de Respostas da API

Todas as respostas da API de autenticação seguem um **envelope padronizado**:

```json
{
  "sucesso": true,
  "dados": { ... },
  "mensagem": "Descrição opcional"
}
```

O campo `sucesso` é um booleano que indica se a operação foi concluída com êxito. O campo `dados` contém o payload específico de cada endpoint, e `mensagem` fornece contexto textual sobre o resultado.

Para **endpoints paginados** (`GET /usuarios`, `GET /usuario-permissao-sistema`), o campo `dados` inclui metadados de paginação:

```json
{
  "sucesso": true,
  "dados": {
    "items": [ ... ],
    "totalItems": 50,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 5,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

### 19.5 Tokens e Sessões

Após autenticação com sucesso (2ª etapa do 2FA ou troca de senha), a API retorna:

- **Access Token (JWT)**: Token assinado contendo claims do usuário (email, ID, nome, permissão, sistema). Validade de **2 horas**.
- **Refresh Token**: Token opaco (não-JWT) controlado pelo servidor. Validade de **7 dias**.

O **payload do JWT** emitido pela API de autenticação contém as seguintes claims:

| Claim | Tipo | Descrição |
|-------|------|-----------|
| `sub` | string | Email do usuário |
| `usuarioId` | UUID | Identificador único do usuário |
| `nomeCompleto` | string | Nome completo (com suporte a UTF-8/acentos) |
| `tipoUsuario` | string | Tipo genérico do usuário |
| `permissao` | number \| number[] | Código(s) de permissão no sistema |
| `permissaoNome` | string \| string[] | Nome(s) da(s) permissão(ões) |
| `cpf` | string | CPF do usuário |
| `sistemaId` | UUID | ID do sistema ao qual o token pertence |
| `exp` | number | Timestamp Unix de expiração |
| `iss` | string | Emissor do token |
| `aud` | string | Audiência do token |

A API também gerencia **sessões ativas** por usuário, permitindo listar sessões e encerrá-las individualmente ou em massa.

Fluxos especiais que a API sinaliza via resposta:
- **`senhaExpirada: true`**: O access token não é emitido; em vez disso, é fornecido um `tokenTrocaSenha` para que o front-end redirecione o usuário à tela de troca de senha.
- **`precisaTrocarSenha: true`**: Primeiro acesso do usuário; comportamento idêntico ao de senha expirada.

---

## 20. Relação entre o Front-End e o Backend de Autenticação

Esta seção detalha como o front-end orquestra a comunicação com os dois backends e como os dados de identidade do backend de autenticação são traduzidos e sincronizados com o backend de agendamentos.

### 20.1 Arquitetura de Comunicação Dual-Backend

O front-end do SMSAgenda se comunica simultaneamente com **dois backends distintos**:

```
┌─────────────────────────────────────┐
│          Front-End (SPA)            │
│                                     │
│  ┌─────────────┐ ┌───────────────┐  │
│  │  authApi     │ │     api       │  │
│  │  (Axios)     │ │   (Axios)     │  │
│  └──────┬───────┘ └───────┬───────┘  │
│         │                 │          │
└─────────┼─────────────────┼──────────┘
          │                 │
          ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│  API de         │ │  API de         │
│  Autenticação   │ │  Agendamentos   │
│  (VITE_API_URL  │ │  (VITE_API_BASE │
│   _AUTH)        │ │   _URL)         │
│                 │ │                 │
│  • Identidade   │ │  • Salas        │
│  • 2FA          │ │  • Agendamentos │
│  • Permissões   │ │  • Solicitantes │
│  • Sessões      │ │                 │
└─────────────────┘ └─────────────────┘
```

As duas APIs são **independentes** e não se comunicam diretamente. O front-end atua como **orquestrador**, traduzindo dados de identidade da API de autenticação para o modelo de dados da API de agendamentos.

### 20.2 Instâncias Axios Separadas

Para isolar a comunicação com cada backend, o front-end mantém **duas instâncias Axios independentes**:

| Instância | Arquivo | Base URL | Timeout | Interceptadores |
|-----------|---------|----------|---------|------------------|
| `authApi` | `lib/auth/auth-service.ts` | `{VITE_API_URL_AUTH}/api` | 10s | Nenhum (sem bearer automático) |
| `api` | `services/api.tsx` | `{VITE_API_BASE_URL}` ou `/api` (proxy) | Padrão | Interceptador de request (injeta token) + interceptador de response (renova token em 401) |

**Diferença importante**: A instância `authApi` **não possui interceptadores de autenticação**, pois os endpoints de login e registro são públicos. O token JWT é enviado manualmente apenas para os endpoints que o exigem (como verificação de acesso). Já a instância `api` injeta automaticamente o header `Authorization: Bearer <token>` em todas as requisições e implementa renovação automática de tokens.

### 20.3 Fluxo Completo de Registro e Provisionamento

O registro de um novo usuário envolve **três operações sequenciais** orquestradas pelo front-end, sendo que apenas o solicitante é criado após o primeiro login:

```
┌───────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE REGISTRO                                 │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. POST /Auth/register          → API Auth                          │
│     { email, nomeCompleto, cpf }                                      │
│     Resultado: usuarioId (UUID)                                       │
│                                                                       │
│  2. POST /usuario-permissao-sistema → API Auth                       │
│     { usuarioId, sistemaId, permissaoId: 4 }                          │
│     Resultado: vinculação usuário↔sistema criada (permissão Viewer)   │
│                                                                       │
│  3. GET /usuario-permissao-sistema  → API Auth                       │
│     ?usuarioId=...&sistemaId=...                                      │
│     Resultado: authPermId (UUID) salvo em sessionStorage              │
│                                                                       │
│  4. Setor informado no formulário → salvo em sessionStorage           │
│     (pending_setor, pending_authPermId)                               │
│                                                                       │
│  ───── Após o primeiro login com 2FA ─────                            │
│                                                                       │
│  5. POST /Solicitante            → API Agendamentos                  │
│     { nome, email, tipo, setor, authId, authPermId }                  │
│     Resultado: solicitante criado no sistema de agendamentos          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Tratamento de usuários já existentes**: Se o registro retorna erro indicando que o email já está cadastrado, o front-end busca o ID do usuário existente via `GET /usuarios`, tenta conceder permissão no sistema da agenda, e segue o fluxo normalmente. Isso permite que usuários já cadastrados em outros sistemas da secretaria obtenham acesso ao SMSAgenda sem criar uma nova conta.

**Dados transitórios via `sessionStorage`**: O `pending_setor` e `pending_authPermId` são salvos em `sessionStorage` durante o registro e consumidos no primeiro login. Esses dados são removidos após a sincronização bem-sucedida do solicitante.

### 20.4 Fluxo Completo de Login e Sincronização

O login envolve comunicação com ambos os backends em sequência:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE LOGIN                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Etapa 1 — Credenciais                                                     │
│  POST /Auth/login → API Auth                                              │
│  { email, senha, sistemaId }                                               │
│  → Servidor envia código 2FA para o email do usuário                       │
│  → Caso não tenha permissão, front-end redireciona para /registrar         │
│                                                                            │
│  Etapa 2 — Verificação 2FA                                                 │
│  POST /Auth/confirmar-codigo-2fa → API Auth                               │
│  { email, codigo, sistemaId }                                              │
│  → Recebe: { token, refreshToken, usuario }                                │
│  → Tokens salvos em cookies (auth_token, auth_refresh_token)               │
│                                                                            │
│  Etapa 3 — Decodificação do JWT                                            │
│  O front-end decodifica o token para extrair:                              │
│  • usuarioId (UUID) — identidade na API Auth                              │
│  • permissao (number) — nível de acesso                                   │
│  • nomeCompleto, email, cpf                                                │
│                                                                            │
│  Etapa 4 — Obtenção do authPermId                                          │
│  GET /usuario-permissao-sistema → API Auth                                │
│  ?usuarioId=...&sistemaId=...                                              │
│  → Obtém o UUID da vinculação usuário↔sistema (authPermId)                │
│  (Pula se já estiver em sessionStorage vindo do registro recente)          │
│                                                                            │
│  Etapa 5 — Sincronização do Solicitante                                    │
│  GET /Solicitante/authid/{authId} → API Agendamentos                      │
│  → Se existe: verifica se precisa atualizar (tipo, nome, setor, IDs)      │
│  → Se não existe: POST /Solicitante cria um novo registro                 │
│  → Solicitante armazenado no Zustand store para uso nos agendamentos      │
│                                                                            │
│  Etapa 6 — Invalidação de cache                                           │
│  queryClient.invalidateQueries({ queryKey: ['me'] })                       │
│  → AuthContext detecta o novo usuário e atualiza a árvore de componentes  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Fluxos alternativos após a verificação 2FA**:
- **Senha expirada (`senhaExpirada: true`)**: Redireciona para `/auth/trocar-senha` com `tokenTrocaSenha` em `sessionStorage`. Após a troca, o mesmo fluxo de sincronização é executado.
- **Primeira troca de senha (`precisaTrocarSenha: true`)**: Comportamento idêntico ao de senha expirada.
- **Usuário sem permissão no sistema**: O endpoint de login retorna mensagem de erro. O front-end lança um erro especial (`REDIRECT_TO_REGISTER`) que a tela de login captura para redirecionar o usuário à página de registro.

### 20.5 Mapeamento de Permissões entre Backends

Os dois backends utilizam **sistemas de permissão com codificações diferentes**. O front-end é responsável por traduzir entre eles:

```
   API de Autenticação              Front-End               API de Agendamentos
┌──────────────────────┐    ┌───────────────────┐    ┌──────────────────────┐
│ permissaoId = 1      │───►│ tipo = 1 (Admin)  │───►│ Solicitante.tipo = 1 │
│ (Administrador)      │    │                   │    │ (Solicitante Admin)  │
├──────────────────────┤    ├───────────────────┤    ├──────────────────────┤
│ permissaoId = 2 ou 3 │───►│ tipo = 0 (Normal) │───►│ Solicitante.tipo = 0 │
│ (Solicitante)        │    │                   │    │ (Solicitante Normal) │
├──────────────────────┤    ├───────────────────┤    ├──────────────────────┤
│ permissaoId = 4 ou 5 │───►│ tipo = 2 (Viewer) │───►│ Solicitante.tipo = 2 │
│ (Visualizador)       │    │                   │    │ (Viewer)             │
└──────────────────────┘    └───────────────────┘    └──────────────────────┘
```

Esse mapeamento é executado em dois pontos do código:
1. **Após confirmação do 2FA** (`useConfirm2FAMutation`): ao sincronizar o solicitante.
2. **Após troca de senha** (`usePasswordChangeMutation`): ao sincronizar o solicitante.

O front-end também usa a permissão decodificada do JWT para **controle de acesso nas rotas** (`PrivateRoute`), sem necessidade de consultar o backend de agendamentos.

### 20.6 Sincronização do Solicitante (Upsert)

O conceito de "solicitante" existe apenas no backend de agendamentos. A cada login, o front-end executa um **upsert** que vincula o usuário da API de autenticação ao registro de solicitante na API de agendamentos:

```
                  ┌──────────────────────────┐
                  │   Dados do Token JWT      │
                  │   (API de Autenticação)   │
                  │                          │
                  │   • usuarioId → authId    │
                  │   • nomeCompleto → nome   │
                  │   • email → email         │
                  │   • permissao → tipo      │
                  └────────────┬─────────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │   solicitanteService.sincronizar│
              ├────────────────────────────────┤
              │ 1. Busca por authId            │
              │    GET /Solicitante/authid/{id} │
              │                                │
              │ 2. Se não encontrado:          │
              │    Fallback busca por email     │
              │    GET /Solicitante             │
              │                                │
              │ 3. Se não existe → POST criar   │
              │    Se existe e diferente → PUT  │
              │    Se existe e igual → retorna  │
              └────────────────────────────────┘
```

**Campos sincronizados**: `nome`, `email`, `tipo` (derivado da permissão), `setor`, `authId` (UUID do usuário na API Auth) e `authPermId` (UUID da vinculação usuário↔sistema na API Auth).

**Critérios de atualização**: O solicitante é atualizado quando qualquer um desses campos diverge entre o registro existente e os dados atuais: tipo, nome, setor, authId ou authPermId. Se o registro existente possuir `authId` ou `authPermId` nulos, eles são preenchidos.

### 20.7 Renovação de Tokens e Propagação para a API de Agendamentos

O access token emitido pela API de autenticação é utilizado para **ambos os backends**. A renovação ocorre via API de autenticação, e o novo token é automaticamente propagado para a API de agendamentos:

```
┌──────────────────────────────────────────────────────────────────┐
│                FLUXO DE RENOVAÇÃO DE TOKEN                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Interceptor de request (api.tsx)                             │
│     → Detecta token próximo de expirar (< 5 min)                │
│                                                                  │
│  2. POST /Auth/refresh-token → API Auth                         │
│     { refreshToken, sistemaId }                                  │
│     → Recebe novos: { token, refreshToken, usuario }             │
│                                                                  │
│  3. Novos tokens salvos em cookies                               │
│     → Automaticamente usados pela instância api (agendamentos)  │
│     → O interceptor injeta o novo token no header Authorization │
│                                                                  │
│  4. Em caso de 401 na API de agendamentos                       │
│     → Interceptor de response tenta renovar e refazer a request │
│     → Flag _retry evita loops infinitos                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Um mecanismo de **exclusão mútua** (`isRefreshing` + `refreshPromise`) impede múltiplas chamadas simultâneas de renovação quando várias requisições detectam o token expirado ao mesmo tempo.

### 20.8 Gerenciamento de Usuários com Escrita Dupla

A página `GerenciarUsuarios.tsx` (acessível apenas para Admin) executa **escritas em ambos os backends** ao alterar permissões de usuários:

1. **Atualização na API de Autenticação**: `PUT /usuario-permissao-sistema/{authPermId}` altera o `permissaoId` do usuário.
2. **Atualização na API de Agendamentos**: `PUT /Solicitante/{id}` atualiza o campo `tipo` do solicitante, refletindo o novo mapeamento de permissão.

Essa **escrita dupla** garante consistência entre os dois backends. O front-end é responsável por executar ambas as operações e tratar falhas parciais.

---

*Documento gerado em fevereiro de 2026.*
*Versão do sistema documentada: SMSAgenda Front-End v1.0.0.*
