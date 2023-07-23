import { CredentialResponse } from '@react-oauth/google'

export interface JwtData {
  [key: string]: any
}

type UserDataKeys = 'name' | 'picture' | 'email'
export interface UserData extends Partial<Record<UserDataKeys, string>> {}

export type AuthContextType = {
  [key: string]: any
  authorized: boolean
  userData: UserData
  onLoginSuccess: (params: CredentialResponse) => void
  onLoginError: (param?: any, ...params: any[]) => any | void
  handleLogout: (param?: any, ...params: any[]) => any | void
}

export interface AuthContextProps {
  children: any
}
