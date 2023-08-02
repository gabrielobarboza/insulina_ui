import { GoogleSpreadsheet } from 'google-spreadsheet';
import { serviceAccountAuth } from '../service';

const usersSheetId = process.env.NEXT_PUBLIC_USERS_SHEET_ID
export const dataUsers = new GoogleSpreadsheet(usersSheetId, serviceAccountAuth);
