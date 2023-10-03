import React, { useState, createContext, useEffect, useContext, useMemo, useCallback } from 'react'
import { CredentialResponse, googleLogout } from '@react-oauth/google'
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

  const handleToken = useCallback((token: string) => {
    if(token) {
      const jwtData: JwtData = jwtDecode(token) || {}
      
      setUserData({
        id: jwtData?.sub || '',
        email: jwtData?.email || '',
        picture: jwtData?.picture || '',
        name: jwtData?.given_name || jwtData?.name || ''
      })

      if(token !== inuiToken){
        setToken(token)
        const _d = new Date()
        // Add one day to current date
        setTokenExp(_d.setDate(_d.getDate() + 1))
      }
    }

    return token
  }, [inuiToken])

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

  const handleLogout = async () => {
    setUserData({
      email: '',
      picture: '',
      name: ''
    })
    
    setTimeout(() => {
      setTokenExp(0)
      setToken('')
    }, 1000)
  }

  useEffect(() => {
    if(!inuiToken) googleLogout()
  }, [inuiToken])

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
