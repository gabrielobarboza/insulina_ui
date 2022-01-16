import { createContext, useState, useContext, useEffect } from 'react'
import { TableList } from "@/interfaces";
import { mockedTables } from "@/utils/data"

type CalcTablesContextType = {
    dataTables: TableList
}
  
export const CalcTablesContext = createContext({} as CalcTablesContextType);

export const useCalcTables = () => {
  return useContext(CalcTablesContext)
}

export const CalcTablesProvider = ({ children }) => {
    const [ dataTables, setDataTAbles ] = useState<TableList>([])

    useEffect(() => {
        setDataTAbles(mockedTables)
    }, [])
  return (
    <>
        <CalcTablesContext.Provider
            value={{ dataTables }}
        >
        {children}
        </CalcTablesContext.Provider>
    </>
  )
}