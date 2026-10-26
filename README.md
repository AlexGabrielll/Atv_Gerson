# Greencode API

API monolítica para logística reversa de equipamentos, feita com Node.js, TypeScript, Fastify, Prisma e SQLite.

## Requisitos

- Node.js 20 ou superior
- Windows 10+, Ubuntu 24.04.03+ ou distribuição derivada do Ubuntu

O SQLite guarda o banco em `prisma/greencode.db`; não é necessário instalar ou iniciar MySQL/PostgreSQL, criar um banco manualmente ou configurar `.env` para desenvolvimento local.

## Iniciar

Instale e configure o projeto uma vez:

```sh
npm install
npm run configurar
```

`npm run configurar` gera o Prisma Client, cria/atualiza o arquivo SQLite, aplica migrations, popula dados demo e compila. Faça isso com o servidor parado. Depois, `npm start` apenas inicia o servidor; para desenvolvimento com reinício automático, use `npm run dev`. Assim, o Prisma não tenta substituir a DLL a cada inicialização.

A API usa a porta `3000` por padrão. Se precisar mudar, configure `PORTA` no ambiente ou em um `.env` opcional.

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

Execute `npm test` e `npm run build`. Os testes usam Fastify inject e um repositório falso. O arquivo `prisma/greencode.db` é criado localmente e está excluído do Git.

O PDF não inclui o código da atividade CLI anterior nem o modelo completo de domínio. Por isso, esta versão estabelece campos essenciais para as cinco entidades solicitadas, adiciona `Usuario` para autenticação e adota os estados `RECEBIDO`, `EM_TRIAGEM`, `EM_REPARO`, `RECICLADO` e `DESCARTADO`. As transições permitidas ficam em `src/servicos/regra-equipamento.ts`.

O CNPJ e o código de barras têm restrição de unicidade no banco. O JWT contém identificador e papel; criação de organizações, contratos e lotes exige papel `ADMIN`, enquanto a mudança de estado exige autenticação. O SQLite simplifica a execução local; o PDF recomenda PostgreSQL como alvo do sistema, então um ambiente de implantação pode exigir portar o provider e gerar migrations para o banco escolhido. Restrições mais específicas do domínio devem ser ajustadas quando o modelo da atividade anterior estiver disponível.