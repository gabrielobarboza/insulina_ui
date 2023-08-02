import { GoogleSpreadsheetRow } from "google-spreadsheet";

type User = {
  id: string
  email: string
} 

export const parseUser = (row: GoogleSpreadsheetRow<Record<string, any>>):User => ({
  id: row?.get('ID'),
  email: row?.get('EMAIL')
})