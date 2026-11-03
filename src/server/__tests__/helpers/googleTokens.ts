// Tokens do Google gerados localmente, sem rede (research R1). Só para testes.
import { createSign, generateKeyPairSync } from 'crypto'
import {
  CertificateFormat,
  FederatedSignonCertsResponse,
} from 'google-auth-library/build/src/auth/oauth2client'

export const TEST_OAUTH_CLIENT_ID = 'test-client-id.apps.googleusercontent.com'

export type GoogleSigningKey = {
  kid: string
  publicKey: string
  privateKey: string
}

export type GoogleIdTokenPayload = {
  iss?: string
  aud?: string
  sub?: string
  email?: string
  given_name?: string
  name?: string
  picture?: string
  iat?: number
  exp?: number
}

export function createGoogleSigningKey(kid = 'test-kid'): GoogleSigningKey {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  return { kid, publicKey, privateKey }
}

// Resposta para `vi.spyOn(client, 'getFederatedSignonCertsAsync')`.
export function googleCerts(...keys: GoogleSigningKey[]): FederatedSignonCertsResponse {
  const certs: Record<string, string> = {}
  for (const key of keys) {
    certs[key.kid] = key.publicKey
  }
  return { certs, format: CertificateFormat.PEM }
}

// A biblioteca confere iat/exp com o relógio real, então os padrões partem de Date.now().
export function googlePayload(overrides: GoogleIdTokenPayload = {}): GoogleIdTokenPayload {
  const iat = Math.floor(Date.now() / 1000)
  return {
    iss: 'https://accounts.google.com',
    aud: TEST_OAUTH_CLIENT_ID,
    sub: 'google-sub-a',
    email: 'a@example.com',
    given_name: 'Pessoa A',
    picture: 'https://example.com/a.png',
    iat,
    exp: iat + 60 * 60,
    ...overrides,
  }
}

export function signGoogleIdToken(
  payload: GoogleIdTokenPayload,
  { kid, privateKey }: Pick<GoogleSigningKey, 'kid' | 'privateKey'>
): string {
  const header = { alg: 'RS256', typ: 'JWT', kid }
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
  const signature = createSign('RSA-SHA256').update(signingInput).sign(privateKey, 'base64')
  return `${signingInput}.${toBase64url(signature)}`
}

function base64url(text: string): string {
  return toBase64url(Buffer.from(text, 'utf8').toString('base64'))
}

function toBase64url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
