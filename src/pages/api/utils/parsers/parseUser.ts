import { GoogleSpreadsheetRow } from "google-spreadsheet";
import {omit} from 'lodash'

type User = {
  id: string
  email: string
} 

export const parseUser = (row: GoogleSpreadsheetRow<Record<string, any>>):User => {
  const rowObject = row.toObject()

  return Object.keys(rowObject).reduce((res, key) => {
      res[key.toLowerCase()] = rowObject[key]
    return res
  }, { id: '', email: ''})
}