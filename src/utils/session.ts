// Sessão do app no cliente. Módulo puro: storage e fetch são injetados (sem React nem `window`).
import jwtDecode from 'jwt-decode'

export const SESSION_STORAGE_KEY = 'inui.session'
export const LEGACY_KEYS = ['inui.token', 'inui.token-exp'] as const

export type SessionUserClaims = {
  sub: string
  email?: string
  name?: string
  picture?: string
  exp: number
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

// O valor é a string JSON do token, no mesmo formato do hook `useLocalStorage`.
export function readSession(storage: StorageLike): string | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(SESSION_STORAGE_KEY) ?? 'null')
    return typeof value === 'string' && value !== '' ? value : null
  } catch {
    return null
  }
}

export function saveSession(storage: StorageLike, token: string): void {
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(token))
}

export function clearSession(storage: StorageLike): void {
  storage.removeItem(SESSION_STORAGE_KEY)
}

export function clearLegacyKeys(storage: StorageLike): void {
  for (const key of LEGACY_KEYS) storage.removeItem(key)
}

export function decodeSessionClaims(token: string): SessionUserClaims | null {
  let claims: unknown
  try {
    claims = jwtDecode(token)
  } catch {
    return null
  }
  if (typeof claims !== 'object' || claims === null) return null
  const { sub, email, name, picture, exp } = claims as Record<string, unknown>
  if (typeof sub !== 'string' || sub === '' || typeof exp !== 'number') return null
  return {
    sub,
    exp,
    email: typeof email === 'string' ? email : undefined,
    name: typeof name === 'string' ? name : undefined,
    picture: typeof picture === 'string' ? picture : undefined,
  }
}

// Troca o token do Google pela sessão do app. Lança em qualquer falha (FR-017b); a mensagem nunca leva o token.
export async function exchangeGoogleCredential(fetchFn: typeof fetch, credential: string): Promise<string> {
  const response = await fetchFn('/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ credential }),
  })
  if (!response.ok) {
    throw new Error(`Falha na troca de sessão (${response.status})`)
  }
  const body: unknown = await response.json()
  const session = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).session : undefined
  if (typeof session !== 'string' || session === '') {
    throw new Error('Falha na troca de sessão (resposta inválida)')
  }
  return session
}

export function isSessionExpired(claims: SessionUserClaims | null, now: number): boolean {
  return claims === null || claims.exp * 1000 <= now
}

// Assinantes em nível de módulo: o link do Apollo expira a sessão e o AuthProvider reage.
const sessionExpiredListeners = new Set<() => void>()

export function onSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

export function expireSession(storage: StorageLike): void {
  clearSession(storage)
  for (const listener of Array.from(sessionExpiredListeners)) listener()
}

function hasUnauthenticatedCode(errors: unknown): boolean {
  if (!Array.isArray(errors)) return false
  return errors.some((error: unknown) => {
    if (typeof error !== 'object' || error === null) return false
    const extensions: unknown = (error as Record<string, unknown>).extensions
    return (
      typeof extensions === 'object' &&
      extensions !== null &&
      (extensions as Record<string, unknown>).code === 'UNAUTHENTICATED'
    )
  })
}

// Formato do `ErrorResponse` do Apollo. O servidor responde HTTP 400 em UNAUTHENTICATED e, nesse caso, o Apollo
// Client deixa `graphQLErrors` vazio e põe o corpo em `networkError.result.errors`; por isso olhamos os dois.
export type ApolloErrorLike = {
  graphQLErrors?: ReadonlyArray<unknown>
  networkError?: unknown
}

export function isUnauthenticatedError(error: ApolloErrorLike): boolean {
  if (hasUnauthenticatedCode(error.graphQLErrors)) return true
  const { networkError } = error
  if (typeof networkError !== 'object' || networkError === null) return false
  const result: unknown = (networkError as Record<string, unknown>).result
  if (typeof result !== 'object' || result === null) return false
  return hasUnauthenticatedCode((result as Record<string, unknown>).errors)
}

// Lida a cada requisição. Sessão expirada ou ilegível é descartada (e os assinantes avisados) antes da chamada.
export function getAuthorizationHeaders(storage: StorageLike, now: number): { authorization?: string } {
  const session = readSession(storage)
  if (!session) return {}
  if (isSessionExpired(decodeSessionClaims(session), now)) {
    expireSession(storage)
    return {}
  }
  return { authorization: `Bearer ${session}` }
}
