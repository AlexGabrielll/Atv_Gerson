import assert from 'node:assert/strict';
import { test } from 'node:test';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { criarApp } from '../src/app';

test('a API informa que está saudável', async () => {
  const app = criarApp();
  const resposta = await app.inject({ method: 'GET', url: '/saude' });

  assert.equal(resposta.statusCode, 200);
  assert.deepEqual(resposta.json(), { status: 'ok' });
  await app.close();
});

test('login emite token e permite criar uma organização', async () => {
  const usuario = {
    id: 'usuario-1',
    nome: 'Operador',
    email: 'operador@greencode.test',
    senhaHash: bcrypt.hashSync('senha-segura', 4),
    papel: 'ADMIN',
    versao: 1,
    criadoEm: new Date(),
    atualizadoEm: new Date()
  };
  const bancoFalso = {
    usuario: { findUnique: async () => usuario },
    organizacao: { create: async ({ data }: { data: { nome: string; cnpj: string } }) => ({ id: 'org-1', ...data }) }
  } as unknown as PrismaClient;
  const app = criarApp({ banco: bancoFalso, segredoJwt: 'segredo-teste-com-tamanho-suficiente' });
  const login = await app.inject({
    method: 'POST',
    url: '/login',
    payload: { email: usuario.email, senha: 'senha-segura' }
  });
  const token = login.json<{ token: string }>().token;
  const invalida = await app.inject({
    method: 'POST',
    url: '/organizacoes',
    headers: { authorization: `Bearer ${token}` },
    payload: { nome: '', cnpj: 'cnpj-invalido' }
  });
  const criacao = await app.inject({
    method: 'POST',
    url: '/organizacoes',
    headers: { authorization: `Bearer ${token}` },
    payload: { nome: 'Coleta Verde', cnpj: '12345678000199' }
  });

  assert.equal(login.statusCode, 200);
  assert.equal(invalida.statusCode, 400);
  assert.equal(criacao.statusCode, 201);
  assert.equal(criacao.json().nome, 'Coleta Verde');
  await app.close();
});

test('bloqueia rota protegida sem token', async () => {
  const app = criarApp({ banco: {} as PrismaClient, segredoJwt: 'segredo-teste-com-tamanho-suficiente' });
  const resposta = await app.inject({
    method: 'POST',
    url: '/organizacoes',
    payload: { nome: 'Coleta Verde', cnpj: '12345678000199' }
  });

  assert.equal(resposta.statusCode, 401);
  await app.close();
});

test('bloqueia operador ao criar organização', async () => {
  const usuario = {
    id: 'usuario-2',
    nome: 'Operador',
    email: 'operador@greencode.test',
    senhaHash: bcrypt.hashSync('senha-segura', 4),
    papel: 'OPERADOR',
    versao: 1,
    criadoEm: new Date(),
    atualizadoEm: new Date()
  };
  const bancoFalso = {
    usuario: { findUnique: async () => usuario },
    organizacao: { create: async () => assert.fail('não deveria criar organização') }
  } as unknown as PrismaClient;
  const app = criarApp({ banco: bancoFalso, segredoJwt: 'segredo-teste-com-tamanho-suficiente' });
  const login = await app.inject({
    method: 'POST',
    url: '/login',
    payload: { email: usuario.email, senha: 'senha-segura' }
  });
  const resposta = await app.inject({
    method: 'POST',
    url: '/organizacoes',
    headers: { authorization: `Bearer ${login.json<{ token: string }>().token}` },
    payload: { nome: 'Coleta Verde', cnpj: '12345678000199' }
  });

  assert.equal(resposta.statusCode, 403);
  await app.close();
});