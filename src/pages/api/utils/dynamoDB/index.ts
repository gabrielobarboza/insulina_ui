import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const client = new DynamoDBClient({});

export * from './PutOrUpdate'

export default client