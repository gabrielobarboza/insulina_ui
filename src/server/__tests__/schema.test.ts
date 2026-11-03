import { readFileSync } from 'fs'
import path from 'path'
import { GraphQLObjectType, buildSchema } from 'graphql'
import { describe, expect, it } from 'vitest'

const schemaPath = path.resolve(__dirname, '../../pages/api/schemas/schema.graphql')
const schema = buildSchema(readFileSync(schemaPath, 'utf8'))

const IDENTITY_ARGS = ['user', 'email', 'id']

function signatures(type: GraphQLObjectType | null | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  for (const field of Object.values(type?.getFields() ?? {})) {
    const args = field.args.map((arg) => `${arg.name}: ${arg.type.toString()}`).join(', ')
    result[field.name] = `(${args}): ${field.type.toString()}`
  }
  return result
}

describe('schema GraphQL (R7)', () => {
  it('nenhum campo de Query/Mutation recebe identidade, exceto o id do documento em deleteUserDocument', () => {
    for (const type of [schema.getQueryType(), schema.getMutationType()]) {
      for (const field of Object.values(type?.getFields() ?? {})) {
        for (const arg of field.args) {
          if (field.name === 'deleteUserDocument' && arg.name === 'id') continue
          expect(IDENTITY_ARGS, `${type?.name}.${field.name}(${arg.name})`).not.toContain(arg.name)
        }
      }
    }
  })

  it('assinaturas seguem contracts/graphql-schema.md', () => {
    expect(signatures(schema.getQueryType())).toEqual({
      getUser: '(): User!',
      getUserDocuments: '(): UserDocuments',
    })
    expect(signatures(schema.getMutationType())).toEqual({
      setUser: '(): User!',
      saveUserDocument: '(document: DocumentInput!): Document',
      deleteUserDocument: '(id: ID!): Boolean',
    })
  })
})
