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
  selectTableConfig: (_id?:string) => Promise<Table|null>,
  selectTable: (_id?:string) => Promise<Table|null>,  
  selectedConfig: Table,
  tableSelected: Table,
  components: Components
}

export const CalcTablesContext = createContext({} as CalcTablesContextType);

export const useCalcTables = () => useContext(CalcTablesContext)

export const CalcTablesProvider = ({ children }) => {
  const [ dataTables, setDataTables ] = useState<TableList|null>(null)
  const [ selectedConfig, setSelectedConfig ] = useState<Table|null>(null)
  const [ tableSelected, setTableSelected ] = useState<Table|null>(null)

  // const [ dataTables, setDataTables ] = useState<TableList>(mockedTables)
  const getCalcTable = async _id => await _id ? dataTables.find(table => table.id === _id) : null
  const createCalcTable = params => {
    const newTable =  TableItem.create({ ...params})
    setSelectedConfig(newTable)
    return newTable
  }

  const saveCalcTable = async params => {    
    const tableList:TableList = dataTables ? [...dataTables] : []
    const _id = params?.id
    let currTable:Table|null = null
    if(_id && selectedConfig && (selectedConfig.id === _id)) {
      currTable = {
        ...selectedConfig,
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

  const selectTableConfig = async (_id) => {
    if(_id) {
      const targetTable = await getCalcTable(_id)            
      setSelectedConfig(targetTable)
      return targetTable
    } else {
      setSelectedConfig(null)
      return null
    }
  }

  const selectTable = async (_id) => {
    if(_id) {
      const targetTable = await getCalcTable(_id)            
      setTableSelected(targetTable)
      return targetTable
    } else {
      setTableSelected(null)
      return null
    }
  }

  const deleteCalcTable = (_id) => {
    if(_id)
      setSelectedConfig(null)
      setDataTables(dataTables.filter(({ id }) => (_id !== id)))
  }

  const TableSelect = ({ helperText } : TableSelectProps) => {
    const handleSelect = (ev:SelectChangeEvent) => {
      const targetId = ev.target.value      
      if(targetId) selectTable(targetId)
    }

    return (
      <FormControl fullWidth>
        <InputLabel id="calc-table-label">
            Tabela de Cálculo
        </InputLabel>
        <Select
            labelId="calc-table-label"
            id="calc-table-label-input"
            value={tableSelected?.id || ""}   
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
              selectTableConfig,
              selectTable,
              selectedConfig,
              tableSelected,
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