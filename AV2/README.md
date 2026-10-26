# Greencode API

API monolítica para logística reversa de equipamentos, feita com Node.js, TypeScript, Fastify, Prisma e MySQL.

## Requisitos

- Node.js 20 ou superior
- MySQL 8 ou superior
- Windows 10+, Ubuntu 24.04.03+ ou distribuição derivada do Ubuntu

## Preparação

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` com o usuário e a senha do seu MySQL, além de `JWT_SEGREDO`.
3. Crie o banco MySQL chamado `greencode`.
4. Gere o cliente, aplique a migração e crie os dados de demonstração com um comando:

```sh
npm run preparar
```

5. Inicie em modo de desenvolvimento com `npm run dev`.

A API usa a porta `3000` por padrão. Configure outra com `PORTA`. Para compilar e iniciar a versão compilada, use `npm run build` e `npm start`.

O seed cria `admin@greencode.local` com a senha `greencode123`. Essa credencial é apenas para desenvolvimento; altere-a antes de qualquer uso fora da máquina local.

## Rotas

| Método | Caminho | Acesso |
| --- | --- | --- |
| GET | `/saude` | Público |
| POST | `/login` | Público |
| POST | `/organizacoes` | ADMIN |
| POST | `/contratos` | ADMIN |
| POST | `/lotes` | ADMIN |
| PATCH | `/equipamentos/:id/estado` | JWT |

Envie o token retornado pelo login no cabeçalho `Authorization: Bearer <token>`. Apenas administradores criam organizações, contratos e lotes; usuários autenticados podem alterar estados. Payloads são validados por JSON Schema. CNPJ deve ter 14 dígitos.

Para alterar o estado, envie o estado novo e a versão lida anteriormente:

```json
{
  "estado": "EM_TRIAGEM",
  "versao": 1,
  "observacao": "Recebido para avaliação"
}
```

O lote e seus equipamentos são criados na mesma transação. A alteração do estado e a movimentação correspondente também são atômicas. A versão impede que uma requisição sobrescreva uma alteração concorrente.

## Testes e decisões

Execute `npm test` e `npm run build`. Os testes usam Fastify inject e um repositório falso, então não precisam de MySQL; migrações e seed precisam de um banco disponível.

O PDF não inclui o código da atividade CLI anterior nem o modelo completo de domínio. Por isso, esta versão estabelece campos essenciais para as cinco entidades solicitadas, adiciona `Usuario` para autenticação e adota os estados `RECEBIDO`, `EM_TRIAGEM`, `EM_REPARO`, `RECICLADO` e `DESCARTADO`. As transições permitidas ficam em `src/servicos/regra-equipamento.ts`.

O CNPJ e o código de barras têm restrição de unicidade no banco. O JWT contém identificador e papel; criação de organizações, contratos e lotes exige papel `ADMIN`, enquanto a mudança de estado exige autenticação. Restrições mais específicas do domínio devem ser ajustadas quando o modelo da atividade anterior estiver disponível.