import assert from 'node:assert/strict';
import { test } from 'node:test';
import { podeMudarEstado } from '../src/servicos/regra-equipamento';

test('permite avançar de recebido para triagem', () => {
  assert.equal(podeMudarEstado('RECEBIDO', 'EM_TRIAGEM'), true);
});

test('não permite voltar de um estado terminal', () => {
  assert.equal(podeMudarEstado('RECICLADO', 'RECEBIDO'), false);
  assert.equal(podeMudarEstado('DESCARTADO', 'EM_REPARO'), false);
});