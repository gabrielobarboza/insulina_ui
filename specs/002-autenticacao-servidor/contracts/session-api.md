# Contrato: `POST /api/session`

Única entrada do servidor aceita sem sessão (FR-005). Troca um ID token do Google por uma sessão do app.

## Requisição

```http
POST /api/session
Content-Type: application/json

{ "credential": "<ID token do Google>" }
```

## Respostas

Todas as respostas trazem `Cache-Control: no-store` e corpo JSON.

| situação                                                       | status | corpo                              | casos |
|----------------------------------------------------------------|--------|------------------------------------|-------|
| token do Google válido                                         | 200    | `{ "session": "<JWT HS256>" }`     | G1    |
| `credential` ausente, vazio, não string ou malformado          | 401    | `{ "error": "UNAUTHENTICATED" }`   | G2    |
| assinatura inválida, expirado, `aud`/`iss` errados, sem `sub`  | 401    | `{ "error": "UNAUTHENTICATED" }`   | G2–G4 |
| `SESSION_SECRET` ausente/curto ou `NEXT_PUBLIC_OAUTH_ID` ausente | 500  | `{ "error": "INTERNAL" }`          | G5    |
| método diferente de `POST`                                     | 405    | `{ "error": "METHOD_NOT_ALLOWED" }` + `Allow: POST` | — |

Regras:

- Nenhuma resposta de erro inclui detalhes (motivo da recusa, nome de variável, mensagem da biblioteca).
- Nada é registrado em log nas respostas 401. A resposta 500 registra só a mensagem fixa de configuração.
- O conteúdo da sessão segue `SessionClaims` em [data-model.md](../data-model.md).

## Implementação (referência)

- `src/pages/api/session.ts`: só `export default createSessionRoute(productionDeps)`.
- `src/server/auth/sessionRoute.ts`: método, cabeçalhos, mapeamento de status.
- `src/server/auth/createSession.ts`: verificação do token do Google e emissão da sessão.
