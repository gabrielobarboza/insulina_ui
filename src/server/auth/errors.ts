import { AuthenticationError } from 'apollo-server-micro'

// Código `UNAUTHENTICATED`. A mensagem é genérica e nunca diz o motivo da recusa.
export class UnauthenticatedError extends AuthenticationError {
  constructor() {
    super('Não autenticado')
  }
}

// Sem código de extensão: o Apollo Server responde HTTP 500 com INTERNAL_SERVER_ERROR (research R4).
export class ConfigError extends Error {
  constructor() {
    super('Internal server error')
    this.name = 'ConfigError'
  }
}
