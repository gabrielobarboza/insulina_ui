import { createContext, useState, useContext, useEffect } from 'react'
import { TableList, Table, TableItem } from "@/interfaces";
import { mockedTables } from "@/utils/data"
import { nanoid } from 'nanoid'


type CalcTablesContextType = {
    dataTables: TableList,
    getCalcTable: (_id:string) => Table,
    editCalcTable: (params:Table) => Promise<Table>
    setDataTables: (tableList:TableList) => any
}
  
export const CalcTablesContext = createContext({} as CalcTablesContextType);

export const useCalcTables = () => {
  return useContext(CalcTablesContext)
}

export const CalcTablesProvider = ({ children }) => {
    const [ dataTables, setDataTables ] = useState<TableList|null>(null)
    // const [ dataTables, setDataTables ] = useState<TableList>(mockedTables)
    const getCalcTable = _id => _id ? dataTables.find(table => table.id === _id) : null
    const editCalcTable = async params => {
      const tableList:TableList = dataTables ? [...dataTables] : []
      let table:Table|null = null

      if(params?.id) {
        table = getCalcTable(params.id)
        table.name = params.name
        table.units = params.units
        table.values = params.values

      } else {
        table = TableItem.create({
          ...params,
          id: nanoid(),
        })
        tableList.push(table)
      }

      console.log("editCalcTable =>", tableList)
      await setDataTables(tableList)
      
      return table
    }
  
  return (
    <>
        <CalcTablesContext.Provider
            value={{ dataTables, editCalcTable, setDataTables, getCalcTable }}
        >
        {children}
        </CalcTablesContext.Provider>
    </>
  )
}