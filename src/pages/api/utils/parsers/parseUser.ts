import { GetItemCommandOutput } from '@aws-sdk/client-dynamodb';

type StringValue = { S: string }
type IGetItemCommandOutput<T> = Omit<GetItemCommandOutput, "Item"> & T 
type UserItemInput = IGetItemCommandOutput<{
  uid: StringValue
  email: StringValue
}>
export type User = Record<'id'|'email', String> 

export const parseUser = (Item: Partial<UserItemInput>): User => ({
  id: Item.uid.S,
  email: Item.email.S
})