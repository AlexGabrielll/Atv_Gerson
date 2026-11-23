import { existsSync } from 'node:fs';
import path from 'node:path';
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { registerRoutes } from './routes';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      const apiKey = request.headers['x-api-key'];
      return Array.isArray(apiKey) ? apiKey[0] : apiKey ?? request.ip;
    }
  });
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Greencode Public API',
        description: 'API versionada para rastreabilidade, lotes e analises de logistica reversa.',
        version: '1.0.0'
      },
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' }
        }
      }
    }
  });
  await app.register(registerRoutes);
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/health', async () => ({ status: 'ok' }));

  const clientBuild = path.resolve(process.cwd(), 'client', 'dist');
  if (existsSync(clientBuild)) {
    await app.register(fastifyStatic, { root: clientBuild, prefix: '/' });
  }

  return app;
}
