/**
 * Sistema de logging estruturado para a aplicação
 * Suporta diferentes níveis de log e contexto adicional
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = Record<string, unknown>;

export interface Logger {
  trace: (message: string | LogContext, context?: string | LogContext) => void
  debug: (message: string | LogContext, context?: string | LogContext) => void
  info: (message: string | LogContext, context?: string | LogContext) => void
  warn: (message: string | LogContext, context?: string | LogContext) => void
  error: (message: string | LogContext, context?: string | LogContext) => void
}

/**
 * Formata o contexto para exibição
 */
const formatContext = (context?: LogContext | string): string => {
  if (!context) return ''
  if (typeof context === 'string') return ` - ${context}`
  try {
    return ` - ${JSON.stringify(context)}`
  } catch {
    return ' - [Contexto não serializável]'
  }
}

/**
 * Cria um logger com prefixo de serviço
 */
export const createServiceLogger = (serviceName: string): Logger => {
  const prefix = `[${serviceName}]`

  return {
    trace: (message: string | LogContext, context?: string | LogContext) => {
      if (import.meta.env.DEV) {
        // Suporta duas assinaturas: (message, context) ou (context, message)
        if (typeof message === 'string') {
          console.debug(`${prefix} [TRACE] ${message}${formatContext(context)}`)
        } else {
          console.debug(`${prefix} [TRACE] ${context as string}${formatContext(message)}`)
        }
      }
    },

    debug: (message: string | LogContext, context?: string | LogContext) => {
      if (import.meta.env.DEV) {
        // Suporta duas assinaturas: (message, context) ou (context, message)
        if (typeof message === 'string') {
          console.debug(`${prefix} ${message}${formatContext(context)}`)
        } else {
          console.debug(`${prefix} ${context as string}${formatContext(message)}`)
        }
      }
    },

    info: (message: string | LogContext, context?: string | LogContext) => {
      // Suporta duas assinaturas: (message, context) ou (context, message)
      if (typeof message === 'string') {
        console.info(`${prefix} ${message}${formatContext(context)}`)
      } else {
        // Primeiro parâmetro é um objeto (contexto), segundo é a mensagem
        console.info(`${prefix} ${context as string}${formatContext(message)}`)
      }
    },

    warn: (message: string | LogContext, context?: string | LogContext) => {
      // Suporta duas assinaturas: (message, context) ou (context, message)
      if (typeof message === 'string') {
        console.warn(`${prefix} ⚠️ ${message}${formatContext(context)}`)
      } else {
        console.warn(`${prefix} ⚠️ ${context as string}${formatContext(message)}`)
      }
    },

    error: (message: string | LogContext, context?: string | LogContext) => {
      // Suporta duas assinaturas: (message, context) ou (context, message)
      if (typeof message === 'string') {
        console.error(`${prefix} ❌ ${message}${formatContext(context)}`)
      } else {
        console.error(`${prefix} ❌ ${context as string}${formatContext(message)}`)
      }
    },
  }
}

/**
 * Cria um logger com prefixo de componente
 */
export const createComponentLogger = (componentName: string, module?: string): Logger => {
  const name = module ? `component:${module}:${componentName}` : `component:${componentName}`
  return createServiceLogger(name)
}

/**
 * Cria um logger com prefixo de hook
 */
export const createHookLogger = (hookName: string, module?: string): Logger => {
  const name = module ? `hook:${module}:${hookName}` : `hook:${hookName}`
  return createServiceLogger(name)
}

/**
 * Logger global padrão
 */
export const logger = createServiceLogger('app')

/**
 * Função auxiliar para logar erros com contexto
 */
export const logError = (
  error: Error,
  context?: LogContext,
  message?: string,
): void => {
  const errorContext: LogContext = {
    ...context,
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
  }

  logger.error(message ?? error.message, errorContext)
}
