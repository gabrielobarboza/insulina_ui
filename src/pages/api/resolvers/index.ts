import { getUser, setUser } from './handleUser'
import {
  getUserDocuments,
  saveUserDocument,
  deleteUserDocument
} from './handleUserDocuments'

export const resolvers = {
  Query: {
    getUser,
    getUserDocuments
  },
  Mutation: {
    setUser,
    saveUserDocument,
    deleteUserDocument
  }
};