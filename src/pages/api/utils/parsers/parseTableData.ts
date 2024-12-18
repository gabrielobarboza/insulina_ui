import { omit } from 'lodash'
import { randomBytes } from 'crypto';
import { ScanCommandOutput } from '@aws-sdk/client-dynamodb';
type DocumentData = 
|'id'
|'name'
|'initial_ui'
|'limit_ui'
|'initial_mgdl'
|'increment_mgdl'
|'triggers_mgdl'
|'user_id'

type StringValue = { S: string }
type IScanCommandOutput<T> = Omit<ScanCommandOutput, "Items"> & T

type DocumentItem = Record<DocumentData, StringValue> & {
  triggers_mgdl?: { SS: string[] }
}
type DocumentItemsInput = IScanCommandOutput<DocumentItem>

type Document = Record<DocumentData, string> & {
  triggers_mgdl?: string[]
}

export type DocumentKeys = Record<DocumentData, string>
export type DocumentInputData = Partial<DocumentKeys>

export const parseDocumentsData = ( Items: Partial<DocumentItemsInput>[]): Partial<Document>[] => {
  const parsedItems = Items.map(Item => {
    return Object.keys(Item).reduce((res, key) => {
      res[key] = Item[key]
      return res
    }, {})
  })

  return parsedItems
}
