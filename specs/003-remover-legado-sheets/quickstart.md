# Quickstart: validar a Spec 03

Roteiro de verificação. Casos do teste em [contracts/public-env-test.md](./contracts/public-env-test.md);
decisões em [research.md](./research.md).

## 1. Gates locais (DoD 1–3)

```bash
yarn install            # regrava o yarn.lock sem google-spreadsheet
yarn test               # 106 verificações anteriores + os casos E1–E9, tudo verde
yarn type-check         # sem erros
```

Conferências (todas devem retornar vazio):

```bash
git fetch origin
# FR-008: cálculo e testes da Spec 01 intocados
git diff origin/main -- src/utils/validateUnits.ts src/utils/__tests__/
# SC-001: nenhum nome do legado fora de specs/, incluindo package.json e yarn.lock
git grep -n -E "google-spreadsheet|serviceAccountAuth|connectors/|NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_|NEXT_PUBLIC_USERS_SHEET_ID|NEXT_PUBLIC_TABLES_SHEET_ID" -- . ':!specs/' ':!src/__tests__/publicEnv.test.ts'
```

`google-auth-library` continua em `package.json` e `yarn.lock`.
Depois do `yarn install`, confira que o `google-auth-library` **não mudou de versão** e que só saíram entradas do
`google-spreadsheet` e do `@types/google-spreadsheet` (e do que só elas usavam):
`git diff yarn.lock | grep -nE "^[+-].*google-auth-library"` deve voltar vazio (nenhuma linha adicionada ou
removida dessa entrada).
Rode também `yarn build` e, se ele reescrever `public/sw.js` ou `public/workbox-*.js.map`, `git restore public/`.

Única mudança esperada em teste existente: o `vi.mock` de `@/pages/api/utils/service` saiu de
`src/server/__tests__/resolvers.test.ts` (FR-009).

## 2. O teste pega violações (SC-003)

Coberto pelos casos E1–E4 com texto sintético; não é preciso editar arquivos. Para uma prova manual opcional,
adicionar temporariamente `// process.env.NEXT_PUBLIC_TESTE_TOKEN` em `config.ts`, rodar `yarn test` (deve falhar
citando `NEXT_PUBLIC_TESTE_TOKEN em config.ts`) e desfazer com `git checkout -- config.ts`.

## 3. Rotas removidas, em local (FR-003)

```bash
yarn dev   # porta 9090
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9090/api/utils/connectors
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9090/api/utils/connectors/tablesConnect
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9090/api/utils/connectors/usersConnect
```

As três respondem `404`. No navegador, login, abrir tabelas e calcular uma dose funcionam como antes.

## 4. Preview (Vercel, branch `003-remover-legado-sheets`)

1. O deploy de preview termina sem erro de build (dependências removidas).
2. Repetir os três `curl` da §3 contra a URL do preview: `404`.
3. Login com Google, abrir as tabelas, calcular uma dose: mesmo resultado de antes. (Antes, confirme que a URL fixa
   do branch, `insulina-ui-git-003-remover-legado-sheets-<conta>.vercel.app`, está nas Origens JavaScript
   autorizadas; se não estiver, teste o login só em `yarn dev` e use o preview só para os `curl`.)
   
## 5. Produção (FR-011b; passo 1 da "Ação manual do dono")

1. Anotar o deployment de produção atual como alvo de reversão (§7).
2. Merge em `main`; aguardar o deploy de produção.
3. Repetir os três `curl` contra produção: `404`.
4. No celular com o PWA instalado: fechar e reabrir até o service worker novo assumir, fazer login, abrir as
   tabelas e calcular uma dose. Nada muda para quem usa (SC-004).

## 6. Ação manual do dono (fora do código; ORDEM OBRIGATÓRIA)

- [ ] 1. §5 concluída: código em produção e app conferido.
- [ ] 2. Só depois: Google Cloud → IAM → Contas de serviço → Chaves: revogar a chave da conta de serviço usada
      pelas planilhas (ou excluir a conta). **A partir daqui a reversão da §7 deixa de ser garantida.**
- [ ] 3. Vercel (Preview e Production) e `.env.local`: remover `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_*`,
      `NEXT_PUBLIC_USERS_SHEET_ID` e `NEXT_PUBLIC_TABLES_SHEET_ID` (SC-005).
- [ ] 4. Google Sheets: revogar o compartilhamento das planilhas antigas com a conta de serviço.

## 7. Reversão

Até o passo 2 da §6: na Vercel, promover o deployment de produção anotado na §5.1. A versão anterior só lê a
chave na importação e não usa o Google Sheets; dados e sessão não são afetados. Em seguida, reverter o merge em
`main`.
