import { encode } from 'jwt-simple'
import { describe, expect, it, vi } from 'vitest'
import {
  LEGACY_KEYS,
  SESSION_STORAGE_KEY,
  clearLegacyKeys,
  clearSession,
  decodeSessionClaims,
  exchangeGoogleCredential,
  readSession,
  saveSession,
} from '@/utils/session'

type MemoryStorage = Storage & { keys: () => string[] }

function memoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const data = new Map<string, string>(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    getItem: (key: string) => (data.has(key) ? data.get(key) ?? null : null),
    setItem: (key: string, value: string) => {
      data.set(key, String(value))
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    keys: () => Array.from(data.keys()),
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

// Valor fictício, só para teste: o cliente só decodifica, não verifica a assinatura.
const sessionToken = encode(
  { sub: 'user-a', email: 'a@example.com', name: 'Pessoa A', picture: 'https://example.com/a.png', iat: 1, exp: 2 },
  'segredo-de-teste-com-mais-de-32-bytes!!',
  'HS256'
)

describe('exchangeGoogleCredential (C1)', () => {
  it('faz POST /api/session com JSON, no-store e { credential }; devolve a sessão em 200', async () => {
    const fetchFn = vi.fn(async () => jsonResponse(200, { session: 'sessao-emitida' }))

    await expect(exchangeGoogleCredential(fetchFn, 'google-token')).resolves.toBe('sessao-emitida')

    expect(fetchFn).toHaveBeenCalledTimes(1)
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/session')
    expect(init.method).toBe('POST')
    expect(init.cache).toBe('no-store')
    expect(new Headers(init.headers).get('content-type')).toBe('application/json')
    expect(JSON.parse(String(init.body))).toEqual({ credential: 'google-token' })
  })

  it.each([
    [401, { error: 'UNAUTHENTICATED' }],
    [500, { error: 'INTERNAL' }],
    [200, {}],
  ])('lança em %s', async (status, body) => {
    const fetchFn = vi.fn(async () => jsonResponse(status, body))
    await expect(exchangeGoogleCredential(fetchFn, 'google-token')).rejects.toThrow()
  })

  it('lança em falha de rede', async () => {
    const fetchFn = vi.fn(async (): Promise<Response> => {
      throw new TypeError('Failed to fetch')
    })
    await expect(exchangeGoogleCredential(fetchFn, 'google-token')).rejects.toThrow()
  })
})

describe('armazenamento da sessão (C1)', () => {
  it('saveSession grava só em inui.session, como string JSON', () => {
    const storage = memoryStorage()
    saveSession(storage, sessionToken)

    expect(SESSION_STORAGE_KEY).toBe('inui.session')
    expect(storage.keys()).toEqual(['inui.session'])
    expect(storage.getItem('inui.session')).toBe(JSON.stringify(sessionToken))
  })

  it('readSession devolve o token salvo e null sem sessão ou com valor inválido', () => {
    const storage = memoryStorage()
    expect(readSession(storage)).toBeNull()

    saveSession(storage, sessionToken)
    expect(readSession(storage)).toBe(sessionToken)

    expect(readSession(memoryStorage({ 'inui.session': '{não é json' }))).toBeNull()
    expect(readSession(memoryStorage({ 'inui.session': '123' }))).toBeNull()
  })

  it('clearSession remove inui.session', () => {
    const storage = memoryStorage()
    saveSession(storage, sessionToken)
    clearSession(storage)
    expect(storage.keys()).toEqual([])
  })

  it('clearLegacyKeys remove inui.token e inui.token-exp e mantém o resto', () => {
    const storage = memoryStorage({
      'inui.token': JSON.stringify('google-token'),
      'inui.token-exp': '123',
      'inui.session': JSON.stringify(sessionToken),
    })
    clearLegacyKeys(storage)

    expect(LEGACY_KEYS).toEqual(['inui.token', 'inui.token-exp'])
    expect(storage.keys()).toEqual(['inui.session'])
  })
})

describe('decodeSessionClaims (C1)', () => {
  it('devolve sub, email, name, picture e exp', () => {
    expect(decodeSessionClaims(sessionToken)).toMatchObject({
      sub: 'user-a',
      email: 'a@example.com',
      name: 'Pessoa A',
      picture: 'https://example.com/a.png',
      exp: 2,
    })
  })

  it('devolve null para token inválido', () => {
    expect(decodeSessionClaims('não-é-jwt')).toBeNull()
    expect(decodeSessionClaims('')).toBeNull()
  })
})
