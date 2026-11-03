import { AuthConfigResult, CONFIG_ERROR_MESSAGE } from './config'
import { ConfigError, UnauthenticatedError } from './errors'
import { verifySession } from './session'

export type AuthenticatedUser = {
  id: string
  email: string
}

const BEARER_PATTERN = /^Bearer (\S+)$/

export function getAuthenticatedUser(
  authorizationHeader: string | undefined,
  configResult: AuthConfigResult,
  now: number
): AuthenticatedUser {
  if (!configResult.ok) {
    console.error(CONFIG_ERROR_MESSAGE)
    throw new ConfigError()
  }

  const match = BEARER_PATTERN.exec(authorizationHeader ?? '')
  if (!match) {
    throw new UnauthenticatedError()
  }

  const claims = verifySession(match[1], configResult.config.sessionSecret, now)
  return { id: claims.sub, email: claims.email || '' }
}
