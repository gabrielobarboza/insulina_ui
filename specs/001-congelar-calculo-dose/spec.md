
# Feature Specification: Congelar o cálculo de dose (testes de caracterização)

**Feature Branch**: `001-congelar-calculo-dose`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Spec 01 — Congelar o cálculo de dose (testes de caracterização). Projeto: insulina_ui · Arquivo-alvo: src/utils/validateUnits.ts. Tipo: somente testes. Nenhum código de produção muda nesta spec. Objetivo: registrar em testes automatizados exatamente o que o cálculo de dose faz hoje (inclusive o que é questionável), como rede de segurança para mudanças futuras (validação de tabelas, avisos, atualização do Next, novo layout). Teste de caracterização: descreve o comportamento atual, não o ideal; problemas conhecidos viram testes ISSUE-n que passam hoje e serão invertidos na Spec 03."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rede de segurança para o cálculo de dose atual (Priority: P1)

Como mantenedor do `insulina_ui`, eu preciso de uma suíte de testes automatizados que
registre exatamente o comportamento atual de `validateUnits` (modos base, incremental
e gatilhos, com e sem limite, incluindo bordas e bugs conhecidos), para que qualquer
mudança futura no projeto (validação de tabelas, avisos, upgrade do Next, novo layout)
quebre um teste imediatamente se alterar um resultado sem intenção — antes que o erro
chegue a uma dose real de insulina.

**Why this priority**: Sem essa rede de segurança, qualquer refatoração ou upgrade de
dependência pode silenciosamente mudar um valor de dose calculado, com risco direto à
segurança do usuário. Esta suíte é pré-requisito bloqueante (via Principle II da
constituição) para qualquer trabalho futuro que toque o cálculo.

**Independent Test**: Pode ser testado e entregue de forma independente rodando
`yarn test`: a suíte importa a função real de `src/utils/validateUnits.ts` e cobre
todos os casos da tabela de casos de teste, sem exigir nenhuma outra feature.

**Acceptance Scenarios**:

1. **Given** uma tabela no modo base (`list` com 1 valor, sem `custom`), **When** a
   função é chamada com uma glicemia informada, **Then** o resultado é
   `floor(units + (curr − base) / base)` quando `curr >= base`, ou `0` quando
   `curr < base`.
2. **Given** uma tabela no modo incremental (`list` com 1 valor e `custom`), **When**
   a função é chamada, **Then** o resultado é `floor(units + (curr − base) / custom)`
   quando `curr >= base`, ou `0` quando `curr < base`.
3. **Given** uma tabela no modo gatilhos (`list` com 2+ valores), **When** a função é
   chamada, **Then** o resultado é `units + índice do último gatilho atingido` (onde
   `curr >= valor do gatilho`), ignorando qualquer `custom` presente.
4. **Given** uma tabela com `limit` truthy, **When** o resultado calculado excede o
   `limit`, **Then** o resultado retornado é o próprio `limit`.
5. **Given** uma tabela com `limit` ausente ou igual a `0`, **When** a função é
   chamada com qualquer glicemia, **Then** não há teto algum aplicado ao resultado.

### Edge Cases

- Tabela sem valores (`list: []`): a função não lança erro e retorna `0` (caso `E1`).
- Gatilhos fora de ordem (ex.: `[80,210,120]`): o `forEach` percorre na ordem do
  array, não na ordem numérica, produzindo um resultado divergente do que se
  esperaria de uma lista ordenada (caso `ISSUE-1`, com referência `E4r` usando a
  lista ordenada).
- Gatilhos duplicados (ex.: `[80,120,120]`): o índice duplicado eleva o resultado
  além do esperado em comparação com a lista sem duplicata (caso `ISSUE-5`, com
  referência `E5r`).
- Glicemia negativa: aceita sem erro, resultado `0` quando abaixo do primeiro valor
  (caso `ISSUE-2`).
- Ausência de teto (`limit` ausente/`0`) combinada com entrada de glicemia muito alta
  (ex.: erro de digitação): gera um resultado de dose muito grande sem nenhuma
  salvaguarda (caso `ISSUE-3`).
- A função retorna apenas um número: não há mecanismo para sinalizar "glicemia
  baixa" quando o resultado é `0` por estar abaixo do primeiro valor da tabela
  (caso `ISSUE-4`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A suíte de testes MUST importar e executar a função real exportada de
  `src/utils/validateUnits.ts` (nunca uma cópia ou reimplementação da lógica).
- **FR-002**: A suíte MUST conter um teste por caso listado na tabela de casos de
  teste (seção "Test Cases" abaixo), nomeado como `"<id> — <descrição>"`, e cada
  teste MUST passar contra o código atual sem modificá-lo.
- **FR-003**: Os testes MUST cobrir os três modos de cálculo (base, incremental,
  gatilhos), o comportamento do `limit` (presente, ausente, igual a `0`, maior e
  menor que o resultado calculado), e os casos de borda e problemas conhecidos
  listados.
- **FR-004**: Os testes MUST cobrir especificamente os 3 exemplos usados na tela de
  ajuda do `CalcTableForm` (casos `B5`, `I4`, `T7`), reproduzindo exatamente a
  tabela e a glicemia mostradas na ajuda.
- **FR-005**: Cada teste identificado como `ISSUE-n` MUST ter um nome e um
  comentário no código explicando que ele documenta um comportamento atual e
  indesejado, e qual seria o comportamento esperado/correto.
- **FR-006**: A suíte MUST incluir os casos de referência `E4r` e `E5r`, que usam
  as mesmas listas de gatilhos dos casos `ISSUE-1` e `ISSUE-5`, porém ordenadas
  e sem duplicatas respectivamente, para demonstrar o valor "correto" ao qual os
  `ISSUE-n` serão comparados quando invertidos na Spec 03.
- **FR-007**: A execução de `yarn test` MUST rodar a suíte inteira sem acesso à
  rede e sem depender de variáveis de ambiente, terminando com todos os testes
  passando.
- **FR-008**: Se o valor produzido pela função atual divergir do valor documentado
  na tabela de casos de teste desta spec, o teste MUST refletir o valor real
  observado na execução, e a divergência MUST ser reportada ao autor da spec; o
  código de produção MUST NOT ser alterado para fazer o valor bater com a tabela.
- **FR-009**: Nenhum arquivo de produção (qualquer arquivo em `src/` que não seja um
  arquivo de teste) MUST ser modificado por este trabalho.
- **FR-010**: Apenas `devDependencies`, o script `test` em `package.json`, e
  arquivos de configuração/teste MUST ser adicionados ou alterados para viabilizar
  a execução da suíte.
- **FR-011**: Todo código de teste MUST ser escrito em TypeScript sem uso do tipo
  `any`.
- **FR-012**: A infraestrutura de testes MUST NOT depender da versão atual do
  Next.js instalada no projeto (para permanecer estável durante um futuro upgrade
  do Next).

### Key Entities

- **Document (tabela de cálculo)**: representa a configuração de uma tabela de
  dose — `units` (unidades iniciais), `values.list` (lista de valores de
  glicemia/gatilhos), `values.custom` (opcional, incremento customizado), `limit`
  (opcional, teto do resultado). Já definida em `src/interfaces/index.ts`; não é
  alterada por esta spec, apenas consumida pelos testes.
- **Caso de teste**: uma combinação de tabela de entrada, glicemia informada (`curr`)
  e resultado esperado, identificada por um `id` (ex.: `B1`, `I4`, `T7`, `L2`,
  `ISSUE-n`, `E4r`), conforme a tabela de casos de teste desta spec.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `yarn test` executa e termina com 100% dos casos de teste listados
  nesta spec passando, sem acesso à rede e sem variáveis de ambiente.
- **SC-002**: `git diff --stat` após o trabalho mostra alterações apenas em
  `package.json`, no arquivo de lockfile de dependências, em arquivos de
  configuração de teste, e em arquivos de teste — nenhum arquivo de produção em
  `src/` é alterado.
- **SC-003**: Um teste de sensibilidade manual (em branch descartável, nunca
  commitada) que troca `>=` por `>`, `Math.floor` por `Math.round`, ou inverte a
  ordem da comparação `limit < result` em `validateUnits.ts` faz pelo menos um
  teste da suíte falhar, para cada uma dessas três alterações.
- **SC-004**: Cada teste `ISSUE-n` (ISSUE-1 a ISSUE-5) contém um comentário
  explicando o problema atual e o comportamento esperado, verificável por leitura
  direta do código de teste.
- **SC-005**: Os três exemplos da tela de ajuda do `CalcTableForm` (casos `B5`,
  `I4`, `T7`) estão representados na suíte com os mesmos valores de entrada e
  saída mostrados na ajuda.

## Test Cases *(reference data for implementation)*

> Esta seção não é um requisito em si, mas a fonte de dados exata que os testes da
> seção de Requisitos Funcionais devem cobrir (FR-002 a FR-006). Valores conferidos
> executando a lógica atual de `validateUnits`.

Legenda: `ui` = unidades iniciais · `lim` = limite · `gl` = glicemia informada (mg/dL).

### Modo base — `list: [80]`, `ui: 2`

| id | gl | resultado | observação |
|----|-----|-----------|------------|
| B1 | 79 | 0 | abaixo da base |
| B2 | 80 | 2 | igual à base conta como atingido |
| B3 | 159 | 2 | um pouco antes do próximo degrau |
| B4 | 160 | 3 | primeiro degrau |
| B5 | 241 | 4 | exemplo 1 da tela de ajuda |
| B6 | 160.5 | 3 | glicemia decimal; `floor` |

### Modo incremental — `list: [80]`, `custom: 60`, `ui: 2`

| id | gl | resultado | observação |
|----|-----|-----------|------------|
| I1 | 80 | 2 | |
| I2 | 139 | 2 | |
| I3 | 140 | 3 | |
| I4 | 268 | 5 | exemplo 2 da tela de ajuda |

### Modo gatilhos — `list: [80,120,170,210]`, `ui: 3`

| id | gl | resultado | observação |
|----|-----|-----------|------------|
| T1 | 79 | 0 | abaixo do primeiro gatilho |
| T2 | 80 | 3 | |
| T3 | 119 | 3 | |
| T4 | 120 | 4 | valor igual ao gatilho conta como atingido |
| T5 | 169 | 4 | |
| T6 | 170 | 5 | |
| T7 | 198 | 5 | exemplo 3 da tela de ajuda |
| T8 | 210 | 6 | |
| T9 | 999 | 6 | sem teto, satura no último gatilho |
| T10 | 150 | 4 | com `custom: 60` junto: `custom` é ignorado |

### Limite

| id | tabela | gl | resultado | observação |
|----|--------|-----|-----------|------------|
| L1 | base, `ui 2`, `lim 4` | 241 | 4 | resultado igual ao limite |
| L2 | base, `ui 2`, `lim 3` | 241 | 3 | limite menor: aplica o teto |
| L3 | base, `ui 2`, `lim 8` | 241 | 4 | limite maior: não interfere |
| L4 | base, `ui 2`, `lim 0` | 9999 | 125 | `lim 0` = sem teto (ver ISSUE-3) |
| L5 | base, `ui 2`, sem `lim` | 9999 | 125 | sem teto (ver ISSUE-3) |
| L6 | gatilhos, `ui 3`, `lim 4` | 999 | 4 | teto também vale nos gatilhos |
| L7 | base, `ui 2`, `lim 8` | 60 | 0 | limite não eleva um resultado 0 |

### Bordas e problemas conhecidos (documentam o comportamento ATUAL)

| id | tabela | gl | resultado atual | por que é um problema |
|----|--------|-----|-----------------|-----------------------|
| E1 | `list: []`, `ui 2` | 100 | 0 | tabela sem valores não gera erro |
| ISSUE-1 | gatilhos `[80,210,120]`, `ui 3` | 150 | **5** | fora de ordem: o correto seria 4 (ordenado `[80,120,210]` dá 4 — caso de referência E4r) |
| ISSUE-2 | base `[80]`, `ui 2` | -5 | 0 | glicemia negativa é aceita sem erro |
| ISSUE-3 | base `[80]`, `ui 2`, sem teto | 9999 | 125 | sem limite nem faixa plausível, um erro de digitação gera dose enorme (L4/L5) |
| ISSUE-4 | base `[80]`, `ui 2` | 79 | 0 | a função devolve só um número: não há como sinalizar "glicemia baixa" (B1, T1, L7) |
| ISSUE-5 | gatilhos `[80,120,120]`, `ui 3` | 130 | **5** | gatilho duplicado pula um nível (sem duplicata `[80,120]` dá 4 — caso E5r) |

Casos de referência (também devem existir como testes): **E4r** (`[80,120,210]`,
`ui 3`, gl 150 → 4) e **E5r** (`[80,120]`, `ui 3`, gl 130 → 4).

## Assumptions

- O framework de testes a ser escolhido na fase de plano deve ser independente da
  versão do Next.js instalada (preferência indicada: Vitest, com alias `@/`
  configurado); a compatibilidade com a versão do Node do projeto será confirmada
  no plano.
- Não é necessário testar componentes React, chamadas de rede, GraphQL ou
  DynamoDB — o escopo é estritamente a função pura `validateUnits`.
- Esta spec não cria pipeline de CI; a execução é local via `yarn test`.
- Esta spec não corrige nenhum dos `ISSUE-n` identificados — a correção está
  reservada para uma spec futura (Spec 03) que define regras de segurança de dose
  com parâmetros da equipe médica, conforme Principle V da constituição do
  projeto.
- Esta suíte serve de árbitro de regressão para trabalhos futuros que tocam
  autenticação no servidor e upgrade do Next, sem a necessidade de revalidar o
  cálculo manualmente a cada mudança.
