import '@fastify/jwt';
import 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; papel: string };
    user: { id: string; papel: string };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    usuario: { id: string; papel: string } | null;
  }
}