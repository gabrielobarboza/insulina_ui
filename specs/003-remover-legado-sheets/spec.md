# Feature Specification: Remover o legado do Google Sheets e impor o Princípio VII por teste

**Feature Branch**: `003-remover-legado-sheets`

**Created**: 2026-11-16

**Status**: Approved (2026-11-16)

**Input**: User description: "Spec 03: remover o legado do Google Sheets e impor o Princípio VII por teste. Os dados vivem no DynamoDB; sobrou código morto do tempo em que o banco era Google Sheets (conectores nunca importados, um arquivo que cria uma credencial de conta de serviço a partir de variáveis públicas a cada importação dos resolvers, e as dependências da biblioteca de planilhas). Nenhuma variável pública pode carregar nome de segredo, exceto uma lista explícita e justificada, verificada por teste automatizado. O comportamento do app não muda. Ação manual do dono após o deploy: revogar a chave da conta de serviço, remover as variáveis e revogar o compartilhamento das planilhas."

**Pré-requisitos**:

- Spec 01 (`001-congelar-calculo-dose`) concluída: testes de caracterização do cálculo de dose passando.
- Spec 02 (`002-autenticacao-servidor`) concluída e em produção (T033–T042 marcadas).
- Constituição v1.1.0 em vigor (Princípio VII e o gate de login/acesso a dados/deploy).

## Contexto e diagnóstico *(fatos verificados no código atual, 2026-11-16)*

1. Os dados de usuários e tabelas vivem no DynamoDB. Nenhum fluxo do app lê ou grava planilhas.
2. `src/pages/api/utils/connectors/` (`index.ts`, `tablesConnect.ts`, `usersConnect.ts`) cria clientes de planilha
   a partir de `NEXT_PUBLIC_USERS_SHEET_ID` e `NEXT_PUBLIC_TABLES_SHEET_ID`. Nenhum arquivo importa esse diretório.
   Por estar sob `src/pages/api/`, o framework ainda o publica como rotas (`/api/utils/connectors/*`).
3. `src/pages/api/utils/service/auth.ts` cria, no carregamento do módulo, uma credencial de conta de serviço do
   Google a partir de `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL` e `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_KEY`. O
   módulo é reexportado por `src/pages/api/utils/index.ts` e por isso é carregado sempre que os resolvers são
   importados. Uma chave privada com prefixo público viola o Princípio VII.
4. Os testes dos resolvers precisam de um `vi.mock` desse módulo (`resolvers.test.ts`) só para neutralizar esse
   carregamento.
5. `package.json` declara `google-spreadsheet` e `@types/google-spreadsheet`; nada mais depende deles.
   `google-auth-library` é usado pela Spec 02 para verificar o token do Google no login e permanece.
6. Variáveis públicas declaradas hoje (`next.config.js` e `config.ts`): `NEXT_PUBLIC_APP_KEY`,
   `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_OAUTH_ID`. As do item 2 e 3 só aparecem no código morto.
7. `NEXT_PUBLIC_APP_KEY` vale um texto fixo e serve como nome da entrada no armazenamento local do navegador e como
   chave de codificação do `dataToken` (cópia das tabelas guardada no próprio navegador). Ela é enviada ao
   navegador por projeto, não protege nada contra quem tem o aparelho e não autoriza nada no servidor: é um
   identificador público, não um segredo.
8. Linha de base: `yarn test` passa com 106 verificações em 11 arquivos.

## Decisões *(resolvidas para esta spec)*

- **D1 — `NEXT_PUBLIC_APP_KEY` fica, como exceção justificada (FR-005).** Pelo item 7 do contexto, ela não é
  segredo. Uso e valor não mudam nesta spec; trocar o mecanismo do `dataToken` fica para spec futura, porque mexe
  no PWA e no uso sem rede.
- **D2 — Alcance de "o repositório não contém referências".** Vale para todo arquivo versionado, **exceto**
  `specs/` (registro histórico das specs 01–03, que citam esses nomes para descrevê-los). O lockfile entra no
  alcance.
- **D3 — O teste também protege contra a volta do legado.** Além da regra de nomes públicos, o mesmo teste
  automatizado falha se os nomes proibidos de FR-001 reaparecerem nos arquivos-fonte que ele varre ou no
  `package.json` (FR-006b).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O app continua funcionando igual depois da limpeza (Priority: P1)

Como pessoa que usa o `insulina_ui` para calcular a dose de insulina, eu preciso que login, tabelas e cálculo
funcionem exatamente como antes, para que uma limpeza interna não coloque em risco a dose que o app me mostra.

**Why this priority**: O app é usado a cada refeição. Qualquer regressão afeta a dose exibida; a limpeza só vale
se for invisível para quem usa.

**Independent Test**: Rodar a suíte inteira e, em produção, fazer login no PWA instalado, abrir as tabelas e
calcular uma dose.

**Acceptance Scenarios**:

1. **Given** o código sem o legado, **When** a suíte de testes roda, **Then** todas as verificações existentes
   (106) continuam passando, sem alteração em `validateUnits.ts` nem nos testes da Spec 01.
2. **Given** o deploy de produção com o código novo, **When** a pessoa faz login no PWA instalado e abre as tabelas,
   **Then** vê as mesmas tabelas e o mesmo resultado de cálculo de antes.
3. **Given** o código novo, **When** os resolvers são importados nos testes, **Then** nenhuma credencial de conta de
   serviço é criada e o `vi.mock` do módulo removido não é mais necessário.

---

### User Story 2 - Nenhum segredo chega ao navegador, e um teste impede que volte (Priority: P1)

Como dono do repositório público, eu preciso que nenhuma variável pública tenha nome de segredo e que um teste
falhe se alguém criar uma, para que o Princípio VII não dependa de lembrar de revisar.

**Why this priority**: A chave da conta de serviço com prefixo público é o motivo desta spec; sem o teste, o
mesmo erro pode voltar em qualquer PR.

**Independent Test**: Rodar o teste novo no código limpo (passa); adicionar temporariamente uma variável pública
com nome de segredo em um arquivo varrido (falha, citando arquivo e nome).

**Acceptance Scenarios**:

1. **Given** o código limpo, **When** o teste roda, **Then** passa, e a única variável pública com nome de segredo
   encontrada é `NEXT_PUBLIC_APP_KEY`, presente na lista de exceções.
2. **Given** um arquivo varrido que referencia `process.env.NEXT_PUBLIC_ALGUM_TOKEN` (ou a declara no bloco `env`),
   **When** o teste roda, **Then** falha e a
   mensagem diz o nome da variável e o arquivo.
3. **Given** um arquivo varrido que volta a mencionar um nome proibido de FR-001, **When** o teste roda, **Then**
   falha indicando o nome e o arquivo.
4. **Given** uma exceção listada que não aparece mais em nenhum arquivo varrido, **When** o teste roda, **Then**
   falha pedindo a remoção da exceção obsoleta.

---

### User Story 3 - A credencial antiga deixa de existir fora do código (Priority: P2)

Como dono do projeto, eu preciso revogar a chave da conta de serviço, apagar as variáveis antigas e encerrar o
compartilhamento das planilhas depois do deploy, para que uma chave que já foi pública não sirva para mais nada.

**Why this priority**: Remover o código não invalida a chave. Mas a ordem importa: revogar antes do deploy
quebraria a reversão; por isso vem depois da P1.

**Independent Test**: Seguir o checklist manual da quickstart e conferir no console do Google Cloud e na Vercel.

**Acceptance Scenarios**:

1. **Given** o código novo em produção e verificado (US1), **When** o dono segue o checklist, **Then** a chave da
   conta de serviço está revogada (ou a conta excluída), as variáveis `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_*`,
   `NEXT_PUBLIC_USERS_SHEET_ID` e `NEXT_PUBLIC_TABLES_SHEET_ID` não existem na Vercel nem no `.env.local`, e as
   planilhas antigas não estão mais compartilhadas com a conta de serviço.
2. **Given** o código novo em produção e o passo 2 da "Ação manual do dono" ainda não executado, **When** é
   preciso reverter para o deployment anterior, **Then** o app anterior sobe e funciona, porque só lê a chave na
   importação e não usa o Google Sheets.

### Edge Cases

- O próprio arquivo de teste precisa citar os nomes proibidos e as exceções: ele é excluído da varredura (ou monta
  os nomes de forma que não casem), sem abrir brecha para outros arquivos.
- Qualquer ocorrência de um nome `NEXT_PUBLIC_*` com palavra proibida conta como violação, inclusive em
  desestruturação (`const { NEXT_PUBLIC_API_TOKEN } = process.env`), texto ou comentário: o teste não tenta
  entender o código. Um falso positivo custa uma exceção justificada; um falso negativo custaria um segredo no
  navegador.
- Se uma mudança na varredura ou no coletor fizer o teste não encontrar `NEXT_PUBLIC_API_URL` e
  `NEXT_PUBLIC_OAUTH_ID`, o teste falha em vez de passar sem ter verificado nada.
- Uma palavra proibida no meio do nome (`NEXT_PUBLIC_PRIVATEKEY_X`, `NEXT_PUBLIC_X_TOKEN_URL`) é detectada: vale
  qualquer parte do nome após o prefixo.
- Um nome público legítimo que contenha uma das palavras (ex.: `NEXT_PUBLIC_..._KEYBOARD`) também falha; a saída é
  renomear ou adicionar exceção justificada.
- Um PWA com a versão anterior em cache continua funcionando após o deploy: a versão anterior não chamava as
  rotas removidas.
- Chamada a `/api/utils/connectors/*` depois do deploy responde 404.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Os arquivos versionados do repositório, exceto `specs/` (D2), NÃO DEVEM conter nenhuma ocorrência de
  `google-spreadsheet`, `serviceAccountAuth`, `connectors/`, `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_`,
  `NEXT_PUBLIC_USERS_SHEET_ID` nem `NEXT_PUBLIC_TABLES_SHEET_ID`. Isso inclui `package.json` e o lockfile.
- **FR-002**: O diretório `src/pages/api/utils/connectors/` e o módulo de credencial de conta de serviço
  (`src/pages/api/utils/service/`) DEVEM deixar de existir, junto com a reexportação que o carregava.
- **FR-003**: QUANDO alguém requisitar qualquer caminho sob `/api/utils/connectors/`, o servidor DEVE responder 404.
- **FR-004**: As dependências `google-spreadsheet` e `@types/google-spreadsheet` DEVEM ser removidas;
  `google-auth-library` DEVE permanecer.
- **FR-005**: Nenhuma variável com prefixo `NEXT_PUBLIC_` pode ter nome contendo `KEY`, `SECRET`, `PRIVATE` ou
  `TOKEN`, exceto uma lista explícita e justificada. Decisão já tomada: a lista tem UM item, `NEXT_PUBLIC_APP_KEY`,
  registrado como exceção justificada: é só a chave de assinatura do `dataToken`, o token de configuração das
  tabelas guardado no navegador; por ser `NEXT_PUBLIC_` é pública por definição e não protege nada. Não alterar
  seu uso nem seu valor nesta spec; trocar esse mecanismo fica para spec futura (mexe no PWA e no uso sem rede).
  Um teste automatizado (Vitest) varre TODOS os arquivos-fonte rastreados (`.ts`, `.tsx`, `.js`, `.mjs`), exceto
  `node_modules`, `.next`, o próprio teste e arquivos gerados: inclui `src/`, o `config.ts` da raiz e o
  `next.config.js`. Ele coleta todo token que case com `NEXT_PUBLIC_[A-Z0-9_]+` em qualquer lugar dos
  arquivos varridos (uso direto, `process.env['NOME']`, desestruturação, bloco `env`, texto ou comentário), e
  falha se algum nome contiver `KEY`,
  `SECRET`, `PRIVATE` ou `TOKEN` fora da lista de exceções. O teste também se protege de "passar vazio": ele
  confere que o coletor encontrou pelo menos `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_OAUTH_ID` (variáveis conhecidas
  do `config.ts`); se o coletor não achar nada, o teste falha. A exceção fica no próprio teste, com um comentário explicando o motivo, e nova exceção exige alterar o
  teste de propósito.
- **FR-006**: O teste de FR-005, executado por `yarn test`, DEVE falhar SE:
  (a) encontrar uma violação de FR-005, informando nome e arquivo;
  (b) encontrar um nome proibido de FR-001, informando nome e arquivo (D3), nos arquivos-fonte varridos E em
      `package.json` (lido como texto). O `yarn.lock` fica fora do teste: sua ausência de ocorrências é verificada
      na conferência manual de SC-001;
  (c) uma exceção listada não for encontrada em nenhum arquivo varrido (exceção obsoleta).
- **FR-007**: O comportamento observável do app NÃO DEVE mudar: login, sessão, leitura e gravação de tabelas e
  cálculo de dose funcionam como antes; as 106 verificações existentes continuam passando.
- **FR-008**: `src/utils/validateUnits.ts` e os testes da Spec 01 NÃO DEVEM ser alterados.
- **FR-009**: O `vi.mock` do módulo de credencial em `resolvers.test.ts` DEVE ser removido; os testes dos
  resolvers DEVEM continuar passando sem ele.
- **FR-010**: `yarn type-check` DEVE passar.
- **FR-011**: A quickstart DEVE conter: (a) o passo de reversão (promover o deployment de produção anterior na
  Vercel); (b) a verificação em aparelho real com o PWA instalado (login, tabelas, cálculo); (c) o checklist da
  seção "Ação manual do dono", com os quatro passos na ordem obrigatória.
- **FR-012**: O passo 2 da "Ação manual do dono" (revogar a chave) NÃO DEVE começar antes de o passo 1 (deploy
  de produção verificado, FR-011b) estar concluído.

### Key Entities

- **Variável pública**: variável de ambiente com prefixo `NEXT_PUBLIC_` ou listada no `env` de `next.config.js`;
  seu valor vai para o navegador.
- **Lista de exceções**: nomes públicos permitidos apesar de conterem uma palavra de segredo, cada um com
  justificativa; hoje só `NEXT_PUBLIC_APP_KEY`.
- **Credencial da conta de serviço**: e-mail e chave privada de uma conta de serviço do Google usada pelo banco
  antigo em planilhas; deixa de ser usada pelo código e é revogada pelo dono.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma busca pelos nomes de FR-001 em todos os arquivos versionados fora de `specs/` retorna 0
  ocorrências.
- **SC-002**: A suíte passa com as 106 verificações anteriores mais as do teste novo, e nenhuma das anteriores
  foi alterada exceto a remoção do `vi.mock` (FR-009).
- **SC-003**: Introduzir uma variável pública com nome de segredo em qualquer arquivo varrido faz a suíte falhar
  em 100% dos casos, com mensagem que cita o nome e o arquivo.
- **SC-004**: Em produção, após o deploy, a pessoa que usa o app faz login, vê as mesmas tabelas e obtém o mesmo
  cálculo no PWA instalado, sem nenhuma etapa nova.
- **SC-005**: Ao fim do checklist manual, a chave da conta de serviço está revogada e 0 variáveis antigas existem
  na Vercel e no `.env.local`.

## Assumptions

- A pessoa que usa o app não depende das planilhas antigas para nada; os dados já foram migrados ao DynamoDB.
- `.env.local` não é versionado; ele é limpo pelo dono no checklist manual, não pelo código.
- O deploy é o fluxo já usado nas Specs 01 e 02 (preview no branch, produção no merge em `main`), com reversão por
  promoção do deployment anterior na Vercel.
- Logs e respostas de erro não mudam com esta spec; não há nova superfície de autenticação.

## Ação manual do dono

Fora do código; vira checklist no quickstart. **Ordem obrigatória:**

1. Deploy do código na produção e conferência de que o app funciona.
2. Só depois, revogar a chave da conta de serviço no Google Cloud (IAM → Contas de serviço → Chaves) ou excluir
   a conta.
3. Remover as variáveis `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_*`, `NEXT_PUBLIC_USERS_SHEET_ID` e
   `NEXT_PUBLIC_TABLES_SHEET_ID` na Vercel e do `.env.local`.
4. Revogar o compartilhamento das planilhas antigas.

A reversão fica possível até o passo 2: a versão anterior só lê a chave na importação e não usa o Google Sheets.

## Fora de escopo

- Mover `utils/` para fora de `src/pages/` (R10 item 6).
- CORS e rate limiting.
- Transformar o `dataToken` em proteção real ou trocar o valor de `NEXT_PUBLIC_APP_KEY`.
