import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EstadoEquipamento, PrismaClient } from '@prisma/client';
import { mudarEstadoEquipamento } from '../src/repositorios/greencode';

test('rejeita alteração com versão antiga antes de gravar movimentação', async () => {
  let gravouMovimentacao = false;
  const transacao = {
    equipamento: {
      findUnique: async () => ({ versao: 2, estado: EstadoEquipamento.RECEBIDO })
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
      estado: EstadoEquipamento.EM_TRIAGEM,
      versao: 1
    }),
    (erro: unknown) => erro instanceof Error && 'statusCode' in erro && erro.statusCode === 409
  );
  assert.equal(gravouMovimentacao, false);
});