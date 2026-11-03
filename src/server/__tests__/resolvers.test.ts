import {
  ConditionalCheckFailedException,
  DeleteItemCommand,
  GetItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { client } from '@/pages/api/utils/dynamoDB'
import { getUser, setUser } from '@/pages/api/resolvers/handleUser'
import {
  deleteUserDocument,
  getUserDocuments,
  saveUserDocument,
} from '@/pages/api/resolvers/handleUserDocuments'
import { buildContext } from '@/server/graphqlContext'
import { signSession } from '@/server/auth/session'

// Evita que `../utils` crie o JWT da conta de serviço na importação.
vi.mock('@/pages/api/utils/service', () => ({}))

// Valores fictícios, só para teste.
const SECRET = 'segredo-ficticio-de-teste-com-32-bytes-ou-mais'
const A = 'user-a'
const B = 'user-b'
const ctxA = { user: { id: A, email: 'a@x' } }

let send: ReturnType<typeof vi.spyOn>

function sentCommand(index = 0): unknown {
  return send.mock.calls[index][0]
}

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', SECRET)
  vi.stubEnv('NEXT_PUBLIC_OAUTH_ID', 'test-client-id')
  vi.stubEnv('AWS_DOCUMENTS_TABLE', 'test-documents')
  vi.stubEnv('AWS_USER_TABLE', 'test-users')
  send = vi.spyOn(client, 'send').mockResolvedValue({} as never)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('buildContext (R1)', () => {
  it('sem sessão lança UNAUTHENTICATED e não toca o banco', () => {
    let caught: unknown
    try {
      buildContext({ req: { headers: {} } })
    } catch (err) {
      caught = err
    }
    expect((caught as { extensions?: { code?: string } }).extensions?.code).toBe('UNAUTHENTICATED')
    expect(send).not.toHaveBeenCalled()
  })

  it('com sessão válida devolve context.user', () => {
    const token = signSession({ sub: A, email: 'a@x' }, SECRET, Date.now())
    expect(buildContext({ req: { headers: { authorization: `Bearer ${token}` } } })).toEqual(ctxA)
  })
})

describe('getUserDocuments (R2)', () => {
  it('filtra pelo usuário da sessão e ignora argumentos extras', async () => {
    send.mockResolvedValue({ Items: [] } as never)
    const extraArgs: Record<string, unknown> = { id: B }

    await getUserDocuments(undefined, extraArgs, ctxA)

    const command = sentCommand()
    expect(command).toBeInstanceOf(ScanCommand)
    const values = unmarshall((command as ScanCommand).input.ExpressionAttributeValues ?? {})
    expect(values).toEqual({ ':ID': A })
  })
})

describe('saveUserDocument (R3)', () => {
  it('grava com user_id da sessão, mesmo com user/user_id de outra pessoa no corpo', async () => {
    send.mockResolvedValue({ Attributes: marshall({ id: 'doc-1', user_id: A, name: 'Tabela' }) } as never)
    const args = { document: { id: 'doc-1', name: 'Tabela', user_id: B }, user: B }

    await saveUserDocument(undefined, args, ctxA)

    const command = sentCommand()
    expect(command).toBeInstanceOf(UpdateItemCommand)
    const input = (command as UpdateItemCommand).input
    expect(unmarshall(input.Key ?? {})).toEqual({ id: 'doc-1', user_id: A })
    expect(Object.values(unmarshall(input.ExpressionAttributeValues ?? {}))).not.toContain(B)
  })
})

describe('deleteUserDocument (R4)', () => {
  it('apaga com condição e chave do usuário da sessão → true', async () => {
    await expect(deleteUserDocument(undefined, { id: 'doc-1' }, ctxA)).resolves.toBe(true)

    const command = sentCommand()
    expect(command).toBeInstanceOf(DeleteItemCommand)
    const input = (command as DeleteItemCommand).input
    expect(unmarshall(input.Key ?? {})).toEqual({ id: 'doc-1', user_id: A })
    expect(input.ConditionExpression).toBe('attribute_exists(id)')
  })

  it('documento de outra pessoa ou inexistente → NOT_FOUND "Tabela não encontrada"', async () => {
    send.mockRejectedValue(new ConditionalCheckFailedException({ message: 'detalhe interno', $metadata: {} }))

    const error = await deleteUserDocument(undefined, { id: 'doc-de-b' }, ctxA).catch((err: unknown) => err)

    expect((error as { extensions?: { code?: string } }).extensions?.code).toBe('NOT_FOUND')
    expect((error as Error).message).toBe('Tabela não encontrada')
  })

  it('outro erro do banco → lança erro genérico, nunca false', async () => {
    send.mockRejectedValue(new Error('detalhe interno do banco'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const error = await deleteUserDocument(undefined, { id: 'doc-1' }, ctxA).catch((err: unknown) => err)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).not.toContain('detalhe interno')
    expect((error as { extensions?: { code?: string } }).extensions?.code).not.toBe('NOT_FOUND')
  })
})

describe('setUser (R5)', () => {
  it('grava uid e email da sessão, ignorando argumentos', async () => {
    const args: Record<string, unknown> = { id: B, email: 'b@x' }

    const result = await setUser(undefined, args, ctxA)

    expect(result).toEqual({ id: A, email: 'a@x' })
    const input = (sentCommand() as UpdateItemCommand).input
    expect(unmarshall(input.Key ?? {})).toEqual({ uid: A })
    expect(Object.values(unmarshall(input.ExpressionAttributeValues ?? {}))).toEqual(['a@x'])
  })
})

describe('getUser (R6)', () => {
  it('lê o usuário da sessão, ignorando argumentos', async () => {
    send.mockResolvedValue({ Item: marshall({ uid: A, email: 'a@x' }) } as never)
    const args: Record<string, unknown> = { id: B }

    const result = await getUser(undefined, args, ctxA)

    expect(result).toEqual({ id: A, email: 'a@x' })
    const command = sentCommand()
    expect(command).toBeInstanceOf(GetItemCommand)
    expect(unmarshall((command as GetItemCommand).input.Key ?? {})).toEqual({ uid: A })
  })
})
