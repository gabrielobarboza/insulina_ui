import { handleGetUser } from "../resolvers/handleUser";
import { handleGetUserTables } from "../resolvers/handleUserTables";

export default async function handler(req, res) {
  const {
    query: { id }
  } = req;

  try {
    if (!id) throw new Error();

    const dataUser = await handleGetUser(id);
    const dataTables = await handleGetUserTables(id)
    
    res.status(200).json({ ...dataUser, ...dataTables});
  } catch (error) {
    res.status(500).json(error);
  }
}