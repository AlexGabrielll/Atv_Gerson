import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { prisma } from '../db';

export const availableScopes = [
  'tracking:read',
  'lots:write',
  'analytics:read',
  'reports:write',
  'reports:read'
] as const;

export type ApiScope = (typeof availableScopes)[number];

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function createApiKey(
  organizationId: string,
  label: string,
  scopes: ApiScope[]
): Promise<{ id: string; key: string }> {
  const key = `gcp_${randomBytes(32).toString('base64url')}`;
  const savedKey = await prisma.apiKey.create({
    data: {
      organizationId,
      label,
      scopes: scopes.join(','),
      keyHash: hashKey(key)
    }
  });
  return { id: savedKey.id, key };
}

export async function revokeApiKey(id: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() }
  });
}

export function requireScope(scope: ApiScope): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers['x-api-key'];
    const apiKey = Array.isArray(header) ? header[0] : header;

    if (!apiKey) {
      return reply.code(401).send({ error: 'API key obrigatoria.' });
    }

    const savedKey = await prisma.apiKey.findFirst({
      where: { keyHash: hashKey(apiKey), revokedAt: null }
    });

    if (!savedKey) {
      return reply.code(401).send({ error: 'API key invalida ou revogada.' });
    }

    const scopes = savedKey.scopes.split(',').filter(Boolean);
    if (!scopes.includes(scope)) {
      return reply.code(403).send({ error: `Permissao necessaria: ${scope}.` });
    }

    request.partner = {
      organizationId: savedKey.organizationId,
      scopes
    };
  };
}

export function isValidAdminToken(providedToken: string | undefined): boolean {
  const expectedToken = process.env.ADMIN_TOKEN;
  if (!expectedToken || !providedToken) return false;

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}
