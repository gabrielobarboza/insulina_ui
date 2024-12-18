import { getUser, setUser } from './handleUser'
import { getUserTables, saveUserTable, deleteUserTable } from './handleUserTables'

export const resolvers = {
  Query: {
    getUser,
    getUserTables
  },
  Mutation: {
    setUser,
    saveUserTable,
    deleteUserTable
  }
};