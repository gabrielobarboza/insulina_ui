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

// import { parseDataTable } from '@/utils'
// import { useAuth } from '@/contexts'
// import { useGetUserTablesQuery } from '@/api/graphql'

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

  const configToken = useMemo(() => dataTables?.length ? dataToken.gen(dataTables) : '', [dataTables])
  const storedTables = useMemo(() => (token ? dataToken.read(token) : []), [token])

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

  // const { userData } = useAuth()
  // console.log('userData ==>', userData)

  // const {data, loading} = useGetUserTablesQuery({ variables: { id: userData.id }})
  // console.log('getUserTables loading ==>', loading)
  // console.log('getUserTables data ==>', data)
  // console.log('parsed data ==>', data?.getUserTables?.tables?.map(t => parseDataTable(t)))
  // console.log('dataTables ==>', dataTables)

  // useEffect(() => {
  //   if(data?.getUserTables?.tables?.length && !loading){
  //     setDataTables(data.getUserTables.tables.map(t => parseDataTable(t)))
  //   }
  // }, [data, loading])

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