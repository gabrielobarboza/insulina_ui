import { connections, parseTableData } from "../utils";

const dataTables = connections.tables;

export async function handleGetUserTables(id: string) {
  try {
    if(!id) return {}

    await dataTables.loadInfo(true);
    const { TABLES } = dataTables.sheetsByTitle;
    const tablesRows = await TABLES.getRows();
    const userTablesRows: any[] = tablesRows.filter(r => r.get('USER_ID') === id) || []
    const tables = userTablesRows.map((r, index) => ({
      ...parseTableData(r),
      index
    }))

    return {
      tables,
      tablesCount: tables.length
    }
  } catch(err) {
    console.error(err)
    throw err
  }  
}

export async function getUserTables(_, args) {
  try {
    const dataUserTables = await handleGetUserTables(args.id)
    return dataUserTables;
  } catch (err) {
    throw err;
  }
}

export default getUserTables
