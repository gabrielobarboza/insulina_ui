import { dataTables } from './tablesConnect'
import { dataUsers } from './usersConnect'

export const connections = {
  users: dataUsers,
  tables: dataTables,
}

export default connections