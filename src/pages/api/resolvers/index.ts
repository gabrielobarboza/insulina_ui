import { connections, parseTableData, parseUser } from "../utils";

const dataUser = connections.users;
const dataTables = connections.tables;

export const resolvers = {
  Query: {
    getUser: async (_, args) => {
      try {
        await dataUser.loadInfo(true);
        const { USERS } = dataUser.sheetsByTitle;
        const usersRows = await USERS.getRows();
        
        const userRow = usersRows.find(r => r.get('ID') === args.id)

        return parseUser(userRow);
      } catch (error) {
        throw error;
      }
    },
    getUserTables: async (_, args) => {
      try {
        await dataTables.loadInfo(true);
        const { TABLES } = dataTables.sheetsByTitle;
        const tablesRows = await TABLES.getRows();
        const userTablesRows = tablesRows.filter(r => r.get('USER_ID') === args.id)

        return userTablesRows.map((r, index) => ({
          ...parseTableData(r),
          index
        }));
      } catch (error) {
        throw error;
      }
    }
  }
};