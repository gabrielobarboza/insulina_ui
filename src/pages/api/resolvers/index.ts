import { connections } from "../utils";
import getUser from './getUser'
import getUserTables from './getUserTables'

export const resolvers = {
  Query: {
    getUser,
    getUserTables
  }
};