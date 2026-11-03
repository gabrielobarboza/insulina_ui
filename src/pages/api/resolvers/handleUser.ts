// import { randomUUID } from 'crypto';
import { marshall } from "@aws-sdk/util-dynamodb";
import {
  client,
  parseUser,
  PutOrUpdate,
  User
} from "../utils";
import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { AuthenticatedUser } from '@/server/auth/getAuthenticatedUser';
import { GraphQLContext } from '@/server/graphqlContext';

const dataUserInput = payload => ({
  TableName: process.env.AWS_USER_TABLE,
  ...payload
});

const defaultUserData = {
  id: '',
  email: ''
}

export async function handleGetUser(id: string): Promise<User> {
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

export async function handleSetUser({ id, email }: AuthenticatedUser): Promise<User> {
  try {
    if(!id || !email) return defaultUserData
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

export async function getUser(
  _parent: unknown,
  _args: Record<string, unknown>,
  { user }: GraphQLContext
): Promise<User> {
  try {
    const data = await handleGetUser(user.id)
    return data;
  } catch (_err) {
    console.error(_err)
    return defaultUserData
  }
}

export async function setUser(
  _parent: unknown,
  _args: Record<string, unknown>,
  { user }: GraphQLContext
): Promise<User> {
  try {
    const data = await handleSetUser({ id: user.id, email: user.email })
    return data;
  } catch (_err) {
    console.error(_err)
    return defaultUserData
  }
}
