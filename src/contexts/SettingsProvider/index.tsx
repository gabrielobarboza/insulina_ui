import {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo
} from 'react'
import { dataToken } from '@/utils'
import { TableList, AppConfig } from "@/interfaces"
import { isEqual } from 'lodash'
import { useLocalStorage } from '@/hooks'
import { useCalcTables } from '@/contexts'

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
    storedTables: TableList
}
  
export const SettingsContext = createContext({} as SettingsContextType);

export const useSettings = () => useContext(SettingsContext)

const SettingsProvider = ({ children }) => {
  const [ token, setToken ] = useState<string>('')
  const [ storedToken, setStoredToken ] = useLocalStorage<string>(dataToken.key, '')
  const { dataTables, setDataTables } = useCalcTables()
    
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
    console.log('storedTables ->', storedTables)
  }, [storedTables])

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
    loading: loadingTables
  } = useGetUserTablesQuery({
    variables: {
      id: userData.id
    },
    skip: !userData.id
  })
  const [setUser, { loading: loadingSetUser }] = useSetUserMutation()
  // console.log('userQuery ==>', userQuery, loadingUser)
  // console.log('tablesQuery ==>', tablesQuery, loadingTables)
  // console.log('parsed data ==>', tablesQuery?.getUserTables?.tables?.map(t => parseDataTable(t)))
  // console.log('dataTables ==>', dataTables)

  const loading = useMemo(
    () => loadingSetUser|| loadingUser || loadingTables,
  [loadingSetUser, loadingUser, loadingTables])

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
    if(tablesQuery?.getUserTables?.tables?.length && !loading){
      setDataTables(tablesQuery.getUserTables.tables.map(t => parseDataTable(t)))
    }
  }, [tablesQuery, loading])

  

  return (
    <>
        <SettingsContext.Provider
          value={{ token, configToken, storedTables }}
        >
        {children}
        </SettingsContext.Provider>
    </>
  )
}

export default SettingsProvider