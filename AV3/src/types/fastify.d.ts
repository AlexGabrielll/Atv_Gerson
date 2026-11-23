import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    partner?: {
      organizationId: string;
      scopes: string[];
    };
  }
}
