import { parseDataTable } from "@/utils";
import { TableInputData, connections, parseTableData, parseTableInput } from "../utils";
import { Table } from "@/interfaces";

const dataTables = connections.tables;
parseDataTable

type PartialTableList =  Partial<Table>[]
type UserTables = {
  tables: PartialTableList
  tablesCount: number
}

const defaultUserTablesData: UserTables  = {
  tables: [],
  tablesCount: 0
}

async function tableSheet(){
  await dataTables.loadInfo(true);
  const { TABLES } = dataTables.sheetsByTitle;
return TABLES
}

export async function handleGetUserTables(id: string): Promise<UserTables> {
  try {
    if(!id) return defaultUserTablesData
    const TABLES = await tableSheet()
    const tablesRows = await TABLES.getRows();
    const userTablesRows: any[] = tablesRows.filter(r => r.get('USER_ID') === id) || []
    const tables: PartialTableList = userTablesRows.map((r) => parseTableData(r))

    return {
      tables,
      tablesCount: tables.length
    }
  } catch(_err) {
    console.error(_err)
    // throw _err
    return defaultUserTablesData
  }  
}

export async function saveUserTable(_, { user, table: { id, ...table} }): Promise<Partial<Table>> {
  try {
    const TABLES = await tableSheet()
    const tablesRows = await TABLES.getRows();
    const select = id ? tablesRows.find(r => r.get('ID') === id) : null

    if(select) {
      await parseTableInput(table, select)
      return parseTableData(select)
    } else {
      const NEW_TABLE_DATA: TableInputData = await parseTableInput(table)
     
      return parseTableData(await TABLES.addRow({
        USER_ID: user,
        ...NEW_TABLE_DATA
      }))
    }

  } catch (_err) {
    // throw _err;
    return {}
  }
}

export async function getUserTables(_, args) {
  try {
    const userTables = await handleGetUserTables(args.id)
    return userTables;
  } catch (_err) {
    // throw _err;
    return defaultUserTablesData
  }
}
