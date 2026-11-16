import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

// Princípio VII (Spec 03, FR-005/FR-006): nomes de variáveis públicas não podem parecer segredo,
// e o legado do Google Sheets não pode voltar. O teste trabalha só com NOMES, nunca com valores.

/**
 * Exceções à regra de nomes públicos. Nova exceção exige alterar este teste de propósito.
 *
 * NEXT_PUBLIC_APP_KEY: é só a chave de assinatura do `dataToken`, o token de configuração das tabelas
 * guardado no navegador. Por ser NEXT_PUBLIC_ é pública por definição e não protege nada. Uso e valor
 * não mudam na Spec 03; trocar esse mecanismo fica para spec futura (mexe no PWA e no uso sem rede).
 */
export const PUBLIC_ENV_EXCEPTIONS = ['NEXT_PUBLIC_APP_KEY'] as const

const ROOT = path.resolve(__dirname, '..', '..')
const EXCLUDED_DIRS = ['node_modules', '.next', '.git', 'public']
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs']
const EXCLUDED_FILES = ['src/__tests__/publicEnv.test.ts', 'src/api/graphql.tsx']
const LEGACY_NAMES = [
  'google-spreadsheet',
  'serviceAccountAuth',
  'connectors/',
  'NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_',
  'NEXT_PUBLIC_USERS_SHEET_ID',
  'NEXT_PUBLIC_TABLES_SHEET_ID',
]
const ANCHOR_NAMES = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_OAUTH_ID']
const FORBIDDEN_WORDS = ['KEY', 'SECRET', 'PRIVATE', 'TOKEN']
const PUBLIC_PREFIX = 'NEXT_PUBLIC_'

type ScannedFile = { path: string; text: string }
type Violation = { name: string; path: string }

function toPosix(relative: string): string {
  return relative.split(path.sep).join('/')
}

function listSourceFiles(): ScannedFile[] {
  const files: ScannedFile[] = []
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.includes(entry.name)) walk(absolute)
        continue
      }
      if (!entry.isFile() || !SOURCE_EXTENSIONS.includes(path.extname(entry.name))) continue
      const relative = toPosix(path.relative(ROOT, absolute))
      if (EXCLUDED_FILES.includes(relative)) continue
      files.push({ path: relative, text: fs.readFileSync(absolute, 'utf8') })
    }
  }
  walk(ROOT)
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

function collectPublicEnvNames(text: string): string[] {
  return text.match(/NEXT_PUBLIC_[A-Z0-9_]+/g) ?? []
}

function isForbiddenPublicName(name: string): boolean {
  const rest = name.slice(PUBLIC_PREFIX.length)
  return FORBIDDEN_WORDS.some((word) => rest.includes(word))
}

function isException(name: string): boolean {
  return (PUBLIC_ENV_EXCEPTIONS as readonly string[]).includes(name)
}

function findPublicEnvViolations(files: ScannedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    for (const name of new Set(collectPublicEnvNames(file.text))) {
      if (isForbiddenPublicName(name) && !isException(name)) violations.push({ name, path: file.path })
    }
  }
  return violations
}

function findLegacyNames(files: ScannedFile[]): Violation[] {
  const found: Violation[] = []
  for (const file of files) {
    for (const name of LEGACY_NAMES) {
      if (file.text.includes(name)) found.push({ name, path: file.path })
    }
  }
  return found
}

function format(violations: Violation[]): string {
  return violations.map((v) => `${v.name} em ${v.path}`).join('\n')
}

describe('coletor e classificação (texto sintético)', () => {
  it('E1: coleta nomes em qualquer forma de uso, texto ou comentário', () => {
    const text = [
      'const { NEXT_PUBLIC_X_TOKEN } = process.env',
      'const a = process.env.NEXT_PUBLIC_A_SECRET',
      "const b = process.env['NEXT_PUBLIC_B_PRIVATE']",
      'module.exports = { env: { NEXT_PUBLIC_C_KEY: 1 } }',
      '// NEXT_PUBLIC_D_TOKEN',
      "const e = 'NEXT_PUBLIC_E_KEY'",
    ].join('\n')
    expect(collectPublicEnvNames(text)).toEqual([
      'NEXT_PUBLIC_X_TOKEN',
      'NEXT_PUBLIC_A_SECRET',
      'NEXT_PUBLIC_B_PRIVATE',
      'NEXT_PUBLIC_C_KEY',
      'NEXT_PUBLIC_D_TOKEN',
      'NEXT_PUBLIC_E_KEY',
    ])
    expect(findPublicEnvViolations([{ path: 'x.ts', text }])).toHaveLength(6)
  })

  it('E2: palavra proibida em qualquer parte do nome é violação', () => {
    const text = 'NEXT_PUBLIC_PRIVATEKEY_X NEXT_PUBLIC_X_TOKEN_URL'
    expect(format(findPublicEnvViolations([{ path: 'x.ts', text }]))).toBe(
      'NEXT_PUBLIC_PRIVATEKEY_X em x.ts\nNEXT_PUBLIC_X_TOKEN_URL em x.ts',
    )
  })

  it('E3: nome sem palavra proibida e exceção listada não são violações', () => {
    const text = 'process.env.NEXT_PUBLIC_API_URL process.env.NEXT_PUBLIC_APP_KEY'
    expect(findPublicEnvViolations([{ path: 'x.ts', text }])).toEqual([])
  })

  it('E4: acha nome do legado e informa o arquivo', () => {
    const found = findLegacyNames([{ path: 'package.json', text: '"google-spreadsheet": "^4.0.2"' }])
    expect(format(found)).toBe('google-spreadsheet em package.json')
  })
})

describe('repositório real', () => {
  const files = listSourceFiles()
  const paths = files.map((f) => f.path)
  const collected = new Set(files.flatMap((f) => collectPublicEnvNames(f.text)))

  it('E5: varre a raiz e src/, sem pastas excluídas, o próprio teste nem gerados', () => {
    expect(paths).toContain('config.ts')
    expect(paths).toContain('next.config.js')
    expect(paths.some((p) => p.startsWith('src/'))).toBe(true)
    const excluded = paths.filter((p) => EXCLUDED_DIRS.some((dir) => p.startsWith(`${dir}/`)))
    expect(excluded).toEqual([])
    expect(paths.filter((p) => EXCLUDED_FILES.includes(p))).toEqual([])
  })

  it('E6: o coletor encontra as variáveis públicas conhecidas (não passa vazio)', () => {
    for (const name of ANCHOR_NAMES) expect(collected.has(name), `não encontrou ${name}`).toBe(true)
  })

  it('E7: nenhuma variável pública com nome de segredo fora das exceções', () => {
    const violations = findPublicEnvViolations(files)
    expect(violations, `variáveis públicas com nome de segredo:\n${format(violations)}`).toEqual([])
  })

  it('E8: toda exceção listada ainda está em uso', () => {
    const obsolete = PUBLIC_ENV_EXCEPTIONS.filter((name) => !collected.has(name))
    expect(obsolete, obsolete.map((name) => `exceção obsoleta: ${name}`).join('\n')).toEqual([])
  })

  it('E9: nenhum nome do legado do Google Sheets nos fontes nem no package.json', () => {
    const packageJson: ScannedFile = {
      path: 'package.json',
      text: fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
    }
    const found = findLegacyNames([...files, packageJson])
    expect(found, `legado do Google Sheets encontrado:\n${format(found)}`).toEqual([])
  })
})
