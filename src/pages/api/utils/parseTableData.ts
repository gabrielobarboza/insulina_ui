import { GoogleSpreadsheetRow } from "google-spreadsheet";

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
  
  const limit_ui = Number(row.get('LIMIT_UI'))
  const increment_mgdl = Number(row.get('INCREMENT_MGDL'))
  const triggers_mgdl = row.get('TRIGGERS_MGDL')?.split(',')?.map(n => Number(n)).filter(n => n)

  return {
    id: row.get('ID') as string,
    name: row.get('NAME') as string,
    initial_ui: Number(row.get('INITIAL_UI')),
    initial_mgdl: Number(row.get('INITIAL_MGDL')),
    ...(limit_ui ? { limit_ui } : {}),
    ...(increment_mgdl ? { increment_mgdl } : {}),
    ...(triggers_mgdl?.length ? { triggers_mgdl } : {})
  }
}