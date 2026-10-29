
# Feature Specification: Autenticação e autorização no servidor

**Feature Branch**: `002-autenticacao-servidor`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Spec 02 — Autenticação e autorização no servidor. Projeto: insulina_ui · Escopo: API GraphQL (src/pages/api/graphql.ts e resolvers), cliente Apollo e tratamento de sessão no front-end. Pré-requisito: Spec 01 concluída. Constitution: exige a emenda v1.1.0. Objetivo: hoje o servidor confia no que o navegador diz sobre quem é o usuário; esta spec faz o servidor verificar quem está chamando e limitar cada pessoa aos seus próprios dados. As tabelas de cálculo determinam a dose exibida; quem alterar uma tabela altera a dose que a pessoa verá."

**Pré-requisitos**:

- Spec 01 (`001-congelar-calculo-dose`) concluída: 36 testes de caracterização do cálculo de dose passando.
- Constituição v1.1.0 em vigor (Princípios VI e VII e o gate de login/acesso a dados/deploy). ✅ Já ratificada.

## Contexto e diagnóstico *(fatos verificados no código atual)*

1. A API não autentica nenhuma requisição: o servidor GraphQL é criado sem contexto de identidade.
2. O cliente não envia credencial: o cabeçalho de autorização está comentado.
3. As operações recebem a identidade **como argumento vindo do cliente**:
   - listar tabelas filtra pelo `id` informado → lista as tabelas de **qualquer** usuário;
   - salvar tabela grava com o `user` informado → cria/altera tabelas **em nome de qualquer** usuário;
   - apagar tabela, consultar usuário e registrar usuário seguem o mesmo padrão; o registro grava o e-mail que o cliente mandar.
4. Falhas viram dados "vazios": listar devolve lista vazia em erro; apagar responde sucesso mesmo se falhar.
5. No cliente, o token do Google é apenas decodificado (sem validação), guardado no armazenamento local do
   navegador e considerado válido por "hoje + 1 dia" calculado localmente. O identificador do usuário é o `sub` do token.
6. O token do Google tem validade própria (normalmente ~1 hora). Com a verificação no servidor, **a sessão real
   passa de 1 dia para o tempo de vida do token** (ver D1).
7. O app é um PWA: uma versão antiga pode permanecer em cache no celular após um deploy.

## Decisões *(resolvidas para esta spec)*

- **D1 — Duração da sessão: opção A.** O token do Google é usado diretamente a cada requisição. O usuário precisa
  reautenticar quando ele expirar (~1h; o One Tap pode reautenticar sem clique, sem garantia). Uma sessão própria
  de vários dias (opção B) fica para spec futura, se o atrito medido justificar.
- **D2 — Acesso público.** Qualquer conta Google pode entrar, vendo apenas os próprios dados. Sem lista de e-mails permitidos.
- **D3 — Contrato da API.** Os argumentos de identidade (`id` em `getUser`/`getUserDocuments`, `user` em
  `saveUserDocument`/`deleteUserDocument`, `id`/`email` em `setUser`) **deixam de existir**. O `id` do **documento**
  (em `deleteUserDocument` e na entrada de documento) permanece.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ninguém lê ou altera as tabelas de outra pessoa (Priority: P1)

Como pessoa que usa o `insulina_ui` para calcular a dose de insulina, eu preciso que somente eu consiga ver,
criar, alterar e apagar as minhas tabelas de cálculo, para que ninguém que conheça o endereço da API e o meu
identificador possa mudar a dose que o app me mostra.

**Why this priority**: É a vulnerabilidade de maior risco: uma tabela alterada por terceiros muda a dose exibida
(Princípio VI da constituição — NON-NEGOTIABLE). Sem isso, nenhuma outra melhoria de segurança importa.

**Independent Test**: Com verificador de identidade e banco de dados simulados, chamar cada operação da API como
usuário A, como usuário B e sem credencial, e confirmar que cada um só alcança os próprios dados e que chamadas
sem credencial são recusadas com erro explícito (casos A1–A10 e R1–R7).

**Acceptance Scenarios**:

1. **Given** uma requisição sem credencial (ou com credencial malformada, de outro esquema, inválida, expirada ou
   emitida para outro app), **When** ela chega à API, **Then** o servidor responde com erro de código
   `UNAUTHENTICATED` e não executa nenhuma operação de dados.
2. **Given** o usuário A autenticado e tabelas de A e de B no banco, **When** A lista suas tabelas, **Then** a
   consulta é feita pelo identificador de A e nenhuma tabela de B é devolvida.
3. **Given** o usuário A autenticado, **When** A salva uma tabela cujo conteúdo menciona B como dono, **Then** a
   tabela é gravada com o identificador de A.
4. **Given** o usuário A autenticado e uma tabela que pertence a B, **When** A tenta apagá-la, **Then** nada é
   apagado e a resposta é que a tabela não foi encontrada.
5. **Given** o usuário A autenticado, **When** A é registrado ou consultado, **Then** o servidor usa o
   identificador e o e-mail da credencial verificada, nunca valores enviados pelo cliente.
6. **Given** a configuração do servidor sem o ID do cliente OAuth do app, **When** qualquer requisição chega,
   **Then** todas são recusadas (falha fechada) e um erro de configuração é registrado sem expor detalhes ao cliente.

---

### User Story 2 - Sessão expirada leva a um novo login claro, sem perder o cálculo em andamento (Priority: P2)

Como pessoa que usa o app no celular, quando minha sessão expirar eu quero ser levada à tela de login com uma
mensagem clara, em vez de ver uma lista vazia de tabelas ou um erro confuso; e, se eu já estiver com as tabelas
carregadas, quero continuar calculando a dose até a próxima vez que o app precisar falar com o servidor.

**Why this priority**: Com a opção A (D1), a sessão real cai para ~1 hora. Sem um fluxo de reautenticação claro,
a pessoa pode interpretar "sem tabelas" como perda de dados — ou ficar sem conseguir calcular na hora da refeição.

**Independent Test**: No cliente, simular uma resposta `UNAUTHENTICATED` e um token com expiração no passado, e
verificar que o token guardado é descartado, que a tela de login aparece com a mensagem definida e que todas as
requisições com token guardado levam a credencial (casos C1–C3).

**Acceptance Scenarios**:

1. **Given** um token guardado, **When** o cliente faz qualquer requisição à API, **Then** a requisição inclui
   `Authorization: Bearer <token>`.
2. **Given** um usuário logado, **When** o servidor responde `UNAUTHENTICATED`, **Then** o cliente descarta o
   token guardado e mostra a tela de login com a mensagem "Sua sessão expirou. Entre novamente.".
3. **Given** um token guardado cuja expiração (campo `exp` do próprio token) já passou, **When** o app precisa
   chamar a API, **Then** a sessão é tratada como expirada antes da chamada.
4. **Given** tabelas já carregadas em memória e um token que acabou de expirar, **When** a pessoa usa a tela de
   cálculo, **Then** o cálculo continua funcionando; a reautenticação só é exigida na próxima chamada à API.

---

### User Story 3 - Implantação segura, sem deixar a pessoa sem acesso (Priority: P3)

Como mantenedor, eu preciso publicar essa mudança sem que a pessoa que usa o app fique sem conseguir calcular a
dose, com verificação no celular real (PWA instalado) e um caminho de reversão conhecido.

**Why this priority**: É a exigência do gate de qualidade da constituição v1.1.0 para mudanças de login e acesso a
dados. Depende das histórias 1 e 2 estarem prontas.

**Independent Test**: Executar o roteiro da seção "Definição de pronto": preview sem token devolve
`UNAUTHENTICATED`, login normal mostra as tabelas existentes, e o PWA instalado atualiza e funciona após o deploy.

**Acceptance Scenarios**:

1. **Given** o deploy de preview, **When** a API é chamada sem credencial, **Then** a resposta é `UNAUTHENTICATED`;
   **and When** a pessoa entra normalmente, **Then** as tabelas já existentes aparecem.
2. **Given** a configuração do ID do cliente OAuth criada nos ambientes de preview e produção, **When** o deploy de
   produção é feito fora do horário das refeições, **Then** o PWA instalado no celular atualiza, o login funciona e
   as tabelas aparecem.
3. **Given** qualquer falha após o deploy de produção, **When** a reversão é acionada, **Then** o deploy anterior é
   promovido e o app volta ao comportamento anterior.

---

### Edge Cases

- Cabeçalho `Authorization` presente mas vazio, com esquema diferente de `Bearer` (ex.: `Basic abc`) ou `Bearer `
  sem token: `UNAUTHENTICATED` (A2, A3).
- Token com formato inválido, assinatura inválida, emitido para outro app ou expirado: `UNAUTHENTICATED` (A4–A7).
- Token válido cuja carga não traz o identificador do usuário (`sub`): `UNAUTHENTICATED` (A8).
- Token válido sem e-mail: a identidade continua sendo o `sub`; o e-mail só é usado se vier da credencial verificada.
- ID do cliente OAuth ausente na configuração do servidor: tudo é recusado (falha fechada), nunca aceito (A10).
- Tentativa de apagar tabela de outro usuário: resposta "não encontrada", indistinguível de uma tabela inexistente,
  para não revelar a existência de dados alheios (R4).
- Versão antiga do app em cache no PWA que não envia credencial: recebe `UNAUTHENTICATED`; resolve-se com a
  atualização do PWA (verificação no celular, DoD 6).
- Token expira no meio do uso da tela de cálculo: o cálculo segue com os dados em memória; só a próxima chamada à
  API exige novo login.
- Chamada que mistura credencial válida com identificador de outro usuário no corpo ou em outro cabeçalho: o
  identificador do cliente é ignorado; vale apenas o da credencial.

## Requirements *(mandatory)*

### Functional Requirements

**Verificação da identidade**

- **FR-001**: Quando uma requisição chegar à API, o servidor MUST extrair a credencial do cabeçalho
  `Authorization: Bearer <token>` e verificar assinatura, emissor, expiração e público (`aud`) contra o ID do
  cliente OAuth do app.
- **FR-002**: Se o cabeçalho estiver ausente, malformado ou sem o esquema `Bearer`, ou se o token for inválido,
  expirado, emitido para outro público ou sem `sub`, o servidor MUST responder com erro de código
  `UNAUTHENTICATED` e MUST NOT executar nenhuma operação de dados.
- **FR-003**: Se o ID do cliente OAuth não estiver configurado no servidor, o servidor MUST recusar todas as
  requisições (falha fechada) e MUST registrar um erro de configuração sem expor detalhes ao cliente.
- **FR-004**: A identidade do usuário MUST ser o campo `sub` da credencial verificada; o e-mail MUST ser aceito
  somente a partir da credencial verificada.

**Autorização por usuário**

- **FR-005**: Nenhuma operação da API MUST usar identidade informada pelo cliente (argumento, corpo ou cabeçalho
  além da credencial) para decidir de quem são os dados lidos, gravados ou apagados.
- **FR-006**: O contrato da API MUST NOT conter argumentos de identidade nas operações de consulta e de alteração
  (D3); o identificador do documento permanece.
- **FR-007**: Ao listar tabelas, o servidor MUST devolver somente as tabelas do usuário autenticado.
- **FR-008**: Ao salvar uma tabela, o servidor MUST gravá-la com o identificador do usuário autenticado,
  independentemente do conteúdo enviado.
- **FR-009**: Se um usuário tentar apagar uma tabela que não é dele, o servidor MUST NOT apagar nada e MUST
  responder que a tabela não foi encontrada.
- **FR-010**: Ao registrar ou consultar o usuário, o servidor MUST usar `sub` e `email` da credencial verificada e
  devolver somente o registro do próprio usuário.

**Falhas explícitas**

- **FR-011**: Se a autenticação falhar, a resposta MUST ser um erro explícito; MUST NOT ser uma lista vazia, objeto
  padrão ou valor booleano que possa ser confundido com "sem dados" ou "operação concluída".

**Cliente**

- **FR-012**: Quando houver token guardado, o cliente MUST incluir `Authorization: Bearer <token>` em toda
  requisição à API.
- **FR-013**: Quando o servidor responder `UNAUTHENTICATED`, o cliente MUST descartar o token guardado e mostrar a
  tela de login com a mensagem "Sua sessão expirou. Entre novamente.".
- **FR-014**: O cliente MUST considerar a sessão expirada com base no campo `exp` do próprio token, não em prazo
  fixo calculado localmente; um token já expirado MUST ser tratado como sessão expirada antes de chamar a API.
- **FR-015**: Enquanto as tabelas já carregadas estiverem em memória, a tela de cálculo MUST continuar funcionando
  mesmo com o token expirado; a reautenticação só MUST ser exigida na próxima chamada à API.

**Privacidade e operação**

- **FR-016**: O sistema MUST NOT registrar em log tokens, e-mails ou identificadores de usuário.
- **FR-017**: Os dados existentes MUST continuar acessíveis aos seus donos: o identificador de usuário permanece o
  `sub` do Google.

### Restrições *(impostas pelo pedido e pela constituição)*

- Sem dependência nova: a verificação usa a biblioteca de autenticação do Google já instalada.
- O código novo de autenticação e seus testes ficam **fora de `src/pages/`** (tudo em `src/pages/api/` vira rota).
- A lógica de verificação recebe o verificador por injeção, para ser testada sem rede e sem Google.
- Nenhum teste acessa a AWS: o banco de dados é simulado.
- Sem `any` em código novo (Princípio IV); `yarn test` e `yarn type-check` verdes (Princípio III).
- O ID do cliente OAuth é público e pode ser exposto; nenhum segredo vai para variáveis públicas (Princípio VII).

### Fora de escopo

- Alterar `src/utils/validateUnits.ts` ou os testes da Spec 01.
- Sessão própria (opção B), lista de e-mails permitidos, limite de requisições, novo provedor de login.
- Trocar `Scan` por `Query`, corrigir o `await` ausente do delete, remover o código do Google Sheets, restringir CORS.
- Aviso de privacidade ou de orientação médica.
- Regras de cálculo, validações de tabela ou layout.

### Key Entities

- **Usuário autenticado**: identidade derivada da credencial verificada — identificador (`sub` do Google) e,
  opcionalmente, e-mail. Nunca vem de argumento do cliente.
- **Credencial (ID token do Google)**: emitida pelo Google para o app; tem assinatura, emissor, público (`aud`) e
  expiração (`exp`, ~1h). Enviada pelo cliente a cada requisição.
- **Tabela de cálculo (documento)**: pertence a exatamente um usuário (`user_id`); tem identificador próprio, que
  continua sendo informado pelo cliente para apagar/atualizar.
- **Registro de usuário**: identificador e e-mail do usuário, gravados a partir da credencial verificada.

## Casos de teste *(todos com verificador e banco simulados; A/B = dois usuários diferentes)*

### Verificação da identidade

| id  | entrada                                     | esperado                      |
|-----|---------------------------------------------|-------------------------------|
| A1  | sem cabeçalho                               | `UNAUTHENTICATED`             |
| A2  | `Basic abc`                                 | `UNAUTHENTICATED`             |
| A3  | `Bearer ` vazio                             | `UNAUTHENTICATED`             |
| A4  | token malformado                            | `UNAUTHENTICATED`             |
| A5  | assinatura inválida                         | `UNAUTHENTICATED`             |
| A6  | `aud` de outro app                          | `UNAUTHENTICATED`             |
| A7  | token expirado                              | `UNAUTHENTICATED`             |
| A8  | payload sem `sub`                           | `UNAUTHENTICATED`             |
| A9  | token válido                                | `{ id: sub, email }`          |
| A10 | ID do cliente OAuth ausente na configuração | rejeita tudo (falha fechada)  |

### Operações da API

| id | situação                         | esperado                                              |
|----|----------------------------------|-------------------------------------------------------|
| R1 | listar tabelas sem autenticar    | `UNAUTHENTICATED`, não lista vazia                    |
| R2 | listar como A                    | consulta usa `user_id = A`; nenhuma tabela de B       |
| R3 | salvar como A (corpo menciona B) | gravado com `user_id = A`                             |
| R4 | apagar tabela de B como A        | nada apagado; "não encontrada"                        |
| R5 | `setUser` como A                 | grava `sub` e `email` do token                        |
| R6 | `getUser` como A                 | devolve só o próprio registro                         |
| R7 | contrato da API                  | nenhum argumento de identidade em consultas/alterações |

### Cliente

| id | situação                       | esperado                                             |
|----|--------------------------------|------------------------------------------------------|
| C1 | requisição com token guardado  | cabeçalho `Authorization` presente                   |
| C2 | resposta `UNAUTHENTICATED`     | token removido e tela de login com a mensagem        |
| C3 | token com `exp` no passado     | sessão tratada como expirada antes de chamar a API   |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das chamadas à API sem credencial válida (casos A1–A8, A10, R1) são recusadas com erro explícito;
  0 delas devolve dados, lista vazia ou confirmação de sucesso.
- **SC-002**: Em 100% dos cenários com dois usuários (R2–R6), nenhum usuário lê, grava ou apaga dados do outro.
- **SC-003**: 0 argumentos de identidade no contrato da API (R7).
- **SC-004**: Após o deploy, 100% das tabelas existentes continuam visíveis para seus donos ao entrar normalmente
  (verificado no preview e no PWA instalado).
- **SC-005**: Quando a sessão expira, a pessoa vê a mensagem "Sua sessão expirou. Entre novamente." em vez de uma
  lista vazia, e o cálculo com tabelas já carregadas continua disponível até a próxima chamada ao servidor.
- **SC-006**: Os 36 testes da Spec 01 continuam passando sem alteração, junto com todos os testes novos, e a
  checagem de tipos passa.

### Definição de pronto *(verificável)*

1. `yarn test` (36 testes da Spec 01 + os novos) e `yarn type-check` verdes.
2. `git diff` não mostra `src/utils/validateUnits.ts` nem alteração nos testes da Spec 01.
3. Nenhum arquivo novo de teste ou de autenticação dentro de `src/pages/`.
4. Teste manual no **preview** da Vercel (sem gravar nada): chamada à API sem token devolve `UNAUTHENTICATED`;
   com login normal, as tabelas existentes aparecem.
5. Variável com o ID do cliente OAuth criada na Vercel (Preview e Production) **antes** do deploy de produção.
6. Verificação no **celular com o PWA instalado**: após o deploy, o app atualiza, o login funciona e as tabelas
   aparecem. Plano de reversão anotado (promover o deploy anterior na Vercel).
7. Deploy feito fora do horário das refeições, e a pessoa que usa o app sabe o que fazer se a tela de login aparecer.

## Assumptions

- O ID do cliente OAuth usado no login do app é o mesmo que será configurado no servidor para verificar o público
  (`aud`) do token.
- O `sub` do Google é estável por conta e é o valor já gravado como `user_id` nas tabelas existentes; por isso
  nenhuma migração de dados é necessária.
- Reautenticar a cada ~1h é aceitável nesta fase (D1, opção A); o atrito será observado em uso real e, se
  necessário, motivará uma spec de sessão própria.
- O One Tap do Google pode reautenticar sem clique, mas o fluxo não depende disso.
- Uma pessoa usa o app em produção hoje; a janela de deploy pode ser combinada com ela.
- Apagar tabela de outro usuário responde "não encontrada" mesmo que a operação de apagar subjacente continue sem
  aguardar a conclusão (correção do `await` está fora de escopo); a checagem de dono acontece antes de apagar.

## Registrado para specs futuras

`Scan` → `Query` na listagem de tabelas · `await` ausente ao apagar tabela · código do Google Sheets e variáveis
`NEXT_PUBLIC_GOOGLE_*` · `NEXT_PUBLIC_APP_KEY` usado como chave de assinatura no navegador · CORS aberto · limite de
requisições · token no armazenamento local do navegador · aviso de privacidade e pedido de exclusão de dados ·
arquivos auxiliares dentro de `src/pages/api/` (o Next trata como rotas) · sessão própria de vários dias (D1, opção B).
