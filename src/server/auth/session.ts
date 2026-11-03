import { decode, encode } from 'jwt-simple'
import { SESSION_ALGORITHM, SESSION_TTL_SECONDS } from './config'
import { UnauthenticatedError } from './errors'

export type SessionClaims = {
  sub: string
  email: string
  name?: string
  picture?: string
  iat: number
  exp: number
}

export function signSession(
  claims: Omit<SessionClaims, 'iat' | 'exp'>,
  secret: string,
  now: number
): string {
  const iat = Math.floor(now / 1000)
  const payload: SessionClaims = { ...claims, iat, exp: iat + SESSION_TTL_SECONDS }
  return encode(payload, secret, SESSION_ALGORITHM)
}

// Ordem da validação: data-model.md, "Validação no servidor". Toda falha vira UNAUTHENTICATED,
// sem incluir o token nem o erro da biblioteca na mensagem.
export function verifySession(token: string, secret: string, now: number): SessionClaims {
  const segments = token.split('.')
  if (segments.length !== 3 || readHeaderAlgorithm(segments[0]) !== SESSION_ALGORITHM) {
    throw new UnauthenticatedError()
  }

  let payload: unknown
  try {
    payload = decode(token, secret, false, SESSION_ALGORITHM)
  } catch {
    throw new UnauthenticatedError()
  }
  if (!isRecord(payload)) {
    throw new UnauthenticatedError()
  }

  const { exp, sub } = payload
  if (typeof exp !== 'number' || exp * 1000 <= now) {
    throw new UnauthenticatedError()
  }
  if (typeof sub !== 'string' || sub === '') {
    throw new UnauthenticatedError()
  }
  return payload as SessionClaims
}

function readHeaderAlgorithm(encodedHeader: string): string | undefined {
  try {
    // O decodificador 'base64' do Node também aceita o alfabeto base64url.
    const header: unknown = JSON.parse(Buffer.from(encodedHeader, 'base64').toString('utf8'))
    return isRecord(header) && typeof header.alg === 'string' ? header.alg : undefined
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
