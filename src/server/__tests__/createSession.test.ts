import { OAuth2Client } from 'google-auth-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthConfigResult, SESSION_TTL_SECONDS } from '@/server/auth/config'
import { createSession } from '@/server/auth/createSession'
import { ConfigError, UnauthenticatedError } from '@/server/auth/errors'
import { verifySession } from '@/server/auth/session'
import {
  GoogleIdTokenPayload,
  TEST_OAUTH_CLIENT_ID,
  createGoogleSigningKey,
  googleCerts,
  googlePayload,
  signGoogleIdToken,
} from './helpers/googleTokens'

// Valores fictícios, só para teste.
const SECRET = 'segredo-de-teste-com-mais-de-32-bytes!!'

const config: AuthConfigResult = {
  ok: true,
  config: { sessionSecret: SECRET, oauthClientId: TEST_OAUTH_CLIENT_ID },
}

const googleKey = createGoogleSigningKey('kid-google')
const otherKey = createGoogleSigningKey('kid-google')

let verifier: OAuth2Client
let consoleSpies: ReturnType<typeof vi.spyOn>[]

beforeEach(() => {
  verifier = new OAuth2Client()
  vi.spyOn(verifier, 'getFederatedSignonCertsAsync').mockResolvedValue(googleCerts(googleKey))
  consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
    vi.spyOn(console, method).mockImplementation(() => undefined)
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

function googleToken(overrides: GoogleIdTokenPayload = {}): string {
  return signGoogleIdToken(googlePayload(overrides), googleKey)
}

function run(credential: unknown, now = Date.now(), configResult: AuthConfigResult = config) {
  return createSession(credential, { verifier, configResult, now })
}

function loggedText(): string {
  return consoleSpies
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map((arg) => String(arg instanceof Error ? `${arg.message} ${arg.stack}` : JSON.stringify(arg))).join(' '))
    .join('\n')
}

async function expectUnauthenticated(credential: unknown): Promise<void> {
  const error: unknown = await run(credential).then(
    () => undefined,
    (err: unknown) => err
  )
  expect(error).toBeInstanceOf(UnauthenticatedError)
  const { message, extensions } = error as UnauthenticatedError
  expect(extensions.code).toBe('UNAUTHENTICATED')
  if (typeof credential === 'string' && credential !== '') {
    expect(message).not.toContain(credential)
    expect(loggedText()).not.toContain(credential)
  }
}

describe('createSession', () => {
  it('G1: token do Google válido → sessão de 24h que verifySession aceita', async () => {
    const now = Date.now()
    const session = await run(googleToken(), now)

    const claims = verifySession(session, SECRET, now)
    expect(claims).toMatchObject({
      sub: 'google-sub-a',
      email: 'a@example.com',
      name: 'Pessoa A',
      picture: 'https://example.com/a.png',
    })
    expect(claims.iat).toBe(Math.floor(now / 1000))
    expect(claims.exp).toBe(claims.iat + SESSION_TTL_SECONDS)
    expect(claims.exp).toBe(claims.iat + 86400)
    expect(loggedText()).toBe('')
  })

  it('G1: prefere given_name e usa name quando given_name falta', async () => {
    const now = Date.now()
    const both = verifySession(await run(googleToken({ given_name: 'Dado', name: 'Nome Completo' }), now), SECRET, now)
    expect(both.name).toBe('Dado')

    const onlyName = verifySession(await run(googleToken({ given_name: undefined, name: 'Nome Completo' }), now), SECRET, now)
    expect(onlyName.name).toBe('Nome Completo')
  })

  it.each([
    ['undefined', undefined],
    ['vazio', ''],
    ['número', 123],
    ['malformado', 'abc'],
  ])('G2: credential %s → UNAUTHENTICATED', async (_name, credential) => {
    await expectUnauthenticated(credential)
  })

  it('G2: token assinado por outra chave → UNAUTHENTICATED', async () => {
    await expectUnauthenticated(signGoogleIdToken(googlePayload(), otherKey))
  })

  it('G3: token expirado → UNAUTHENTICATED', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    await expectUnauthenticated(googleToken({ iat: nowSeconds - 2 * 60 * 60, exp: nowSeconds - 60 * 60 }))
  })

  it('G4: aud de outro app → UNAUTHENTICATED', async () => {
    await expectUnauthenticated(googleToken({ aud: 'outro-app.apps.googleusercontent.com' }))
  })

  it('G5: configuração ausente → ConfigError sem chamar o verificador', async () => {
    const verifySpy = vi.spyOn(verifier, 'verifyIdToken')
    await expect(run(googleToken(), Date.now(), { ok: false })).rejects.toBeInstanceOf(ConfigError)
    expect(verifySpy).not.toHaveBeenCalled()
  })

  it('payload sem sub → UNAUTHENTICATED', async () => {
    await expectUnauthenticated(googleToken({ sub: undefined }))
  })

  it.each([
    ['ausente', undefined],
    ['vazio', ''],
  ])('G6: payload com email %s → UNAUTHENTICATED, nenhuma sessão emitida', async (_name, email) => {
    await expectUnauthenticated(googleToken({ email }))
  })
})
