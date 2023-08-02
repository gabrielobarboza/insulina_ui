import { GoogleSpreadsheet } from 'google-spreadsheet';
import { serviceAccountAuth } from '../service';

const tablesSheetId = process.env.NEXT_PUBLIC_TABLES_SHEET_ID
export const dataTables = new GoogleSpreadsheet(tablesSheetId, serviceAccountAuth);
