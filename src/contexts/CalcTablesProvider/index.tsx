import { createContext, useState, useContext, useEffect } from 'react'
import { TableList, Table, TableItem } from "@/interfaces";
import { nanoid } from 'nanoid'

// import { mockedTables } from "@/utils/data"

type CalcTablesContextType = {
  dataTables: TableList,
  getCalcTable: (_id?:string) => Promise<Table|null>,
  newCalcTable: (table:Table) => Table,
  saveCalcTable: (table:Table) => Promise<Table>,
  setDataTables: (tableList:TableList) => any,
  selectCalcTable: (_id?:string) => Promise<Table|null>,
  selectedTable: Table
}

export const CalcTablesContext = createContext({} as CalcTablesContextType);

export const useCalcTables = () => useContext(CalcTablesContext)

export const CalcTablesProvider = ({ children }) => {
  const [ dataTables, setDataTables ] = useState<TableList|null>(null)
  const [ selectedTable, setSelectedTable ] = useState<Table|null>(null)
  // const [ dataTables, setDataTables ] = useState<TableList>(mockedTables)
  const getCalcTable = async _id => await _id ? dataTables.find(table => table.id === _id) : null
  const newCalcTable = params => {
    const newTable =  TableItem.create({ ...params})
    setSelectedTable(newTable)
    return newTable
  }

  const saveCalcTable = async params => {
    const tableList:TableList = dataTables ? [...dataTables] : []
    const _id = params?.id
    let currTable:Table|null = null
    if(_id && selectedTable && (selectedTable.id === _id)) {
      currTable = {
        ...selectedTable,
        ...params
      }
      const tableIndex = dataTables.findIndex(({ id }) => id === currTable.id)
      dataTables[tableIndex] = { ...currTable }
    }

    if(!_id) {
      currTable = TableItem.create({
        ...params,
        id: nanoid(),
      })
      tableList.push(currTable)
    }

    await setDataTables(tableList)
    return currTable
  }

  const selectCalcTable = async (_id) => {
    if(_id) {
      const targetTable = await getCalcTable(_id)            
      setSelectedTable(targetTable)
      return targetTable
    } else {
      setSelectedTable(null)
      return null
    }
  }
  
  return (
    <>
        <CalcTablesContext.Provider
            value={{
              dataTables,
              getCalcTable,
              newCalcTable,
              saveCalcTable,
              setDataTables,
              selectCalcTable,
              selectedTable,
            }}
        >
        {children}
        </CalcTablesContext.Provider>
    </>
  )
}

export default CalcTablesProvider