import type { OAuth2Client, TokenPayload } from 'google-auth-library'
import { AuthConfigResult, CONFIG_ERROR_MESSAGE } from './config'
import { ConfigError, UnauthenticatedError } from './errors'
import { signSession } from './session'

export type CreateSessionDeps = {
  verifier: Pick<OAuth2Client, 'verifyIdToken'>
  configResult: AuthConfigResult
  now: number
}

// Troca o ID token do Google por uma sessão do app (contracts/session-api.md).
export async function createSession(credential: unknown, deps: CreateSessionDeps): Promise<string> {
  const { verifier, configResult, now } = deps
  if (!configResult.ok) {
    console.error(CONFIG_ERROR_MESSAGE)
    throw new ConfigError()
  }
  if (typeof credential !== 'string' || credential === '') {
    throw new UnauthenticatedError()
  }

  let payload: TokenPayload | undefined
  try {
    const ticket = await verifier.verifyIdToken({
      idToken: credential,
      audience: configResult.config.oauthClientId,
    })
    payload = ticket.getPayload()
  } catch {
    // O erro da biblioteca contém o token inteiro (research R1): descartado, sem log.
    throw new UnauthenticatedError()
  }

  if (!payload || typeof payload.sub !== 'string' || payload.sub === '') {
    throw new UnauthenticatedError()
  }
  // FR-003b: sem e-mail, nenhuma sessão é emitida.
  if (typeof payload.email !== 'string' || payload.email === '') {
    throw new UnauthenticatedError()
  }

  return signSession(
    {
      sub: payload.sub,
      email: payload.email,
      name: payload.given_name || payload.name || '',
      picture: payload.picture || '',
    },
    configResult.config.sessionSecret,
    now
  )
}
