import {
  createContext,
  useState,
  useContext,
} from 'react'

type SidebarContextType = {
    setViewSidebar: (view:boolean) => any
    viewSidebar: boolean
}
  
export const SidebarContext = createContext({} as SidebarContextType);

export const useSidebar = () => useContext(SidebarContext)

const SideBarProvider = ({ children }) => {
    const [ viewSidebar, setViewSidebar] = useState<boolean>(false)

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