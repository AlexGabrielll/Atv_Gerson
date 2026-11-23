"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availableScopes = void 0;
exports.createApiKey = createApiKey;
exports.revokeApiKey = revokeApiKey;
exports.requireScope = requireScope;
exports.isValidAdminToken = isValidAdminToken;
const node_crypto_1 = require("node:crypto");
const db_1 = require("../db");
exports.availableScopes = [
    'tracking:read',
    'lots:write',
    'analytics:read',
    'reports:write',
    'reports:read'
];
function hashKey(key) {
    return (0, node_crypto_1.createHash)('sha256').update(key).digest('hex');
}
async function createApiKey(organizationId, label, scopes) {
    const key = `gcp_${(0, node_crypto_1.randomBytes)(32).toString('base64url')}`;
    const savedKey = await db_1.prisma.apiKey.create({
        data: {
            organizationId,
            label,
            scopes: scopes.join(','),
            keyHash: hashKey(key)
        }
    });
    return { id: savedKey.id, key };
}
async function revokeApiKey(id) {
    await db_1.prisma.apiKey.update({
        where: { id },
        data: { revokedAt: new Date() }
    });
}
function requireScope(scope) {
    return async (request, reply) => {
        const header = request.headers['x-api-key'];
        const apiKey = Array.isArray(header) ? header[0] : header;
        if (!apiKey) {
            return reply.code(401).send({ error: 'API key obrigatoria.' });
        }
        const savedKey = await db_1.prisma.apiKey.findFirst({
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
function isValidAdminToken(providedToken) {
    const expectedToken = process.env.ADMIN_TOKEN;
    if (!expectedToken || !providedToken)
        return false;
    const expected = Buffer.from(expectedToken);
    const provided = Buffer.from(providedToken);
    return expected.length === provided.length && (0, node_crypto_1.timingSafeEqual)(expected, provided);
}
