import { randomBytes } from 'crypto';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  DeleteItemCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import { ApolloError } from 'apollo-server-micro';
import {
  client,
  PutOrUpdate,
} from "../utils";
import {
  Document,
  MutationDeleteUserDocumentArgs,
  MutationSaveUserDocumentArgs,
} from '@/api/graphql';
import { GraphQLContext } from '@/server/graphqlContext';

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

export async function getUserDocuments(
  _parent: unknown,
  _args: Record<string, unknown>,
  { user }: GraphQLContext
): Promise<UserDocuments> {
  try {
    const { Items } = await client.send(
      new ScanCommand(dataDocumentInput({
        FilterExpression: '#USER = :ID',
        ExpressionAttributeNames: {
            '#USER': 'user_id',
        },
        ExpressionAttributeValues: marshall({
            ':ID': user.id,
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

export async function saveUserDocument(
  _parent: unknown,
  { document: { id, ...document } }: MutationSaveUserDocumentArgs,
  { user }: GraphQLContext
): Promise<PDocument> {
  const currentItemId = id || randomBytes(16).toString("hex")

  try {
    // `user_id` vem depois do corpo: um `user_id` enviado pelo cliente nunca vale.
    const updatedDocument = await putOrUpdateDocument({
      ...document,
      user_id: user.id,
      id: currentItemId,
    }, 'id')

    return unmarshall(updatedDocument.Attributes)

  } catch (_err) {
    // throw _err;
    console.error(_err)
    return {}
  }
}

export async function deleteUserDocument(
  _parent: unknown,
  { id }: MutationDeleteUserDocumentArgs,
  { user }: GraphQLContext
): Promise<boolean> {
  try {
    await client.send(
      new DeleteItemCommand(dataDocumentInput({
        Key: marshall({
          id,
          user_id: user.id
        }),
        ConditionExpression: 'attribute_exists(id)'
      }))
    );
    return true
  } catch (err) {
    // Inexistente ou de outra pessoa: a chave inclui o user_id da sessão, então as duas dão no mesmo.
    if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
      throw new ApolloError('Tabela não encontrada', 'NOT_FOUND')
    }
    console.error('deleteUserDocument: falha no banco', err instanceof Error ? err.name : '')
    throw new Error('Internal server error')
  }
}
