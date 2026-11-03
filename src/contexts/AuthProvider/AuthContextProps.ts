import type { ReactNode } from 'react'
import { CredentialResponse } from '@react-oauth/google'
import type { SessionUserClaims } from '@/utils/session'

// Claims da sessão do app decodificadas no cliente (sem verificação: quem verifica é o servidor).
export type JwtData = SessionUserClaims

type UserDataKeys = 'name' | 'picture' | 'email' | "id"
export interface UserData extends Partial<Record<UserDataKeys, string>> {}

export type AuthContextType = {
  authorized: boolean
  userData: UserData
  onLoginSuccess: (params: CredentialResponse) => void
  onLoginError: (error?: unknown) => void
  handleLogout: () => void
}

export interface AuthContextProps {
  children: ReactNode
}
