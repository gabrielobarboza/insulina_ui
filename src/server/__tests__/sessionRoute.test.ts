import type { NextApiRequest, NextApiResponse } from 'next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigError, UnauthenticatedError } from '@/server/auth/errors'
import { createSessionRoute } from '@/server/auth/sessionRoute'

type FakeResponse = {
  statusCode?: number
  headers: Record<string, string>
  body?: unknown
  ended: boolean
}

function fakeRes(): { res: NextApiResponse; out: FakeResponse } {
  const out: FakeResponse = { headers: {}, ended: false }
  const res = {
    status(code: number) {
      out.statusCode = code
      return res
    },
    setHeader(name: string, value: string) {
      out.headers[name.toLowerCase()] = value
      return res
    },
    json(body: unknown) {
      out.body = body
      out.ended = true
    },
    end() {
      out.ended = true
    },
  }
  return { res: res as unknown as NextApiResponse, out }
}

function fakeReq(method: string, body?: unknown): NextApiRequest {
  return { method, body, headers: {} } as unknown as NextApiRequest
}

async function call(
  createSession: (credential: unknown) => Promise<string>,
  req: NextApiRequest
): Promise<FakeResponse> {
  const { res, out } = fakeRes()
  await createSessionRoute({ createSession })(req, res)
  return out
}

let consoleSpies: ReturnType<typeof vi.spyOn>[]

beforeEach(() => {
  consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
    vi.spyOn(console, method).mockImplementation(() => undefined)
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sessionRoute', () => {
  it('GET → 405 METHOD_NOT_ALLOWED com Allow: POST, sem chamar createSession', async () => {
    const createSession = vi.fn(async () => 'sessao')
    const out = await call(createSession, fakeReq('GET'))

    expect(out.statusCode).toBe(405)
    expect(out.headers['allow']).toBe('POST')
    expect(out.headers['cache-control']).toBe('no-store')
    expect(out.body).toEqual({ error: 'METHOD_NOT_ALLOWED' })
    expect(createSession).not.toHaveBeenCalled()
  })

  it('POST válido → 200 { session } e repassa credential', async () => {
    const createSession = vi.fn(async () => 'sessao-emitida')
    const out = await call(createSession, fakeReq('POST', { credential: 'google-token' }))

    expect(createSession).toHaveBeenCalledWith('google-token')
    expect(out.statusCode).toBe(200)
    expect(out.headers['cache-control']).toBe('no-store')
    expect(out.body).toEqual({ session: 'sessao-emitida' })
  })

  it('POST sem corpo repassa credential undefined', async () => {
    const createSession = vi.fn(async (): Promise<string> => {
      throw new UnauthenticatedError()
    })
    const out = await call(createSession, fakeReq('POST', undefined))

    expect(createSession).toHaveBeenCalledWith(undefined)
    expect(out.statusCode).toBe(401)
  })

  it('UnauthenticatedError → 401 UNAUTHENTICATED, sem console.*', async () => {
    const out = await call(async () => {
      throw new UnauthenticatedError()
    }, fakeReq('POST', { credential: 'google-token' }))

    expect(out.statusCode).toBe(401)
    expect(out.headers['cache-control']).toBe('no-store')
    expect(out.body).toEqual({ error: 'UNAUTHENTICATED' })
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled()
  })

  it.each([
    ['ConfigError', () => new ConfigError()],
    ['erro inesperado', () => new Error('detalhe interno google-token')],
  ])('%s → 500 INTERNAL sem detalhes', async (_name, makeError) => {
    const out = await call(async () => {
      throw makeError()
    }, fakeReq('POST', { credential: 'google-token' }))

    expect(out.statusCode).toBe(500)
    expect(out.headers['cache-control']).toBe('no-store')
    expect(out.body).toEqual({ error: 'INTERNAL' })
    const logged = consoleSpies.flatMap((spy) => spy.mock.calls).flat().map(String).join(' ')
    expect(logged).not.toContain('google-token')
  })
})
