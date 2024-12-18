import { connections, parseUser } from "../utils";

const dataUser = connections.users;

const defaultUserData = {
  id: '',
  email: ''
}

async function userSheet(){
  await dataUser.loadInfo(true);
  const { USERS } = dataUser.sheetsByTitle;
  return USERS
}

export async function handleGetUser(id: string) {
  try {
    if(!id) return defaultUserData
    const USERS = await userSheet()
    const usersRows = await USERS.getRows();
   
    const userRow = usersRows.find(r => r.get('ID') === id)
    
    return parseUser(userRow)
  } catch(err) {
    console.error(err)
    throw err;
  }
}

export async function getUser(_, { id }) {
  try {
    const data = await handleGetUser(id)
    return data;
  } catch (_err) {
    // throw _err;
    return {
      id: '',
      email: ''
    }
  }
}

export async function setUser(_, { id, email }) {
  try {
    if(!id || !email) return {}
    const USERS = await userSheet()
    await USERS.addRow({
      ID: id,
      EMAIL: email
    })
    return {
      id,
      email
    };
  } catch (_err) {
    // throw _err;
    return defaultUserData
  }
}
