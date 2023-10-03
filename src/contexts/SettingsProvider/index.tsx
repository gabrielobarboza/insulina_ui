import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { dataToken } from '@/utils'
import { TableList, AppConfig } from "@/interfaces"
import { isEqual } from 'lodash'
import { useLocalStorage } from '@/hooks'
import { useCalcTables, useLoading } from '@/contexts'

import { parseDataTable } from '@/utils'
import { useAuth } from '@/contexts'
import {
  useGetUserQuery,
  useGetUserTablesQuery,
  useSetUserMutation
} from '@/api/graphql'

type SettingsContextType = {
    token: string,
    configToken: string
    storedTables: TableList,
    loadingConfig: boolean
}
  
export const SettingsContext = createContext({} as SettingsContextType);

export const useSettings = () => useContext(SettingsContext)

const SettingsProvider = ({ children }) => {
  const [ token, setToken ] = useState<string>('')
  const [ storedToken, setStoredToken ] = useLocalStorage<string>(dataToken.key, '')
  const { dataTables, setDataTables, loadingTables } = useCalcTables()
  const { setLoading, loading} = useLoading()

  const [ config, setConfig ] = useState<AppConfig>({
    token,
    dataTables
  })

  const configToken = useMemo(
    () => dataTables?.length ? dataToken.gen(dataTables) : '',
    [dataTables]
  )
  const storedTables = useMemo(
    () => (token ? dataToken.read(token) : []), 
    [token]
  )

  useEffect(() => {
    if(!token && storedToken !== token) setToken(storedToken)
  }, [storedToken])

  useEffect(() => {
    if(token) {
      setConfig(conf => ({
        ...conf,
        token
      }))
      if(!storedToken || (storedToken !== token))
        setStoredToken(token)
      if(!isEqual(dataTables, storedTables))
        setDataTables(storedTables)
    }
  }, [token])

  useEffect(() => {
    if(dataTables) {
      if(configToken !== token) setToken(configToken)

      if(!isEqual(dataTables, config.dataTables))
        setConfig(conf => ({
          ...conf,
          dataTables
        }))
    }
  }, [dataTables])

  // NEW CONFIG CODE 

  const { userData } = useAuth()
  
  const {
    data: userQuery,
    loading: loadingUser,
    called: callUser,
  } = useGetUserQuery({
    variables: {
      id: userData.id
    },
    skip: !userData.id
  })
  const {
    data: tablesQuery,
    refetch: refetchTables,
    loading: loadingUserTables
  } = useGetUserTablesQuery({
    variables: {
      id: userData.id
    },
    skip: !userData.id
  })
  const [setUser, { loading: loadingSetUser }] = useSetUserMutation()

  const loadingConfig = useMemo(
    () => loadingTables || loadingSetUser || loadingUser || loadingUserTables,
  [loadingTables, loadingSetUser, loadingUser, loadingUserTables])

  useEffect(() => {
    if(
      userData?.id
      && callUser
      && !loadingUser
      && !userQuery?.getUser?.id
    ) {
      setUser({
        variables:{
          id: userData.id,
          email: userData.email
        }
      })
    }
  }, [userQuery, loadingUser, callUser])

  useEffect(() => {
    if(tablesQuery?.getUserTables?.tables?.length && !loadingConfig){
      setDataTables(tablesQuery.getUserTables.tables.map(t => parseDataTable(t)))
    }
  }, [tablesQuery, loadingConfig])

  useEffect(() => {
    if(loading !== loadingConfig) setLoading(loadingConfig)
  }, [loadingConfig])

  const handlers = {
    saveCalcTable: useCallback(({ status }) => {
      if(status) refetchTables()
    },[refetchTables])
  }

  useEffect(() => {
    if (typeof window !== 'undefined')
      window.addEventListener(
        'message',
        (event: MessageEvent<{ type: string; message: string }>) => {
          if (event.origin !== window.origin) return
          if (typeof event.data !== 'object') return
          if (!event.data.type) return
          if (handlers[event.data.type]) handlers[event.data.type](event.data)
        }
      )
  }, [])

  return (
    <>
        <SettingsContext.Provider
          value={{ token, configToken, storedTables, loadingConfig }}
        >
        {children}
        </SettingsContext.Provider>
    </>
  )
}

export default SettingsProvider