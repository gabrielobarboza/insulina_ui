import {
  createContext,
  useState,
  useContext,
} from 'react'
import { useCalcTables } from '../CalcTablesProvider'

type SidebarContextType = {
    setViewSidebar: (view:boolean) => any
    viewSidebar: boolean
}
  
export const SidebarContext = createContext({} as SidebarContextType);

export const useSidebar = () => useContext(SidebarContext)

const SideBarProvider = ({ children }) => {
    const [ viewSidebar, setSidebar] = useState<boolean>(false)
    const { selectTableConfig } = useCalcTables()    

  const setViewSidebar = (val:boolean) => {
    selectTableConfig(null)
    setSidebar(val)
  }
  
  return (
    <>
        <SidebarContext.Provider
            value={{ viewSidebar, setViewSidebar }}
        >
        {children}
        </SidebarContext.Provider>
    </>
  )
}

export default SideBarProvider