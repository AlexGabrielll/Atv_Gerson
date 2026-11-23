# Greencode - backend da AV3

## O que o PDF pede para programar

1. Camada analitica com eficiencia operacional, rentabilidade por tipo/estado do equipamento e previsao de vida util por regressao ou suavizacao exponencial.
2. API externa versionada, com chaves unicas, permissoes, limites de requisicao e documentacao interativa OpenAPI.
3. Relatorios demorados executados assincronamente, com identificador, consulta de status e resultado persistido.
4. Persistencia historica dos resultados, politica de retry e justificativa arquitetural.

Esta entrega inclui o backend e um painel web simples em TypeScript. A interface cobre a administracao de chaves, lotes, rastreabilidade, analises e relatorios.

## Tecnologias e decisoes

- Node.js, TypeScript, Fastify e Prisma; SQLite simplifica a execucao local em Windows/Linux e pode ser trocado por outro banco suportado pelo Prisma.
- A vida util e estimada com regressao linear de minimos quadrados sobre o historico de condicao.
- Chaves sao geradas uma vez, exibidas somente na criacao e armazenadas como SHA-256. Scopes separam leitura de rastreabilidade, escrita de lotes, analise e relatorios.
- Rate limit: 100 requisicoes por minuto por chave (ou IP quando nao autenticado).
- BullMQ + Redis executa relatorios fora da requisicao HTTP; cada job tenta ate 3 vezes com backoff exponencial. O resultado e guardado para consulta historica.

## Executar no Windows

Requer Node.js 20 ou superior. Redis só é necessário para processar relatórios. No PowerShell, na pasta do projeto:

```powershell
npm install
Copy-Item .env.example .env
```

Edite `.env` e defina um `ADMIN_TOKEN` seguro. Inicie o Redis localmente; se usar Docker:

```powershell
docker run --name greencode-redis -p 6379:6379 -d redis:7-alpine
```

Prepare o banco:

```powershell
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

Inicie API e interface juntas:

```powershell
npm run dev
```

Abra `http://localhost:5173`. A documentação interativa fica em `http://localhost:3000/docs`. `Ctrl+C` encerra os dois processos.

Com Redis ativo, use `npm run dev:all` para incluir também o worker de relatórios.

Para iniciar a versão compilada, compile e execute:

```powershell
npm run build
npm run start
```

Abra `http://localhost:3000`; para processar relatórios, inicie o worker em outro terminal com `npm run start:worker` (ou `npm run start:all` para iniciar API e worker juntos). O worker depende do Redis.

### Criar a primeira chave

No painel, informe o `ADMIN_TOKEN` definido no `.env`, mantenha o ID `greencode-demo`, selecione as permissoes e clique em **Gerar chave**. A chave aparece uma vez; guarde-a e use o botao para revoga-la quando necessario. Alternativamente, crie-a pela API `POST /api/v1/internal/api-keys`, enviando `x-admin-token` e:

```json
{
  "organizationId": "greencode-demo",
  "label": "Parceiro de demonstracao",
  "scopes": ["tracking:read", "lots:write", "analytics:read", "reports:write", "reports:read"]
}
```

A resposta inclui o identificador da chave (para revogacao) e o segredo, exibido uma unica vez.

Para cadastrar um lote, use `POST /api/v1/public/lots` com `x-api-key`:

```json
{
  "code": "LOTE-2026-001",
  "operatorName": "Operador A",
  "equipment": {
    "category": "Notebook",
    "brand": "Marca",
    "model": "Modelo X",
    "physicalCondition": "GOOD",
    "estimatedRecoveryValue": 250,
    "ageMonths": 24
  }
}
```

Atualize a triagem por `PATCH /api/v1/public/lots/LOTE-2026-001/status`; para contabilizar o tempo medio, envie `{"status":"COMPLETED","operatorName":"Operador A"}`. Registre novas observacoes para previsoes futuras em `POST /api/v1/public/lots/{code}/equipment/{equipmentId}/condition`, com `ageMonths` e `physicalCondition`.

## Verificacao

- `npm test` executa os testes da regressao.
- `npm run build` valida a compilacao TypeScript.
