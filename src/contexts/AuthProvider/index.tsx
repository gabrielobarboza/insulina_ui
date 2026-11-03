import React, { useState, createContext, useEffect, useContext, useMemo, useCallback } from 'react'
import { CredentialResponse, googleLogout } from '@react-oauth/google'
import {
  JwtData,
  UserData,
  AuthContextProps,
  AuthContextType
} from './AuthContextProps'
import {
  clearLegacyKeys,
  clearSession,
  decodeSessionClaims,
  exchangeGoogleCredential,
  isSessionExpired,
  onSessionExpired,
  readSession,
  saveSession
} from '@/utils/session'
import { clearApolloStore } from '@/api/apolloClient'

export const AuthContext = createContext({} as AuthContextType)

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente.'

type InitialSession = { session: string | null; expired: boolean }

// Só no navegador: remove as chaves antigas (token do Google), lê a sessão do app e descarta a já expirada.
const readInitialSession = (): InitialSession => {
  if (typeof window === 'undefined') return { session: null, expired: false }
  clearLegacyKeys(window.localStorage)
  const stored = readSession(window.localStorage)
  if (stored && isSessionExpired(decodeSessionClaims(stored), Date.now())) {
    clearSession(window.localStorage)
    return { session: null, expired: true }
  }
  return { session: stored, expired: false }
}

export const AuthProvider = ({ children }: AuthContextProps) => {
  const [initial] = useState<InitialSession>(readInitialSession)
  const [session, setSession] = useState<string | null>(initial.session)
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string>(
    initial.expired ? SESSION_EXPIRED_MESSAGE : ''
  )

  // Expiração vinda do Apollo (sessão vencida antes da chamada ou resposta UNAUTHENTICATED).
  useEffect(() => onSessionExpired(() => {
    setSession(null)
    setSessionExpiredMessage(SESSION_EXPIRED_MESSAGE)
  }), [])

  const userData = useMemo<UserData>(() => {
    const claims: JwtData | null = session ? decodeSessionClaims(session) : null
    return {
      id: claims?.sub || '',
      email: claims?.email || '',
      picture: claims?.picture || '',
      name: claims?.name || ''
    }
  }, [session])

  const authorized = Boolean(session)

  const onLoginError = useCallback((_error?: unknown): void => {
    window?.alert('Falha ao autenticar: Algo deu Errado!')
    // Nunca logar o erro original: pode conter o token.
    console.error('Falha ao autenticar')
  }, [])

  // O token do Google só é enviado ao servidor; nunca é guardado (FR-017, FR-017b).
  const onLoginSuccess = useCallback(({ credential }: CredentialResponse): void => {
    if (!credential) {
      onLoginError()
      return
    }
    exchangeGoogleCredential(fetch, credential)
      .then((newSession) => {
        saveSession(window.localStorage, newSession)
        setSessionExpiredMessage('')
        setSession(newSession)
      })
      .catch(() => onLoginError())
  }, [onLoginError])

  const handleLogout = useCallback((): void => {
    clearSession(window.localStorage)
    // Logout não é expiração: nada de mensagem.
    setSessionExpiredMessage('')
    setSession(null)
  }, [])

  // Sem sessão (logout ou expiração): sai do Google e descarta o cache do Apollo do usuário anterior.
  useEffect(() => {
    if (!session) {
      googleLogout()
      clearApolloStore()
    }
  }, [session])

  return (
    <AuthContext.Provider
      value={{
        authorized,
        userData,
        sessionExpiredMessage,
        onLoginSuccess,
        onLoginError,
        handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthProvider
