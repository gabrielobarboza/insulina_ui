import { createHmac } from 'crypto'
import { encode } from 'jwt-simple'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AuthConfigResult,
  CONFIG_ERROR_MESSAGE,
  SESSION_TTL_SECONDS,
  loadAuthConfig,
} from '@/server/auth/config'
import { ConfigError } from '@/server/auth/errors'
import { getAuthenticatedUser } from '@/server/auth/getAuthenticatedUser'
import { signSession } from '@/server/auth/session'
import {
  createGoogleSigningKey,
  googlePayload,
  signGoogleIdToken,
} from './helpers/googleTokens'

// Valores fictícios, só para teste.
const SECRET = 'segredo-de-teste-com-mais-de-32-bytes!!'
const OTHER_SECRET = 'outro-segredo-de-teste-com-32-bytes-ou-mais'
const CLIENT_ID = 'test-client-id'

const config: AuthConfigResult = {
  ok: true,
  config: { sessionSecret: SECRET, oauthClientId: CLIENT_ID },
}

const claimsA = { sub: 'user-a', email: 'a@example.com', name: 'Pessoa A', picture: 'https://example.com/a.png' }

function bearer(token: string): string {
  return `Bearer ${token}`
}

function base64url(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function hs256(signingInput: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function expectUnauthenticated(run: () => unknown): void {
  let caught: unknown
  try {
    run()
  } catch (err) {
    caught = err
  }
  expect(caught).toBeDefined()
  expect(caught).not.toBeInstanceOf(ConfigError)
  expect((caught as { extensions?: { code?: string } }).extensions?.code).toBe('UNAUTHENTICATED')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadAuthConfig', () => {
  it('aceita segredo com exatamente 32 bytes', () => {
    const result = loadAuthConfig({ SESSION_SECRET: 'a'.repeat(32), NEXT_PUBLIC_OAUTH_ID: CLIENT_ID })
    expect(result).toEqual({ ok: true, config: { sessionSecret: 'a'.repeat(32), oauthClientId: CLIENT_ID } })
  })

  it('recusa NEXT_PUBLIC_OAUTH_ID vazio', () => {
    expect(loadAuthConfig({ SESSION_SECRET: SECRET, NEXT_PUBLIC_OAUTH_ID: '' })).toEqual({ ok: false })
  })
})

describe('getAuthenticatedUser', () => {
  it('A1: sem cabeçalho → UNAUTHENTICATED', () => {
    expectUnauthenticated(() => getAuthenticatedUser(undefined, config, Date.now()))
  })

  it('A2: outro esquema → UNAUTHENTICATED', () => {
    expectUnauthenticated(() => getAuthenticatedUser('Basic abc', config, Date.now()))
  })

  it.each(['Bearer ', 'Bearer', ''])('A3: Bearer vazio (%j) → UNAUTHENTICATED', (header) => {
    expectUnauthenticated(() => getAuthenticatedUser(header, config, Date.now()))
  })

  it.each(['Bearer abc.def', 'Bearer x.y.z'])('A4: sessão malformada (%j) → UNAUTHENTICATED', (header) => {
    expectUnauthenticated(() => getAuthenticatedUser(header, config, Date.now()))
  })

  it('A5: sessão assinada com outro segredo → UNAUTHENTICATED', () => {
    const now = Date.now()
    const token = signSession(claimsA, OTHER_SECRET, now)
    expectUnauthenticated(() => getAuthenticatedUser(bearer(token), config, now))
  })

  it('A6: sessão expirada em relação a now → UNAUTHENTICATED', () => {
    const now = Date.now()
    const token = signSession(claimsA, SECRET, now)
    expectUnauthenticated(() => getAuthenticatedUser(bearer(token), config, now + 2 * SESSION_TTL_SECONDS * 1000))
  })

  it('A6: borda de 24h — aceita em iat + 24h − 1s, recusa em iat + 24h', () => {
    const now = Date.now()
    const iatMs = Math.floor(now / 1000) * 1000
    const token = signSession(claimsA, SECRET, now)

    const justBefore = iatMs + SESSION_TTL_SECONDS * 1000 - 1000
    expect(getAuthenticatedUser(bearer(token), config, justBefore)).toEqual({ id: 'user-a', email: 'a@example.com' })

    const atExpiry = iatMs + SESSION_TTL_SECONDS * 1000
    expectUnauthenticated(() => getAuthenticatedUser(bearer(token), config, atExpiry))
  })

  it('A7: alg none com assinatura vazia → UNAUTHENTICATED', () => {
    const now = Date.now()
    const exp = Math.floor(now / 1000) + 3600
    const token = `${base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${base64url(
      JSON.stringify({ ...claimsA, exp })
    )}.`
    expectUnauthenticated(() => getAuthenticatedUser(bearer(token), config, now))
  })

  it('A7: cabeçalho HS512 assinado em HS256 com o segredo certo → UNAUTHENTICATED', () => {
    const now = Date.now()
    const exp = Math.floor(now / 1000) + 3600
    const signingInput = `${base64url(JSON.stringify({ alg: 'HS512', typ: 'JWT' }))}.${base64url(
      JSON.stringify({ ...claimsA, exp })
    )}`
    const token = `${signingInput}.${hs256(signingInput, SECRET)}`
    expectUnauthenticated(() => getAuthenticatedUser(bearer(token), config, now))
  })

  it('A8: sessão válida sem sub → UNAUTHENTICATED', () => {
    const now = Date.now()
    const iat = Math.floor(now / 1000)
    const token = encode({ email: 'a@example.com', iat, exp: iat + SESSION_TTL_SECONDS }, SECRET, 'HS256')
    expectUnauthenticated(() => getAuthenticatedUser(bearer(token), config, now))
  })

  it('A9: sessão válida → { id: sub, email }', () => {
    const now = Date.now()
    const token = signSession(claimsA, SECRET, now)
    expect(getAuthenticatedUser(bearer(token), config, now)).toEqual({ id: 'user-a', email: 'a@example.com' })
  })

  it.each([
    ['segredo ausente', { NEXT_PUBLIC_OAUTH_ID: CLIENT_ID }],
    ['segredo de 31 bytes', { SESSION_SECRET: 'a'.repeat(31), NEXT_PUBLIC_OAUTH_ID: CLIENT_ID }],
  ])('A10: configuração inválida (%s) → ConfigError, nunca usuário', (_label, env) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const now = Date.now()
    const token = signSession(claimsA, SECRET, now)
    const configResult = loadAuthConfig(env)
    expect(configResult).toEqual({ ok: false })

    expect(() => getAuthenticatedUser(bearer(token), configResult, now)).toThrow(ConfigError)
    expect(consoleError).toHaveBeenCalledWith(CONFIG_ERROR_MESSAGE)
  })

  it('A11: token RS256 do Google → UNAUTHENTICATED', () => {
    const key = createGoogleSigningKey()
    const token = signGoogleIdToken(googlePayload({ aud: CLIENT_ID }), key)
    expectUnauthenticated(() => getAuthenticatedUser(bearer(token), config, Date.now()))
  })
})
