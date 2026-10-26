import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { registrarRotas } from './controladores/rotas';

export function criarApp(opcoes: { banco?: PrismaClient; segredoJwt?: string } = {}) {
  const app = Fastify({ logger: false });
  const banco = opcoes.banco ?? new PrismaClient();

  app.get('/saude', async () => ({ status: 'ok' }));
  app.register(jwt, { secret: opcoes.segredoJwt ?? process.env.JWT_SEGREDO ?? 'segredo-local-de-desenvolvimento' });
  app.decorateRequest('usuario', null);
  app.addHook('preHandler', async (pedido, resposta) => {
    if (pedido.url === '/saude' || pedido.url === '/login') return;

    try {
      await pedido.jwtVerify();
      pedido.usuario = pedido.user as { id: string; papel: string };
    } catch {
      return resposta.code(401).send({ erro: 'Token ausente ou inválido' });
    }
  });
  registrarRotas(app, banco);

  app.addHook('onClose', async () => {
    if (!opcoes.banco) await banco.$disconnect();
  });

  return app;
}