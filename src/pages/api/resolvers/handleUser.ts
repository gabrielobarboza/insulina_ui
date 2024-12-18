// import { randomUUID } from 'crypto';
import { marshall } from "@aws-sdk/util-dynamodb";
import {
  client,
  parseUser,
  PutOrUpdate
} from "../utils";
import { GetItemCommand } from '@aws-sdk/client-dynamodb';

const dataUserInput = payload => ({
  TableName: process.env.AWS_USER_TABLE,
  ...payload
});

const defaultUserData = {
  id: '',
  email: ''
}

export async function handleGetUser(id: string) {
  try {
    if(!id) return defaultUserData
    const { Item } = await client.send(
      new GetItemCommand(dataUserInput({
        Key: marshall({
          uid: id
        })
      }))
    );
    
    return parseUser(Item)
  } catch(err) {
    // throw err;
    console.error(err)
    throw err;
  }
}

export async function handleSetUser({ id, email }: Record<'id'|'email', string>) {
  try {
    if(!id || !email) return {}
    await PutOrUpdate(dataUserInput({
      Item: {
        uid: id,
        email
      },
      primaryKey: 'uid'
    }));

    return { id, email };
  } catch(err) {
    // throw err;
    console.error(err)
    throw err;
  }
}

export async function getUser(_, { id }) {
  try {
    const data = await handleGetUser(id)
    return data;
  } catch (_err) {
    console.error(_err)
    return defaultUserData
  }
}

export async function setUser(_, { id, email }) {
  try {
    const data = await handleSetUser({ id, email })
    return data;
  } catch (_err) {
    console.error(_err)
    return defaultUserData
  }
}
