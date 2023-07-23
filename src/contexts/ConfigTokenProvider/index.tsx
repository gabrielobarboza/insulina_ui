import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback
} from 'react'
import store from 'store'
import { tokenActions } from '@/utils'
import { useCalcTables } from '@/contexts'
import { TableList, AppConfig } from "@/interfaces"
import { isEqual } from 'lodash'

type ConfigTokenContextType = {
    token: string,
    genToken: () => string
    readToken: () => TableList
}
  
export const ConfigTokenContext = createContext({} as ConfigTokenContextType);

export const useConfigToken = () => useContext(ConfigTokenContext)

const ConfigTokenProvider = ({ children }) => {
    const [ token, setToken ] = useState<string>('')
    const [ storedToken, setStoredToken ] = useState<string>('')
    const { dataTables, setDataTables } = useCalcTables()
    
    const [ config, setConfig ] = useState<AppConfig>({
      token,
      dataTables
    })

    const genToken = useCallback(() => dataTables?.length ? tokenActions.gen(dataTables) : '', [dataTables])
    const readToken = useCallback(() => (token ? tokenActions.read(token) : []), [token])

    useEffect(() => {
      const _token = store.get(tokenActions.key)
      if(_token && _token !== token) setStoredToken(_token)      
    }, [])

    useEffect(() => {
      if(!token && storedToken !== token) setToken(storedToken)
    }, [storedToken])

    useEffect(() => {
      if(token) {
        const storedTables = readToken()
        setConfig(conf => ({
          ...conf,
          token
        }))

        if(!storedToken || (storedToken !== token))
          store.set(tokenActions.key, token)

        if(!isEqual(dataTables, storedTables))
          setDataTables(storedTables)
      }
    }, [token])

    useEffect(() => {
      if(dataTables) {
        const dataToken = genToken();

        if(dataToken !== token) setToken(dataToken)

        if(!isEqual(dataTables, config.dataTables))
          setConfig(conf => ({
            ...conf,
            dataTables
          }))
      }
    }, [dataTables])

  return (
    <>
        <ConfigTokenContext.Provider
            value={{ token, genToken, readToken }}
        >
        {children}
        </ConfigTokenContext.Provider>
    </>
  )
}

export default ConfigTokenProvider