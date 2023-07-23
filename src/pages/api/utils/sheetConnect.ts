import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAuth } from "./serviceAuth";

export const connection = {
  users: new GoogleSpreadsheet(process.env.NEXT_PUBLIC_USERS_SHEET_ID, serviceAuth),
  tables: new GoogleSpreadsheet(process.env.NEXT_PUBLIC_TABLES_SHEET_ID, serviceAuth),
}