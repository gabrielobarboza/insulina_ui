import { connection, parseTableData, parseUser } from "../utils";

const dataUser = connection.users;
const dataTables = connection.tables;

export const resolvers = {
  Query: {
    getUsers: async () => {
      try {
        await dataUser.loadInfo(true);
        const { USERS } = dataUser.sheetsByTitle;
        const usersRows = await USERS.getRows();
        
        return usersRows.map(parseUser);
      } catch (error) {
        throw error;
      }
    },
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