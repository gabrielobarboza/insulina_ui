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
    return console.error(err)
  }  
}

export const getUserTables = async (_, args) => {
  try {
    const dataUser = await handleGetUserTables(args.id)

    return dataUser;
  } catch (err) {
    throw err;
  }
}

export default getUserTables
