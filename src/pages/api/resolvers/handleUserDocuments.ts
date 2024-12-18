import { randomBytes } from 'crypto';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  DeleteItemCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  client,
  PutOrUpdate,
} from "../utils";
import { DocumentInput, Document } from '@/api/graphql';

type PDocument = Partial<Document>

const dataDocumentInput = payload => ({
  TableName: process.env.AWS_DOCUMENTS_TABLE,
  ...payload
});

const putOrUpdateDocument = async (Item: object, primaryKey: string) => {
  return await PutOrUpdate(dataDocumentInput({
    Item,
    primaryKey,
    sortKey: 'user_id'
  }))
};

type PartialDocumentList =  PDocument[]
type UserDocuments = {
  documents: PartialDocumentList
  documentsCount: number
}

const defaultUserDocumentsData: UserDocuments  = {
  documents: [],
  documentsCount: 0
}

export async function getUserDocuments(_, { id } : Record<'id', string>) {
  try {
    if(!id) return defaultUserDocumentsData
    const { Items } = await client.send(
      new ScanCommand(dataDocumentInput({
        FilterExpression: '#USER = :ID',
        ExpressionAttributeNames: {
            '#USER': 'user_id',
        },
        ExpressionAttributeValues: marshall({
            ':ID': id,
        }),
      }))
    );
    return {
      documents: Items.map(Item => unmarshall(Item)),
      documentsCount: Items.length
    }
  } catch (_err) {
    // throw _err;
    console.error(_err)
    return defaultUserDocumentsData
  }
}

type SaveUserDocumentParams = {
  user: string
  document: Partial<DocumentInput>
}

export async function saveUserDocument(_, args:SaveUserDocumentParams) : Promise<PDocument> {
  const { user, document: { id, ...document }} = args  
  const currentItemId = id || randomBytes(16).toString("hex")

  try {
    const updatedDocument = await putOrUpdateDocument({
      ...document,
      user_id: user,
      id: currentItemId,
    }, 'id')

    return unmarshall(updatedDocument.Attributes)

  } catch (_err) {
    // throw _err;
    console.error(_err)
    return {}
  }
}

export async function deleteUserDocument(_, { id, user }: Record<'id'|'user', string>): Promise<Boolean> {
  try {
    if(!id) return false
    client.send(
      new DeleteItemCommand(dataDocumentInput({
        Key: marshall({
          id,
          user_id: user
        })
      }))
    );
    return true 
  } catch (_err) {
    // throw _err;
    console.error(_err)
    return false
  }
}
