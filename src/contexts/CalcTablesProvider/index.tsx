import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { DocumentList, Document, DocumentItem } from "@/interfaces";
import { useAuth } from '@/contexts'

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
} from '@mui/material'
import Select, { SelectChangeEvent } from '@mui/material/Select';
import {
  useDeleteUserDocumentMutation,
  useSaveUserDocumentMutation
} from '@/api/graphql'
import { sendMessage } from '@/utils';

// import { mockedTables } from "@/utils/data"
type Components = {
  [key:string]: any
}

interface TableSelectProps extends React.Component {
  helperText?: string
}

type CalcTablesContextType = {
  dataTables: DocumentList,
  createCalcTable: (table:Document) => Document,
  deleteCalcTable: (_id?:string, user?:string) => void,
  getCalcTable: (_id?:string) => Promise<Document|null>,
  loadingTables: boolean,
  saveCalcTable: (table:Document) => Promise<Document>,
  setDataTables: (tableList:DocumentList) => any,
  selectTableConfig: (_id?:string) => Promise<Document|null>,
  selectTable: (_id?:string) => Promise<Document|null>,
  selectedConfig: Document,
  tableSelected: Document,
  components: Components
}

export const CalcTablesContext = createContext({} as CalcTablesContextType);

export const useCalcTables = () => useContext(CalcTablesContext)

export const CalcTablesProvider = ({ children }) => {
  const [ dataTables, setDataTables ] = useState<DocumentList|null>(null)
  const [ selectedConfig, setSelectedConfig ] = useState<Document|null>(null)
  const [ tableSelected, setTableSelected ] = useState<Document|null>(null)
  const { userData } = useAuth()

  const [saveUserTable, { loading: loadingSaveTable }] = useSaveUserDocumentMutation()
  const [deleteUserTable, { loading: loadingDeleteTable }] = useDeleteUserDocumentMutation()

  const getCalcTable = async _id => await _id ? dataTables.find(table => table.id === _id) : null
  const createCalcTable = params => {
    const newTable = DocumentItem.create({ ...params})
    setSelectedConfig(newTable)
    return newTable
  }

  const saveCalcTable = useCallback(async params => {    
    const tableList:DocumentList = dataTables ? [...dataTables] : []
    const _id = params?.id
    let currTable:Document|null = null
    if(_id && selectedConfig && (selectedConfig.id === _id)) {
      currTable = {
        ...params
      }
    }
    
    if(!_id) {
      currTable = DocumentItem.create({ ...params })
    }

    const valuesList = [...currTable?.values?.list]

    await saveUserTable({
      variables: {
        user: userData.id,
        document: {
          ...(currTable?.id ? { id: currTable.id } : {}),
          ...(currTable?.name ? { name: currTable.name } : {}),
          ...(currTable?.units ? { initial_ui: currTable.units } : {}),
          ...(currTable?.values?.custom ? { increment_mgdl: currTable.values.custom } : {}),
          ...(currTable?.limit ? { limit_ui: currTable.limit } : {}),
          ...(valuesList?.length ? {
            initial_mgdl: valuesList.shift(),
            triggers_mgdl: valuesList
          } : {})
        }
      }
    }).then(data => {
      const tableIndex = (dataTables || [])?.findIndex(({ id }) => id === currTable.id)
      if(tableIndex === -1)
        tableList.push({
          ...currTable,
          id: data?.data?.saveUserDocument?.id
        })
      else
        tableList[tableIndex] = { ...currTable }
    })

    sendMessage('saveCalcTable', { status: true })  
    setDataTables(tableList)
    return currTable
  }, [dataTables, selectedConfig])

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

  const deleteCalcTable = async (id, user) => {
    if(id)
      setSelectedConfig(null)

      await deleteUserTable({
        variables: {
          id,
          user
        }
      }).then(data => {
        if(data?.data?.deleteUserDocument)
          setDataTables(dataTables.filter(({ id: _id }) => (_id !== id)))
        sendMessage('saveCalcTable', { status: true }) 
      })     
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

  const loadingTables = useMemo(
    () => loadingSaveTable|| loadingDeleteTable,
  [loadingSaveTable, loadingDeleteTable])

  return (
    <>
        <CalcTablesContext.Provider
          value={{
            dataTables,
            createCalcTable,
            deleteCalcTable,
            getCalcTable,
            loadingTables,
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