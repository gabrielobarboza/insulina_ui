// import { connections } from "../utils";
import { getUser, setUser } from './handleUser'
import { getUserTables, saveUserTable } from './handleUserTables'

export const resolvers = {
  Query: {
    getUser,
    getUserTables
  },
  Mutation: {
    setUser,
    saveUserTable
  }
};