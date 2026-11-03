export const SESSION_ALGORITHM = 'HS256' as const
export const SESSION_TTL_SECONDS = 24 * 60 * 60
export const MIN_SESSION_SECRET_BYTES = 32

// Mensagem fixa: nunca inclui nomes nem valores de variáveis (FR-004, FR-023).
export const CONFIG_ERROR_MESSAGE = 'auth: configuração ausente ou inválida'

export type AuthConfig = {
  sessionSecret: string
  oauthClientId: string
}

export type AuthConfigResult = { ok: true; config: AuthConfig } | { ok: false }

export function loadAuthConfig(env: Record<string, string | undefined>): AuthConfigResult {
  const sessionSecret = env.SESSION_SECRET
  const oauthClientId = env.NEXT_PUBLIC_OAUTH_ID

  if (!sessionSecret || Buffer.byteLength(sessionSecret, 'utf8') < MIN_SESSION_SECRET_BYTES) {
    return { ok: false }
  }
  if (!oauthClientId) {
    return { ok: false }
  }
  return { ok: true, config: { sessionSecret, oauthClientId } }
}
