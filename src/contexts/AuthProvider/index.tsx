import React, { useState, createContext, useMemo, useEffect, useContext } from 'react'
import { CredentialResponse } from '@react-oauth/google'
import jwtDecode from 'jwt-decode'
import {
  JwtData,
  UserData,
  AuthContextProps,
  AuthContextType
} from './AuthContextProps'
import { useLocalStorage } from '@/hooks'

export const AuthContext = createContext({} as AuthContextType)

const validateTokenExp = (date: number): boolean =>
  Boolean(date > Number(new Date()))

export const AuthProvider = ({ children }: AuthContextProps) => {
  const [userData, setUserData] = useState<Partial<UserData>>({})
  const [inuiToken, setToken] = useLocalStorage<string>('inui.token', '')
  const [tokenExp, setTokenExp] = useLocalStorage<number>('inui.token-exp', 0)

  useEffect(() => {
    if (inuiToken && tokenExp && !validateTokenExp(tokenExp)) {
      setToken('')
      setTokenExp(0)
    }
  }, [inuiToken, tokenExp])

  const handleToken = async (token: string) => {
    const jwtData: JwtData = (await jwtDecode(token)) || {}
    setToken(token)

    const _d = new Date()
    // Add ten days to current date
    setTokenExp(_d.setDate(_d.getDate() + 10))

    setUserData({
      email: jwtData?.email || '',
      picture: jwtData?.picture || '',
      name: jwtData?.given_name || jwtData?.name || ''
    })

    return jwtData
  }

  const authorized = useMemo(() => {
    const _auth = Boolean(inuiToken)
    if (_auth) handleToken(inuiToken)
    return _auth
  }, [inuiToken])

  const onLoginSuccess = ({ credential }: CredentialResponse) => {
    if (credential) handleToken(credential)
  }

  const onLoginError = (error: any): void => {
    window?.alert('Falha ao autenticar: Algo deu Errado!')
    console.error(error)
  }

  const handleLogout = () => {
    setUserData({
      email: '',
      picture: '',
      name: ''
    })

    setToken('')
    setTokenExp(0)
  }

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
