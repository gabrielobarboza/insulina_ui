import { createContext, useState, useContext, useEffect } from 'react'
import { TableList, Table, TableItem } from "@/interfaces";
import { nanoid } from 'nanoid'

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
} from '@mui/material'
import Select, { SelectChangeEvent } from '@mui/material/Select';

// import { mockedTables } from "@/utils/data"
type Components = {
  [key:string]: any
}

interface TableSelectProps extends React.Component {
  helperText?: string
}

type CalcTablesContextType = {
  dataTables: TableList,
  getCalcTable: (_id?:string) => Promise<Table|null>,
  deleteCalcTable: (_id?:string) => void,
  createCalcTable: (table:Table) => Table,
  saveCalcTable: (table:Table) => Promise<Table>,
  setDataTables: (tableList:TableList) => any,
  selectCalcTable: (_id?:string) => Promise<Table|null>,
  selectedTable: Table,
  components: Components
}

export const CalcTablesContext = createContext({} as CalcTablesContextType);

export const useCalcTables = () => useContext(CalcTablesContext)

export const CalcTablesProvider = ({ children }) => {
  const [ dataTables, setDataTables ] = useState<TableList|null>(null)
  const [ selectedTable, setSelectedTable ] = useState<Table|null>(null)
  // const [ dataTables, setDataTables ] = useState<TableList>(mockedTables)
  const getCalcTable = async _id => await _id ? dataTables.find(table => table.id === _id) : null
  const createCalcTable = params => {
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
      tableList[tableIndex] = { ...currTable }
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

  const deleteCalcTable = (_id) => {
    if(_id)
      setSelectedTable(null)
      setDataTables(dataTables.filter(({ id }) => (_id !== id)))
  }

  const TableSelect = ({ helperText } : TableSelectProps) => {
    const handleSelect = (ev:SelectChangeEvent) => {
      const targetId = ev.target.value      
      if(targetId) selectCalcTable(targetId)
    }

    return (
      <FormControl fullWidth>
        <InputLabel id="calc-table-label">
            Tabela de Cálculo
        </InputLabel>
        <Select
            labelId="calc-table-label"
            id="calc-table-label-input"
            value={selectedTable?.id || ""}   
            label="Tabela de Cálculo"
            onChange={handleSelect}
            >
            <MenuItem value=""><em>Selecione</em></MenuItem>
            {dataTables?.map(({ id, name }) => 
                <MenuItem key={id} value={id}>{name}</MenuItem>
            )}                   
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
    )
  }
  
  return (
    <>
        <CalcTablesContext.Provider
            value={{
              dataTables,
              getCalcTable,
              deleteCalcTable,
              createCalcTable,
              saveCalcTable,
              setDataTables,
              selectCalcTable,
              selectedTable,
              components: {
                TableSelect
              }
            }}
        >
        {children}
        </CalcTablesContext.Provider>
    </>
  )
}

export default CalcTablesProvider