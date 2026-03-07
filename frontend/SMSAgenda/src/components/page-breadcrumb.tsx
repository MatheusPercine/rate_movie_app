import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { SidebarTrigger } from "./ui/sidebar";

export interface BreadcrumbItemType {
  label: string;
  href: string;
}

export interface PageBreadcrumbProps {
  /** Itens customizados do breadcrumb (opcional - se não fornecido, gera automaticamente) */
  items?: BreadcrumbItemType[];
  /** Mapa de labels customizados por segmento de URL */
  labelMap?: Record<string, string>;
  /** Função para gerar labels dinâmicos (ex: buscar nome de contrato por ID) */
  labelResolver?: (segment: string, currentPath: string) => string | undefined;
}

/**
 * Componente de breadcrumb com geração automática baseada na rota
 * Baseado em shadcn/ui + TailwindCSS
 *
 * @example
 * ```tsx
 * import { PageBreadcrumb } from '@subg-riosaude/subg-components'
 *
 * // Breadcrumb automático
 * <PageBreadcrumb />
 *
 * // Breadcrumb com labels customizados
 * <PageBreadcrumb
 *   labelMap={{
 *     'contratos': 'Contratos',
 *     'fornecedores': 'Fornecedores',
 *   }}
 * />
 *
 * // Breadcrumb com resolver dinâmico
 * <PageBreadcrumb
 *   labelResolver={(segment, path) => {
 *     if (path.includes('/contratos/') && segment.match(/^[0-9]+$/)) {
 *       return `Contrato ${segment}`
 *     }
 *     return undefined
 *   }}
 * />
 *
 * // Breadcrumb totalmente manual
 * <PageBreadcrumb
 *   items={[
 *     { label: 'Início', href: '/' },
 *     { label: 'Contratos', href: '/contratos' },
 *     { label: 'Contrato 123', href: '/contratos/123' },
 *   ]}
 * />
 * ```
 */
export const PageBreadcrumb = ({
  items,
  labelMap = {},
  labelResolver,
}: PageBreadcrumbProps) => {
  const location = useLocation();

  function formatLabel(segment: string) {
    return segment
      .replace(/_/g, " ") // troca underline por espaço
      .replace(/\b\w/g, (c) => c.toUpperCase()); // starta maiusculo
  }


  const generateCrumbs = (): BreadcrumbItemType[] => {
    if (items) {
      return items;
    }

    const pathSegments = location.pathname.split("/").filter(Boolean);
    const crumbs: BreadcrumbItemType[] = [{ label: "Início", href: "/" }];

    let currentPath = "";
    pathSegments.forEach((segment) => {
      // Ignorar segmentos numéricos (IDs de recursos) para não poluir o breadcrumb
      if (/^[0-9]+$/.test(segment)) {
        return;
      }
      currentPath += `/${segment}`;

      // 1. Tentar resolver via função customizada
      let label = labelResolver?.(segment, currentPath);

      // 2. Tentar usar mapa de labels
      if (!label) {
        label = labelMap[segment];
      }

      // 3. Fallback: capitalizar o segmento
      if (!label) {
        label = formatLabel(segment);
      }

      crumbs.push({ label, href: currentPath });
    });

    return crumbs;
  };

  const crumbs = generateCrumbs();

  return (
    <div className="flex items-center gap-2">
      <SidebarTrigger
        className="cursor-pointer rounded-md border border-transparent p-2 transition-colors duration-200 hover:border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm"
        aria-label="Alternar sidebar"
        title="Clique para expandir/colapsar a sidebar (Ctrl+B)"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLastItem = index === crumbs.length - 1;

            return (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {isLastItem ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLastItem && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default PageBreadcrumb;
