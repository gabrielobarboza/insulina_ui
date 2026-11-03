# Feature Specification: Autenticação e autorização no servidor

**Feature Branch**: `002-autenticacao-servidor`

**Created**: 2026-10-29 · **Updated**: 2026-10-30 (v2: sessão própria de 24h)

**Status**: Approved (2026-11-03)

**Input**: User description: "Spec 02 — Autenticação e autorização no servidor (v2: com sessão própria). Projeto: insulina_ui · Escopo: API GraphQL (src/pages/api/graphql.ts e resolvers), uma nova rota de criação de sessão, cliente Apollo e tratamento de sessão no front-end. Objetivo: hoje o servidor confia no que o navegador diz sobre quem é o usuário; esta spec faz o servidor verificar quem está chamando e limitar cada pessoa aos seus próprios dados, sem piorar o uso diário: quem faz login deve continuar logado por cerca de 24 horas, como hoje. Mudança em relação à v1: sessão própria de 24h (D1 resolvida), medida com dados reais de uso."

**Pré-requisitos**:

- Spec 01 (`001-congelar-calculo-dose`) concluída: 36 testes de caracterização do cálculo de dose passando.
- Constituição v1.1.0 em vigor (Princípios VI e VII e o gate de login/acesso a dados/deploy). ✅ Já ratificada.

**Mudança em relação à v1**: a v1 usava o token do Google direto em cada requisição (sessão de ~1h). Medição em
uso real mostrou que isso forçaria um login a cada refeição. A v2 troca o token do Google, uma única vez, por uma
sessão própria do app válida por 24 horas.

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
6. **Medido:** o token do Google dura **60 minutos**. A pessoa que usa o app faz login diariamente e consulta as
   tabelas a cada refeição, com horas de intervalo. Aceitar o token do Google direto na API reduziria a sessão de
   1 dia para 1 hora e provocaria um login a cada refeição.
7. O app é um PWA: uma versão antiga pode permanecer em cache no celular após um deploy.
8. As bibliotecas já instaladas bastam para verificar o token do Google e para assinar/verificar a sessão.

## Decisões *(resolvidas para esta spec)*

- **D1 — Sessão própria (resolvida).** O servidor verifica o token do Google **uma única vez**, no login, e devolve
  uma sessão assinada pelo próprio app, válida por **24 horas** (duração configurável como constante). A API só
  aceita a sessão do app; o token do Google serve apenas para criar a sessão.
- **D2 — Acesso público.** Qualquer conta Google pode entrar, vendo apenas os próprios dados. Sem lista de e-mails permitidos.
- **D3 — Contrato da API.** Os argumentos de identidade (`id` em `getUser`/`getUserDocuments`, `user` em
  `saveUserDocument`/`deleteUserDocument`, `id`/`email` em `setUser`) **deixam de existir**. O `id` do **documento**
  (em `deleteUserDocument` e na entrada de documento) permanece.
- **D4 — Onde fica a troca de token (para o plano).** Recomendação do pedido: uma rota própria de criação de sessão,
  fina, que é a **única entrada sem autenticação**; a lógica real fica fora de `src/pages/`. A escolha final
  (rota própria ou operação pública na API) é do `/speckit-plan`; os requisitos abaixo valem para qualquer uma.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ninguém lê ou altera as tabelas de outra pessoa (Priority: P1)

Como pessoa que usa o `insulina_ui` para calcular a dose de insulina, eu preciso que somente eu consiga ver,
criar, alterar e apagar as minhas tabelas de cálculo, para que ninguém que conheça o endereço da API e o meu
identificador possa mudar a dose que o app me mostra.

**Why this priority**: É a vulnerabilidade de maior risco: uma tabela alterada por terceiros muda a dose exibida
(Princípio VI da constituição — NON-NEGOTIABLE). Sem isso, nenhuma outra melhoria de segurança importa.

**Independent Test**: Com banco de dados simulado e sessões assinadas no próprio teste, chamar cada operação da API
como usuário A, como usuário B e sem sessão, e confirmar que cada um só alcança os próprios dados e que chamadas sem
sessão válida são recusadas com erro explícito (casos A1–A11 e R1–R7).

**Acceptance Scenarios**:

1. **Given** uma requisição sem sessão (ou com cabeçalho malformado, de outro esquema, com sessão inválida,
   expirada, assinada com outro segredo ou com algoritmo diferente do esperado), **When** ela chega à API,
   **Then** o servidor responde com erro de código `UNAUTHENTICATED` e não executa nenhuma operação de dados.
2. **Given** um token do Google válido (e não a sessão do app), **When** ele é enviado à API de dados, **Then** é
   recusado com `UNAUTHENTICATED`.
3. **Given** o usuário A autenticado e tabelas de A e de B no banco, **When** A lista suas tabelas, **Then** a
   consulta é feita pelo identificador de A e nenhuma tabela de B é devolvida.
4. **Given** o usuário A autenticado, **When** A salva uma tabela cujo conteúdo menciona B como dono, **Then** a
   tabela é gravada com o identificador de A.
5. **Given** o usuário A autenticado e uma tabela que pertence a B, **When** A tenta apagá-la, **Then** nada é
   apagado e a resposta é que a tabela não foi encontrada.
6. **Given** o usuário A autenticado, **When** A é registrado ou consultado, **Then** o servidor usa o
   identificador e o e-mail da sessão, nunca valores enviados pelo cliente.
7. **Given** a configuração do servidor sem o segredo de sessão, ou com segredo de menos de 32 bytes, **When**
   qualquer requisição chega, **Then** todas são recusadas (falha fechada) e um erro de configuração é registrado
   sem expor detalhes ao cliente.

---

### User Story 2 - Login uma vez por dia, como hoje (Priority: P1)

Como pessoa que faz login de manhã e consulta as tabelas a cada refeição, eu quero entrar com minha conta Google
uma vez e continuar logada pelo dia todo, para não precisar fazer login de novo na hora de calcular a dose.

**Why this priority**: Sem a sessão própria, a proteção da US1 reduziria a sessão a 1 hora e exigiria login a cada
refeição (fato medido, diagnóstico 6) — um atrito justamente no momento em que a pessoa precisa da dose. US1 e US2
precisam ir juntas para produção.

**Independent Test**: Com verificador do Google simulado, enviar à criação de sessão um token válido, um ausente,
um malformado, um expirado e um de outro app, e confirmar que só o válido gera sessão, com expiração em 24 horas
(casos G1–G5); no cliente, confirmar que só a sessão é guardada (C1).

**Acceptance Scenarios**:

1. **Given** um token do Google válido emitido para o app, **When** o cliente o envia à criação de sessão, **Then**
   o servidor verifica assinatura, emissor, expiração e público e devolve uma sessão do app com identificador,
   e-mail, nome, foto e expiração em 24 horas, assinada pelo servidor.
2. **Given** um token do Google ausente, malformado, inválido, expirado ou emitido para outro app, **When** ele é
   enviado à criação de sessão, **Then** o servidor responde `UNAUTHENTICATED` e não emite sessão.
3. **Given** a configuração do servidor sem o ID do cliente OAuth ou sem segredo de sessão válido, **When** qualquer
   pedido de criação de sessão chega, **Then** todos são recusados (falha fechada) e um erro de configuração é
   registrado sem expor detalhes ao cliente.
4. **Given** um login com o Google bem-sucedido, **When** o cliente recebe a sessão do app, **Then** guarda somente
   a sessão (o token do Google não é guardado) e continua exibindo nome e foto do usuário.
5. **Given** uma sessão criada às 8h, **When** a pessoa abre o app no almoço e no jantar do mesmo dia, **Then** as
   tabelas aparecem sem novo login.

---

### User Story 3 - Sessão expirada leva a um novo login claro (Priority: P2)

Como pessoa que usa o app no celular, quando minha sessão expirar eu quero ser levada à tela de login com uma
mensagem clara, em vez de ver uma lista vazia de tabelas ou um erro confuso.

**Why this priority**: Uma lista vazia pode ser interpretada como perda das tabelas. A mensagem clara evita esse
erro, mas só acontece uma vez por dia com a sessão de 24h.

**Independent Test**: No cliente, simular uma resposta `UNAUTHENTICATED` e uma sessão com expiração no passado, e
verificar que a sessão guardada é descartada, que a tela de login aparece com a mensagem definida e que toda
requisição com sessão guardada leva a credencial (casos C2–C4).

**Acceptance Scenarios**:

1. **Given** uma sessão guardada, **When** o cliente faz qualquer requisição à API, **Then** a requisição inclui
   `Authorization: Bearer <sessão>`.
2. **Given** um usuário logado, **When** o servidor responde `UNAUTHENTICATED`, **Then** o cliente descarta a sessão
   guardada e mostra a tela de login com a mensagem "Sua sessão expirou. Entre novamente.".
3. **Given** uma sessão guardada cuja expiração (campo `exp` da própria sessão) já passou, **When** o app precisa
   chamar a API, **Then** a sessão é tratada como expirada antes da chamada.

---

### User Story 4 - Implantação segura, sem deixar a pessoa sem acesso (Priority: P3)

Como mantenedor, eu preciso publicar essa mudança sem que a pessoa que usa o app fique sem conseguir calcular a
dose, com verificação no celular real (PWA instalado) e um caminho de reversão conhecido.

**Why this priority**: É a exigência do gate de qualidade da constituição v1.1.0 para mudanças de login e acesso a
dados. Depende das histórias 1 a 3 estarem prontas.

**Independent Test**: Executar o roteiro da seção "Definição de pronto": preview sem sessão devolve
`UNAUTHENTICATED`, login normal mostra as tabelas existentes, e o PWA instalado atualiza e funciona após o deploy.

**Acceptance Scenarios**:

1. **Given** o deploy de preview com segredo e ID do cliente OAuth configurados, **When** a API é chamada sem
   sessão, **Then** a resposta é `UNAUTHENTICATED`; **and When** a pessoa entra normalmente, **Then** as tabelas já
   existentes aparecem.
2. **Given** segredos de sessão distintos criados nos ambientes de preview e produção, **When** o deploy de
   produção é feito fora do horário das refeições, **Then** o PWA instalado no celular atualiza, o login funciona,
   a sessão dura o dia todo e as tabelas aparecem.
3. **Given** qualquer falha após o deploy de produção, **When** a reversão é acionada, **Then** o deploy anterior é
   promovido e o app volta ao comportamento anterior.

---

### Edge Cases

- Cabeçalho `Authorization` presente mas vazio, com esquema diferente de `Bearer` (ex.: `Basic abc`) ou `Bearer `
  sem token: `UNAUTHENTICATED` (A1–A3).
- Sessão com formato inválido, assinada com outro segredo, expirada ou com algoritmo `none`/diferente do fixo:
  `UNAUTHENTICATED` (A4–A7).
- Sessão válida cuja carga não traz o identificador do usuário (`sub`): `UNAUTHENTICATED` (A8).
- Token do Google enviado à API de dados no lugar da sessão: `UNAUTHENTICATED` (A11).
- Token do Google válido sem e-mail: a identidade continua sendo o `sub`; o e-mail só é usado se vier do token verificado.
- Segredo de sessão ausente ou curto (< 32 bytes), ou ID do cliente OAuth ausente: tudo é recusado (falha fechada),
  nunca aceito (G5, A10).
- Sessão de preview usada em produção (ou vice-versa): recusada, pois os segredos dos ambientes são diferentes.
- Tentativa de apagar tabela de outro usuário: resposta "não encontrada", indistinguível de uma tabela inexistente,
  para não revelar a existência de dados alheios (R4).
- Versão antiga do app em cache no PWA que não envia sessão: recebe `UNAUTHENTICATED`; resolve-se com a atualização
  do PWA (verificação no celular, DoD 6).
- Token antigo do Google guardado pela versão anterior do app: não é uma sessão do app; é descartado e a pessoa faz
  login uma vez.
- Chamada que mistura sessão válida com identificador de outro usuário no corpo ou em outro cabeçalho: o
  identificador do cliente é ignorado; vale apenas o da sessão.

## Requirements *(mandatory)*

### Functional Requirements

**Criação da sessão**

- **FR-001**: Quando o cliente enviar um token do Google à criação de sessão, o servidor MUST verificar assinatura,
  emissor, expiração e público (`aud`) contra o ID do cliente OAuth do app.
- **FR-002**: Quando o token do Google for válido, o servidor MUST devolver uma sessão contendo `sub`, `email`, nome,
  foto e expiração em 24 horas a partir da emissão, assinada com o segredo do servidor.
- **FR-003**: Se o token do Google for ausente, malformado, inválido, expirado ou emitido para outro público, o
  servidor MUST responder `UNAUTHENTICATED` e MUST NOT emitir sessão.
- **FR-004**: Se o ID do cliente OAuth ou o segredo de sessão não estiverem configurados, ou se o segredo tiver menos
  de 32 bytes, o servidor MUST recusar todas as requisições (criação de sessão e API de dados) e MUST registrar um
  erro de configuração sem expor detalhes ao cliente.
- **FR-005**: A criação de sessão MUST ser a única entrada do servidor aceita sem sessão. Rotas de utilitário que o Next expõe por estarem em `src/pages/api/` (`utils/`, `resolvers/`, `schemas/`) não
contêm lógica que leia ou altere dados quando chamadas diretamente; mover esses arquivos para fora de
`src/pages/` está registrado para spec futura.

**Verificação em cada requisição**

- **FR-006**: Quando uma requisição chegar à API de dados, o servidor MUST extrair a sessão do cabeçalho
  `Authorization: Bearer <sessão>` e verificar assinatura, algoritmo (fixo, HS256), expiração e a presença de `sub`.
- **FR-007**: Se o cabeçalho estiver ausente, malformado ou sem o esquema `Bearer`, ou se a sessão for inválida,
  expirada, assinada com outro segredo, com algoritmo `none` ou diferente do esperado, ou sem `sub`, o servidor MUST
  responder com erro de código `UNAUTHENTICATED` e MUST NOT executar nenhuma operação de dados.
- **FR-008**: Um token do Google enviado à API de dados MUST ser recusado com `UNAUTHENTICATED`.
- **FR-009**: A identidade do usuário MUST ser o `sub` da sessão; o e-mail MUST vir somente da sessão.

**Autorização por usuário**

- **FR-010**: Nenhuma operação da API MUST usar identidade informada pelo cliente (argumento, corpo ou cabeçalho
  além da sessão) para decidir de quem são os dados lidos, gravados ou apagados.
- **FR-011**: O contrato da API MUST NOT conter argumentos de identidade nas operações de consulta e de alteração
  (D3); o identificador do documento permanece.
- **FR-012**: Ao listar tabelas, o servidor MUST devolver somente as tabelas do usuário autenticado.
- **FR-013**: Ao salvar uma tabela, o servidor MUST gravá-la com o identificador do usuário autenticado,
  independentemente do conteúdo enviado.
- **FR-014**: Se um usuário tentar apagar uma tabela que não é dele, o servidor MUST NOT apagar nada e MUST responder que a tabela não foi encontrada. O servidor MUST aguardar o resultado da operação de apagar e só responder sucesso se a tabela do usuário tiver de fato sido apagada.
- **FR-015**: Ao registrar ou consultar o usuário, o servidor MUST usar `sub` e `email` da sessão e devolver somente
  o registro do próprio usuário.

**Falhas explícitas**

- **FR-016**: Se a autenticação falhar, a resposta MUST ser um erro explícito; MUST NOT ser uma lista vazia, objeto
  padrão ou valor booleano que possa ser confundido com "sem dados" ou "operação concluída".

**Cliente**

- **FR-017**: Quando o login com o Google tiver sucesso, o cliente MUST trocar o token do Google pela sessão do app
  e guardar somente a sessão; o token do Google MUST NOT ser guardado.
- **FR-017b**: Se a troca do token do Google pela sessão falhar, o cliente MUST permanecer na tela de login, mostrar a mensagem de falha de login já existente e MUST NOT guardar nada.
- **FR-018**: Quando houver sessão guardada, o cliente MUST incluir `Authorization: Bearer <sessão>` em toda
  requisição à API.
- **FR-019**: Quando o servidor responder `UNAUTHENTICATED`, o cliente MUST descartar a sessão guardada e mostrar a
  tela de login com a mensagem "Sua sessão expirou. Entre novamente.".
- **FR-020**: O cliente MUST considerar a sessão expirada com base no campo `exp` da própria sessão, não em prazo
  calculado localmente; uma sessão já expirada MUST ser tratada como expirada antes de chamar a API.
- **FR-021**: A interface MUST continuar exibindo nome e foto do usuário, como hoje.
- **FR-022**: A sessão MUST durar 24 horas a partir do login, equivalente ao comportamento atual.

**Privacidade e operação**

- **FR-023**: O sistema MUST NOT registrar em log tokens, sessões, e-mails ou identificadores de usuário.
- **FR-024**: Os dados existentes MUST continuar acessíveis aos seus donos: o identificador de usuário permanece o
  `sub` do Google.

### Restrições *(impostas pelo pedido e pela constituição)*

- Nenhuma dependência nova: as bibliotecas já instaladas verificam o token do Google e assinam/verificam a sessão.
- O segredo de assinatura da sessão é uma variável **só de servidor** (sem `NEXT_PUBLIC_`), com no mínimo 32 bytes
  aleatórios, nunca no repositório (Princípio VII). O algoritmo é fixo (HS256).
- O código novo de autenticação e seus testes ficam **fora de `src/pages/`** (tudo em `src/pages/api/` vira rota);
  só a entrada fina de criação de sessão fica lá.
- A verificação do token do Google recebe o verificador por injeção, para ser testada sem rede.
- Nenhum teste acessa a AWS ou o Google: banco de dados e verificador são simulados.
- Sem `any` em código novo (Princípio IV); `yarn test` e `yarn type-check` verdes (Princípio III).
- O ID do cliente OAuth é público e pode ser exposto; o segredo de sessão nunca.

### Fora de escopo

- Alterar `src/utils/validateUnits.ts` ou os testes da Spec 01.
- Revogação de sessão no servidor, refresh token, lista de e-mails permitidos, limite de requisições, novo provedor de login.
- Trocar `Scan` por `Query`, remover o código do Google Sheets, restringir CORS.
- Aviso de privacidade ou de orientação médica.
- Regras de cálculo, validações de tabela ou layout.

### Key Entities

- **Usuário autenticado**: identidade derivada da sessão verificada — identificador (`sub` do Google) e e-mail.
  Nunca vem de argumento do cliente.
- **Token do Google (ID token)**: emitido pelo Google para o app; tem assinatura, emissor, público (`aud`) e
  expiração (~60 min). Usado **somente** para criar a sessão; não é guardado nem aceito pela API de dados.
- **Sessão do app**: emitida pelo servidor após verificar o token do Google; contém `sub`, `email`, nome, foto e
  `exp` (24h); assinada com o segredo do servidor em algoritmo fixo. Guardada pelo cliente e enviada a cada requisição.
- **Tabela de cálculo (documento)**: pertence a exatamente um usuário (`user_id`); tem identificador próprio, que
  continua sendo informado pelo cliente para apagar/atualizar.
- **Registro de usuário**: identificador e e-mail do usuário, gravados a partir da sessão.

## Casos de teste *(verificador do Google e banco simulados; A/B = dois usuários diferentes)*

### Criação da sessão

| id | entrada                               | esperado                                        |
|----|---------------------------------------|-------------------------------------------------|
| G1 | token do Google válido                | sessão com `sub`, `email`, `exp` = agora + 24h  |
| G2 | token ausente, malformado ou inválido | `UNAUTHENTICATED`, sem sessão                   |
| G3 | token expirado                        | `UNAUTHENTICATED`                               |
| G4 | `aud` de outro app                    | `UNAUTHENTICATED`                               |
| G5 | ID do cliente OAuth ausente           | rejeita tudo (falha fechada)                    |

### Verificação da sessão

| id  | entrada                                      | esperado                      |
|-----|----------------------------------------------|-------------------------------|
| A1  | sem cabeçalho                                | `UNAUTHENTICATED`             |
| A2  | `Basic abc`                                  | `UNAUTHENTICATED`             |
| A3  | `Bearer ` vazio                              | `UNAUTHENTICATED`             |
| A4  | sessão malformada                            | `UNAUTHENTICATED`             |
| A5  | sessão assinada com outro segredo            | `UNAUTHENTICATED`             |
| A6  | sessão expirada                              | `UNAUTHENTICATED`             |
| A7  | sessão com `alg: none` ou outro algoritmo    | `UNAUTHENTICATED`             |
| A8  | sessão sem `sub`                             | `UNAUTHENTICATED`             |
| A9  | sessão válida                                | `{ id: sub, email }`          |
| A10 | segredo ausente ou com menos de 32 bytes     | rejeita tudo (falha fechada)  |
| A11 | token do Google enviado à API de dados       | `UNAUTHENTICATED`             |

### Operações da API

| id | situação                         | esperado                                               |
|----|----------------------------------|--------------------------------------------------------|
| R1 | listar tabelas sem autenticar    | `UNAUTHENTICATED`, não lista vazia                     |
| R2 | listar como A                    | consulta usa `user_id = A`; nenhuma tabela de B        |
| R3 | salvar como A (corpo menciona B) | gravado com `user_id = A`                              |
| R4 | apagar tabela de B como A        | nada apagado; "não encontrada"                         |
| R5 | `setUser` como A                 | grava `sub` e `email` da sessão                        |
| R6 | `getUser` como A                 | devolve só o próprio registro                          |
| R7 | contrato da API                  | nenhum argumento de identidade em consultas/alterações |

### Cliente

| id | situação                         | esperado                                              |
|----|----------------------------------|-------------------------------------------------------|
| C1 | login com sucesso                | troca pela sessão do app; só a sessão é guardada      |
| C2 | requisição com sessão guardada   | cabeçalho `Authorization` presente                    |
| C3 | resposta `UNAUTHENTICATED`       | sessão removida e tela de login com a mensagem        |
| C4 | sessão com `exp` no passado      | tratada como expirada antes de chamar a API           |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das chamadas à API sem sessão válida (casos A1–A8, A10, A11, R1) e dos pedidos de sessão com
  token do Google inválido (G2–G5) são recusados com erro explícito; 0 deles devolve dados, sessão, lista vazia ou
  confirmação de sucesso.
- **SC-002**: Em 100% dos cenários com dois usuários (R2–R6), nenhum usuário lê, grava ou apaga dados do outro.
- **SC-003**: 0 argumentos de identidade no contrato da API (R7).
- **SC-004**: A pessoa que usa o app faz no máximo 1 login por dia: uma sessão criada no login continua aceita por
  24 horas (verificado em teste e no PWA instalado ao longo de um dia de uso).
- **SC-005**: Após o deploy, 100% das tabelas existentes continuam visíveis para seus donos ao entrar normalmente
  (verificado no preview e no PWA instalado).
- **SC-006**: Quando a sessão expira, a pessoa vê a mensagem "Sua sessão expirou. Entre novamente." em vez de uma
  lista vazia, em 100% dos casos (C3, C4).
- **SC-007**: Os 36 testes da Spec 01 continuam passando sem alteração, junto com todos os testes novos, e a
  checagem de tipos passa.

### Definição de pronto *(verificável)*

1. `yarn test` (36 testes da Spec 01 + os novos) e `yarn type-check` verdes.
2. `git diff` não mostra `src/utils/validateUnits.ts` nem alteração nos testes da Spec 01.
3. Nenhum teste ou lógica de autenticação dentro de `src/pages/` (só a entrada fina de criação de sessão).
4. Segredo de sessão gerado aleatoriamente e criado na Vercel (Preview e Production, valores diferentes) e em
   `.env.local` (ignorado pelo git) **antes** do deploy de produção; ID do cliente OAuth também disponível no servidor.
5. Teste manual no **preview** da Vercel, **sem gravar nada**: chamada à API sem sessão devolve `UNAUTHENTICATED`;
   com login normal, as tabelas existentes aparecem.
6. Verificação no **celular com o PWA instalado**: o app atualiza, o login funciona, a sessão dura o dia todo e as
   tabelas aparecem. Plano de reversão anotado (promover o deploy anterior na Vercel).
7. Deploy feito fora do horário das refeições, e a pessoa que usa o app sabe o que fazer se a tela de login aparecer.

## Assumptions

- O ID do cliente OAuth usado no login do app é o mesmo que será configurado no servidor para verificar o público
  (`aud`) do token do Google.
- O `sub` do Google é estável por conta e é o valor já gravado como `user_id` nas tabelas existentes; por isso
  nenhuma migração de dados é necessária.
- Sem revogação no servidor (fora de escopo), uma sessão vazada vale até expirar (no máximo 24h); trocar o segredo
  de sessão invalida todas as sessões de uma vez e é o procedimento de emergência.
- No primeiro acesso após o deploy, a pessoa precisa fazer login uma vez, pois o token do Google guardado pela versão
  anterior não é uma sessão do app.
- Uma pessoa usa o app em produção hoje; a janela de deploy pode ser combinada com ela.
- A operação de apagar passa a aguardar o resultado do banco, o que é necessário para distinguir ‘apagada’ de ‘não encontrada’; fora isso, o delete não muda.

## Registrado para specs futuras

Revogação de sessão e refresh · `Scan` → `Query` na listagem de tabelas · código
do Google Sheets e variáveis `NEXT_PUBLIC_GOOGLE_*` · `NEXT_PUBLIC_APP_KEY` usado como chave de assinatura no
navegador · CORS aberto · limite de requisições · sessão no armazenamento local do navegador · aviso de privacidade e
pedido de exclusão de dados · arquivos auxiliares dentro de `src/pages/api/` (o Next trata como rotas).
