import { GoogleSpreadsheetRow } from "google-spreadsheet";
import {omit} from 'lodash'

type Table = {
  id: string
  name: string
  initial_ui: number
  initial_mgdl: number
  limit_ui?: number
  increment_mgdl?: number
  triggers_mgdl?: number[]
}

export const parseTableData = (row: GoogleSpreadsheetRow<Record<string, any>>):Table => {
  
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