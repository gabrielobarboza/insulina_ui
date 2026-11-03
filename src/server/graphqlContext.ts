import { loadAuthConfig } from './auth/config'
import { AuthenticatedUser, getAuthenticatedUser } from './auth/getAuthenticatedUser'

export type GraphQLContext = {
  user: AuthenticatedUser
}

type ContextRequest = {
  req: { headers: { authorization?: string } }
}

// Lança antes de qualquer resolver se a sessão for inválida (research R4).
export function buildContext({ req }: ContextRequest): GraphQLContext {
  return { user: getAuthenticatedUser(req.headers.authorization, loadAuthConfig(process.env), Date.now()) }
}
