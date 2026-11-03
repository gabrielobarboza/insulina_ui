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
  readSession,
  saveSession
} from '@/utils/session'

export const AuthContext = createContext({} as AuthContextType)

// Só no navegador: remove as chaves antigas (token do Google) e lê a sessão do app.
const readInitialSession = (): string | null => {
  if (typeof window === 'undefined') return null
  clearLegacyKeys(window.localStorage)
  return readSession(window.localStorage)
}

export const AuthProvider = ({ children }: AuthContextProps) => {
  const [session, setSession] = useState<string | null>(readInitialSession)

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
        setSession(newSession)
      })
      .catch(() => onLoginError())
  }, [onLoginError])

  const handleLogout = useCallback((): void => {
    clearSession(window.localStorage)
    setSession(null)
  }, [])

  useEffect(() => {
    if (!session) googleLogout()
  }, [session])

  return (
    <AuthContext.Provider
      value={{
        authorized,
        userData,
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
