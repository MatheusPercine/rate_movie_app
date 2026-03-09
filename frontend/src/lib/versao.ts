/**
 * Utilitários para obter informações de versão e build da aplicação
 */

/**
 * Obtém a versão do aplicativo
 * Tenta ler de VITE_APP_VERSION, senão retorna versão padrão
 */
export function obterVersaoApp(): string {
  return import.meta.env.VITE_APP_VERSION || '1.0.0'
}

/**
 * Obtém o ano atual
 */
export function obterAnoAtual(): number {
  return new Date().getFullYear()
}

/**
 * Interface de metadata de versão
 */
export interface MetadataVersao {
  versao: string
  buildNumber: string
  commitSha: string
  buildTimestamp: string
  ambiente: 'development' | 'staging' | 'production'
}

/**
 * Obtém metadata completa da versão/build
 * Combina variáveis de ambiente com fallbacks
 */
export function obterMetadataVersao(): MetadataVersao {
  // Versão
  const versao = import.meta.env.VITE_APP_VERSION || '1.0.0'

  // Build number
  const buildNumber = import.meta.env.VITE_BUILD_NUMBER || 'local'

  // Commit SHA (primeiros 7 caracteres)
  const commitShaCompleto = import.meta.env.VITE_COMMIT_SHA || 'dev'
  const commitSha = commitShaCompleto.substring(0, 7)

  // Timestamp do build
  const buildTimestampEnv = import.meta.env.VITE_BUILD_TIMESTAMP
  const buildTimestamp = buildTimestampEnv
    ? formatarDataBuild(buildTimestampEnv)
    : formatarDataBuild(new Date().toISOString())

  // Ambiente (development, staging, production)
  const ambienteEnv = import.meta.env.VITE_AMBIENTE || import.meta.env.MODE
  const ambiente = normalizarAmbiente(ambienteEnv)

  return {
    versao,
    buildNumber,
    commitSha,
    buildTimestamp,
    ambiente,
  }
}

/**
 * Formata a data do build para exibição
 * @param isoDate - Data em formato ISO ou timestamp
 */
function formatarDataBuild(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return 'N/A'
  }
}

/**
 * Normaliza o ambiente para um dos valores esperados
 */
function normalizarAmbiente(
  env: string,
): 'development' | 'staging' | 'production' {
  const envLower = env.toLowerCase()

  if (envLower.includes('prod')) return 'production'
  if (envLower.includes('stag') || envLower.includes('homolog'))
    return 'staging'

  return 'development'
}