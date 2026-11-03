# Quickstart: validar e implantar a Spec 02

Contratos: [session-api.md](./contracts/session-api.md) · [graphql-schema.md](./contracts/graphql-schema.md) ·
modelo: [data-model.md](./data-model.md).

## 1. Validação local (sem rede, sem AWS)

```bash
yarn test          # 36 testes da Spec 01 + G1–G5, A1–A11, R1–R7, C1–C4
yarn type-check
git diff --stat spec-02-autenticacao-no-servidor -- src/utils/validateUnits.ts src/utils/__tests__/   # tem de sair vazio
git ls-files src/pages | grep -iE "auth|session|__tests__"   # só src/pages/api/session.ts (novo) e src/pages/api/utils/service/auth.ts (já existia, legado da conta de serviço)```
```

Esperado: tudo verde, e as duas últimas verificações saem como indicado. Os testes não leem `.env.local`: a
configuração é passada explicitamente.

## 2. Configurar segredos (antes de qualquer deploy)

1. Gere **dois** segredos diferentes:
   ```bash
   openssl rand -base64 48   # Preview
   openssl rand -base64 48   # Production
   ```
2. Na Vercel → Settings → Environment Variables, crie `SESSION_SECRET` como **Sensitive**, sem prefixo
   `NEXT_PUBLIC_`:
   - ambiente **Preview** = segredo 1;
   - ambiente **Production** = segredo 2.
3. Confirme que `NEXT_PUBLIC_OAUTH_ID` existe em **Preview e Production** com o ID de cliente OAuth do app. O
   servidor passa a usá-lo como `audience`.
4. No `.env.local` (já ignorado pelo `.gitignore` via `.env.*`), adicione um terceiro segredo para desenvolvimento.
5. Nunca coloque `SESSION_SECRET` no `next.config.js` (bloco `env`), em logs, em issues ou no repositório.

Criar a variável antes do deploy de produção é seguro: o código atual a ignora.

## 3. Validação local com o app rodando (opcional)

```bash
yarn dev   # http://localhost:9090
curl -i -X POST http://localhost:9090/api/graphql -H 'content-type: application/json' \
  -d '{"query":"{ getUserDocuments { documentsCount } }"}'
# esperado: HTTP 400, extensions.code = UNAUTHENTICATED
curl -i http://localhost:9090/api/session
# esperado: HTTP 405, Allow: POST
```

## 4. Preview da Vercel (sem gravar nada) (DoD 5)

1. Faça push do branch e abra o deploy de preview.
2. Antes de testar o login: no Google Cloud Console → Credenciais → seu cliente OAuth → Origens JavaScript
   autorizadas, confirme que a URL do preview está cadastrada. URLs de preview mudam a cada deploy; use a URL
   fixa do branch (`insulina-ui-git-<branch>-<conta>.vercel.app`). Sem isso o login falha com `origin_mismatch`.
   Alternativa: testar o login com `yarn dev` (confirme `http://localhost:9090` nas origens) e usar o preview só
   para as duas chamadas `curl`.
3. Rode as duas chamadas da seção 3 contra a URL do preview: 400 `UNAUTHENTICATED` e 405.
4. Abra o preview no navegador, entre com o Google e confira:
   - as tabelas existentes aparecem; nome e foto aparecem no topo;
   - em DevTools → Application → Local Storage existe `inui.session` e **não** existe `inui.token`;
   - em DevTools → Network, as chamadas a `/api/graphql` levam `Authorization: Bearer …`.
5. Teste da mensagem de expiração: em DevTools, troque o valor de `inui.session` por um texto qualquer e recarregue
   uma tela que chame a API. Esperado: tela de login com "Sua sessão expirou. Entre novamente.".
6. Teste do logout: saia pelo botão do app e confirme que a mensagem "Sua sessão expirou" **não** aparece e que
   `inui.session` foi removido.
7. **Não** crie, edite nem apague tabelas no preview: ele usa as mesmas tabelas da produção.

## 5. Produção (DoD 6 e 7)

1. Combine a janela com a pessoa que usa o app: **fora do horário das refeições**. Avise que, depois da atualização,
   o app vai pedir login **uma vez**, e que a tela de login com a mensagem de sessão expirada é esperada uma vez
   por dia.
2. Anote o deployment de produção atual (Vercel → Deployments): é o alvo da reversão.
3. Faça merge em `main` e aguarde o deploy de produção.
4. Repita as chamadas da seção 3 contra a produção.
5. No celular com o PWA instalado: feche o app por completo e abra de novo (o service worker novo assume com
   `skipWaiting`). Se a tela antiga continuar, feche e abra mais uma vez. Faça login e confira que as tabelas
   aparecem.
6. Ao longo do dia, confira que almoço e jantar não pedem novo login (SC-004).

## 6. Reversão

**Gatilho**: login falha, as tabelas não aparecem ou aparece erro repetido no app depois do deploy.

1. Vercel → Deployments → deployment anotado no passo 5.2 → **Promote to Production** (Instant Rollback).
2. No celular, feche e reabra o PWA para pegar a versão anterior. A pessoa faz login de novo, porque a versão antiga
   usa `inui.token` e a nova o removeu. A chave `inui.session` que fica para trás não faz mal.
3. `SESSION_SECRET` pode continuar configurada: a versão antiga a ignora.
4. Nenhum dado foi migrado, então a reversão não exige nenhuma ação no DynamoDB.

**Emergência (sessão vazada)**: troque `SESSION_SECRET` no ambiente afetado e faça redeploy. Todas as sessões
caem e cada pessoa faz login de novo.
