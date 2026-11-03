import { OAuth2Client } from 'google-auth-library'
import type { NextApiHandler } from 'next'
import { loadAuthConfig } from './config'
import { createSession } from './createSession'
import { UnauthenticatedError } from './errors'

export type SessionRouteDeps = {
  createSession: (credential: unknown) => Promise<string>
}

// Mapeamento HTTP de POST /api/session (contracts/session-api.md). Nenhuma resposta traz detalhes do erro.
export function createSessionRoute(deps: SessionRouteDeps): NextApiHandler {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
      return
    }

    const body: unknown = req.body
    const credential =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>).credential : undefined

    try {
      const session = await deps.createSession(credential)
      res.status(200).json({ session })
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        res.status(401).json({ error: 'UNAUTHENTICATED' })
        return
      }
      // ConfigError já registrou a mensagem fixa; o erro original nunca é logado (pode conter o token).
      res.status(500).json({ error: 'INTERNAL' })
    }
  }
}

// O cliente fica em nível de módulo para reaproveitar o cache de certificados do Google.
const googleVerifier = new OAuth2Client()

export const productionSessionRoute = createSessionRoute({
  createSession: (credential) =>
    createSession(credential, {
      verifier: googleVerifier,
      configResult: loadAuthConfig(process.env),
      now: Date.now(),
    }),
})
