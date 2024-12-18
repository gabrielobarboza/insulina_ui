import { UpdateItemCommand, UpdateItemCommandInput } from "@aws-sdk/client-dynamodb";
import { client } from "./index";
import { marshall } from "@aws-sdk/util-dynamodb";

type PutOrUpdateParams = {
    Item: object
    TableName: string
    primaryKey: string
    sortKey?: string
}

export async function PutOrUpdate({ TableName, Item, primaryKey, sortKey }: PutOrUpdateParams) {
    const itemKeys = Object.keys(Item).filter(k => k !== primaryKey && k !== sortKey);
    const params = {
        TableName,
        UpdateExpression: `SET ${itemKeys.map((k, index) => `#field${index} = :value${index}`).join(', ')}`,
        ExpressionAttributeNames: itemKeys.reduce((accumulator, key, index) => ({
            ...accumulator,
            [`#field${index}`]: key
        }), {}),
        ExpressionAttributeValues: marshall(itemKeys.reduce((accumulator, key, index) => ({
            ...accumulator,
            // [`:value${index}`]: { [`${keyTypes[key]}`]: Item[key] }
            [`:value${index}`]: Item[key]
        }), {})),
        Key: marshall({
            // [primaryKey]: { [`${keyTypes[primaryKey]}`]: Item[primaryKey] }
            [primaryKey]: Item[primaryKey],
            ...(sortKey? { [sortKey]: Item[sortKey] } : {})
        }),
        ReturnValues: 'ALL_NEW'
    };

    const result = await client.send(new UpdateItemCommand(params as UpdateItemCommandInput))
    return result
}

export default PutOrUpdate