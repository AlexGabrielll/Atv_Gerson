import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { mudarEstadoEquipamento } from '../src/repositorios/greencode';
import { estadosEquipamento } from '../src/servicos/regra-equipamento';

test('rejeita alteração com versão antiga antes de gravar movimentação', async () => {
  let gravouMovimentacao = false;
  const transacao = {
    equipamento: {
      findUnique: async () => ({ versao: 2, estado: estadosEquipamento[0] })
    },
    movimentacao: {
      create: async () => { gravouMovimentacao = true; }
    }
  };
  const bancoFalso = {
    $transaction: async (acao: (tx: typeof transacao) => Promise<unknown>) => acao(transacao)
  } as unknown as PrismaClient;

  await assert.rejects(
    mudarEstadoEquipamento(bancoFalso, {
      id: 'equipamento-1',
      estado: estadosEquipamento[1],
      versao: 1
    }),
    (erro: unknown) => erro instanceof Error && 'statusCode' in erro && erro.statusCode === 409
  );
  assert.equal(gravouMovimentacao, false);
});