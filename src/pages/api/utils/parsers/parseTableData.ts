import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { omit } from 'lodash'
import { nanoid } from 'nanoid'

type Table = {
  id: string
  name: string
  initial_ui: number
  initial_mgdl: number
  limit_ui?: number
  increment_mgdl?: number
  triggers_mgdl?: number[]
}

type TableData = 
|'ID'
|'NAME'
|'INITIAL_UI'
|'LIMIT_UI'
|'INITIAL_MGDL'
|'INCREMENT_MGDL'
|'TRIGGERS_MGDL'
|'USER_ID'

export type TableKeys = Record<TableData, string>
export type TableInputData = Partial<TableKeys>
export type SpreadsheetTable = GoogleSpreadsheetRow<TableKeys>

export const parseTableData = (row: Partial<SpreadsheetTable>):Partial<Table> => {
  
  const rowObject = omit(row.toObject(), ['USER_ID'])
  const limit_ui = Number(rowObject.LIMIT_UI)
  const increment_mgdl = Number(rowObject.INCREMENT_MGDL)
  const triggers_mgdl = rowObject.TRIGGERS_MGDL?.split(',')?.map(n => Number(n)).filter(n => n)

  return {
    id: rowObject.ID as string,
    name: rowObject.NAME as string,
    initial_ui: Number(rowObject.INITIAL_UI),
    initial_mgdl: Number(rowObject.INITIAL_MGDL),
    ...(limit_ui ? { limit_ui } : {}),
    ...(increment_mgdl ? { increment_mgdl } : {}),
    ...(triggers_mgdl?.length ? { triggers_mgdl } : {})
  }
}

export const parseTableInput = async (table: Partial<Table>, curr?: SpreadsheetTable): Promise<Partial<TableInputData>> => {
  const NAME: string = table.name?.toString()
  const INITIAL_UI: string = table.initial_ui?.toString()
  const INITIAL_MGDL: string = table.initial_mgdl?.toString()
  const LIMIT_UI: string = table.limit_ui?.toString()
  const INCREMENT_MGDL: string = table.increment_mgdl?.toString()
  const TRIGGERS_MGDL: string = `${table?.triggers_mgdl?.join()},`

  const input: TableInputData = {
    ...(NAME ? { NAME } : {}),
    ...(INITIAL_UI ? { INITIAL_UI } : {}),
    ...(INITIAL_MGDL ? { INITIAL_MGDL } : {}),
    ...(LIMIT_UI ? { LIMIT_UI } : {}),
    ...(INCREMENT_MGDL ? { INCREMENT_MGDL } : {}),
    ...(TRIGGERS_MGDL && TRIGGERS_MGDL !== ','? { TRIGGERS_MGDL } : {}),
  }

  if(!curr) {
    input.ID = nanoid()
  } else {
    await Object.keys(input).forEach((key: TableData) => {
      if(curr.get(key) !== input[key] ) curr.set(key, input[key])  
    })

    input.ID = curr.get('ID')
    await curr.save()
  } 
  
  return input
}