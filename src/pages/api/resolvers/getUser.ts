import { connections, parseUser } from "../utils";

const dataUser = connections.users;

export async function handleGetUser(id: string) {
  try {
    if(!id) return {}
    await dataUser.loadInfo(true);
    const { USERS } = dataUser.sheetsByTitle;
    const usersRows = await USERS.getRows();
    
    const userRow = usersRows.find(r => r.get('ID') === id)
    
    return parseUser(userRow)
  } catch(err) {
    console.error(err)
    throw err;
  }
}

export async function getUser(_, args) {
  try {
    const dataUser = await handleGetUser(args.id)

    return dataUser;
  } catch (err) {
    throw err;
  }
}

export default getUser
