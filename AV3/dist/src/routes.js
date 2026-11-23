"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const api_keys_1 = require("./auth/api-keys");
const service_1 = require("./analytics/service");
const db_1 = require("./db");
const queue_1 = require("./queue");
const scopes = new Set(api_keys_1.availableScopes);
function organizationId(request) {
    if (!request.partner)
        throw new Error('Parceiro nao autenticado.');
    return request.partner.organizationId;
}
async function registerRoutes(app) {
    app.post('/api/v1/internal/api-keys', {
        schema: {
            description: 'Gera uma chave para uma organizacao existente. Requer x-admin-token.',
            headers: { type: 'object', required: ['x-admin-token'], properties: { 'x-admin-token': { type: 'string' } } },
            body: {
                type: 'object',
                required: ['organizationId', 'label', 'scopes'],
                properties: {
                    organizationId: { type: 'string', description: 'Exemplo: greencode-demo.' },
                    label: { type: 'string', description: 'Exemplo: Parceiro de integracao.' },
                    scopes: { type: 'array', items: { type: 'string', enum: [...api_keys_1.availableScopes] } }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: { id: { type: 'string' }, key: { type: 'string' }, warning: { type: 'string' } }
                },
                400: { type: 'object', properties: { error: { type: 'string' } } },
                401: { type: 'object', properties: { error: { type: 'string' } } },
                404: { type: 'object', properties: { error: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        const adminToken = request.headers['x-admin-token'];
        if (!(0, api_keys_1.isValidAdminToken)(Array.isArray(adminToken) ? adminToken[0] : adminToken)) {
            return reply.code(401).send({ error: 'Token administrativo invalido.' });
        }
        const body = request.body;
        if (body.scopes.some((scope) => !scopes.has(scope))) {
            return reply.code(400).send({ error: 'Permissoes invalidas.' });
        }
        const organization = await db_1.prisma.organization.findUnique({
            where: { id: body.organizationId }
        });
        if (!organization)
            return reply.code(404).send({ error: 'Organizacao nao encontrada.' });
        const createdKey = await (0, api_keys_1.createApiKey)(body.organizationId, body.label, body.scopes);
        return reply.code(201).send({
            id: createdKey.id,
            key: createdKey.key,
            warning: 'Guarde esta chave: ela nao sera exibida novamente.'
        });
    });
    app.delete('/api/v1/internal/api-keys/:id', {
        schema: {
            description: 'Revoga uma chave de API. Requer x-admin-token.',
            headers: { type: 'object', required: ['x-admin-token'], properties: { 'x-admin-token': { type: 'string' } } },
            params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
            response: {
                204: { type: 'null' },
                401: { type: 'object', properties: { error: { type: 'string' } } },
                404: { type: 'object', properties: { error: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        const adminToken = request.headers['x-admin-token'];
        if (!(0, api_keys_1.isValidAdminToken)(Array.isArray(adminToken) ? adminToken[0] : adminToken)) {
            return reply.code(401).send({ error: 'Token administrativo invalido.' });
        }
        const { id } = request.params;
        const key = await db_1.prisma.apiKey.findUnique({ where: { id } });
        if (!key)
            return reply.code(404).send({ error: 'Chave nao encontrada.' });
        await (0, api_keys_1.revokeApiKey)(id);
        return reply.code(204).send();
    });
    app.post('/api/v1/public/lots', {
        preHandler: (0, api_keys_1.requireScope)('lots:write'),
        schema: {
            description: 'Submete um lote e o equipamento associado.',
            security: [{ apiKey: [] }],
            headers: { type: 'object', required: ['x-api-key'], properties: { 'x-api-key': { type: 'string' } } },
            body: {
                type: 'object',
                required: ['code', 'equipment'],
                properties: {
                    code: { type: 'string', minLength: 1, description: 'Exemplo: LOTE-2026-001.' },
                    operatorName: { type: 'string' },
                    equipment: {
                        type: 'object',
                        required: ['category', 'brand', 'model', 'physicalCondition', 'estimatedRecoveryValue', 'ageMonths'],
                        properties: {
                            category: { type: 'string' },
                            brand: { type: 'string' },
                            model: { type: 'string' },
                            physicalCondition: { type: 'string', enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNSERVICEABLE'] },
                            estimatedRecoveryValue: { type: 'number', minimum: 0 },
                            ageMonths: { type: 'integer', minimum: 0 }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const body = request.body;
        const lot = await db_1.prisma.lot.create({
            data: {
                code: body.code,
                operatorName: body.operatorName,
                organizationId: organizationId(request),
                equipment: {
                    create: {
                        ...body.equipment,
                        conditionRecords: {
                            create: {
                                ageMonths: body.equipment.ageMonths,
                                conditionScore: conditionScore(body.equipment.physicalCondition)
                            }
                        }
                    }
                }
            },
            include: { equipment: true }
        });
        return reply.code(201).send(lot);
    });
    app.patch('/api/v1/public/lots/:code/status', {
        preHandler: (0, api_keys_1.requireScope)('lots:write'),
        schema: {
            description: 'Atualiza a etapa de triagem; ao concluir, registra o horario usado na analise operacional.',
            security: [{ apiKey: [] }],
            headers: { type: 'object', required: ['x-api-key'], properties: { 'x-api-key': { type: 'string' } } },
            params: { type: 'object', required: ['code'], properties: { code: { type: 'string' } } },
            body: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['RECEIVED', 'TRIAGING', 'COMPLETED'] },
                    operatorName: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        code: { type: 'string' },
                        status: { type: 'string' },
                        operatorName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                        receivedAt: { type: 'string' },
                        completedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] }
                    },
                    additionalProperties: true
                },
                404: { type: 'object', properties: { error: { type: 'string' } } },
                401: { type: 'object', properties: { error: { type: 'string' } } },
                403: { type: 'object', properties: { error: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        const { code } = request.params;
        const { status, operatorName } = request.body;
        const lot = await db_1.prisma.lot.findFirst({
            where: { code, organizationId: organizationId(request) }
        });
        if (!lot)
            return reply.code(404).send({ error: 'Lote nao encontrado.' });
        return db_1.prisma.lot.update({
            where: { id: lot.id },
            data: {
                status,
                operatorName: operatorName ?? lot.operatorName,
                completedAt: status === 'COMPLETED' ? new Date() : null
            }
        });
    });
    app.post('/api/v1/public/lots/:code/equipment/:equipmentId/condition', {
        preHandler: (0, api_keys_1.requireScope)('lots:write'),
        schema: {
            description: 'Registra uma nova observacao de condicao para alimentar a previsao historica.',
            security: [{ apiKey: [] }],
            headers: { type: 'object', required: ['x-api-key'], properties: { 'x-api-key': { type: 'string' } } },
            params: {
                type: 'object',
                required: ['code', 'equipmentId'],
                properties: { code: { type: 'string' }, equipmentId: { type: 'string' } }
            },
            body: {
                type: 'object',
                required: ['ageMonths', 'physicalCondition'],
                properties: {
                    ageMonths: { type: 'integer', minimum: 0 },
                    physicalCondition: { type: 'string', enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNSERVICEABLE'] }
                }
            },
            response: {
                201: { type: 'object', description: 'Observacao registrada.', additionalProperties: true },
                404: { type: 'object', properties: { error: { type: 'string' } } },
                401: { type: 'object', properties: { error: { type: 'string' } } },
                403: { type: 'object', properties: { error: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        const { code, equipmentId } = request.params;
        const { ageMonths, physicalCondition } = request.body;
        const equipment = await db_1.prisma.equipment.findFirst({
            where: {
                id: equipmentId,
                lot: { code, organizationId: organizationId(request) }
            },
            select: { id: true }
        });
        if (!equipment)
            return reply.code(404).send({ error: 'Equipamento nao encontrado neste lote.' });
        const updatedEquipment = await db_1.prisma.equipment.update({
            where: { id: equipment.id },
            data: {
                ageMonths,
                physicalCondition,
                conditionRecords: {
                    create: { ageMonths, conditionScore: conditionScore(physicalCondition) }
                }
            },
            include: { conditionRecords: true }
        });
        return reply.code(201).send(updatedEquipment);
    });
    app.get('/api/v1/public/lots/:code/tracking', {
        preHandler: (0, api_keys_1.requireScope)('tracking:read'),
        schema: {
            description: 'Consulta o estado de rastreabilidade de um lote da organizacao.',
            security: [{ apiKey: [] }],
            headers: { type: 'object', required: ['x-api-key'], properties: { 'x-api-key': { type: 'string' } } },
            params: { type: 'object', required: ['code'], properties: { code: { type: 'string' } } },
            response: {
                200: { type: 'object', description: 'Dados de rastreabilidade do lote.', additionalProperties: true },
                404: { type: 'object', properties: { error: { type: 'string' } } },
                401: { type: 'object', properties: { error: { type: 'string' } } },
                403: { type: 'object', properties: { error: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        const { code } = request.params;
        const lot = await db_1.prisma.lot.findFirst({
            where: { code, organizationId: organizationId(request) },
            include: { equipment: { include: { conditionRecords: true } } }
        });
        if (!lot)
            return reply.code(404).send({ error: 'Lote nao encontrado.' });
        return lot;
    });
    app.get('/api/v1/public/analytics/efficiency', {
        preHandler: (0, api_keys_1.requireScope)('analytics:read'),
        schema: {
            description: 'Retorna tempo medio de triagem e resultados por operador.',
            security: [{ apiKey: [] }],
            response: {
                401: { type: 'object', properties: { error: { type: 'string' } } },
                403: { type: 'object', properties: { error: { type: 'string' } } },
                429: { type: 'object', properties: { message: { type: 'string' } } }
            }
        }
    }, async (request) => (0, service_1.getEfficiency)(organizationId(request)));
    app.get('/api/v1/public/analytics/profitability', {
        preHandler: (0, api_keys_1.requireScope)('analytics:read'),
        schema: {
            description: 'Retorna valores medios de recuperacao por categoria e estado.',
            security: [{ apiKey: [] }],
            response: {
                401: { type: 'object', properties: { error: { type: 'string' } } },
                403: { type: 'object', properties: { error: { type: 'string' } } },
                429: { type: 'object', properties: { message: { type: 'string' } } }
            }
        }
    }, async (request) => (0, service_1.getProfitability)(organizationId(request)));
    app.get('/api/v1/public/analytics/useful-life', {
        preHandler: (0, api_keys_1.requireScope)('analytics:read'),
        schema: {
            description: 'Projeta vida util remanescente por categoria usando regressao linear.',
            security: [{ apiKey: [] }],
            response: {
                401: { type: 'object', properties: { error: { type: 'string' } } },
                403: { type: 'object', properties: { error: { type: 'string' } } },
                429: { type: 'object', properties: { message: { type: 'string' } } }
            }
        }
    }, async (request) => (0, service_1.getUsefulLife)(organizationId(request)));
    app.post('/api/v1/public/reports', {
        preHandler: (0, api_keys_1.requireScope)('reports:write'),
        schema: {
            description: 'Solicita a geracao assincrona de um relatorio analitico.',
            security: [{ apiKey: [] }],
            headers: { type: 'object', required: ['x-api-key'], properties: { 'x-api-key': { type: 'string' } } },
            body: {
                type: 'object',
                required: ['type'],
                properties: {
                    type: { type: 'string', enum: ['efficiency', 'profitability', 'useful-life', 'all'] }
                }
            },
            response: {
                202: {
                    type: 'object',
                    properties: { reportId: { type: 'string' }, status: { type: 'string' } }
                },
                401: { type: 'object', properties: { error: { type: 'string' } } },
                403: { type: 'object', properties: { error: { type: 'string' } } },
                429: { type: 'object', properties: { message: { type: 'string' } } },
                503: { type: 'object', properties: { error: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        const { type } = request.body;
        const report = await db_1.prisma.analyticsReport.create({
            data: { type, organizationId: organizationId(request) }
        });
        let timeout;
        try {
            const job = (0, queue_1.getReportQueue)().add('generate-report', { reportId: report.id, organizationId: report.organizationId, type }, { jobId: report.id, attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
            await Promise.race([
                job,
                new Promise((_, reject) => {
                    timeout = setTimeout(() => reject(new Error('Redis indisponivel; confira REDIS_URL e se o servico esta ativo.')), 5000);
                })
            ]);
        }
        catch (error) {
            await db_1.prisma.analyticsReport.update({
                where: { id: report.id },
                data: { status: 'FAILED', errorMessage: errorMessage(error), completedAt: new Date() }
            });
            return reply.code(503).send({ error: `Relatorio nao enfileirado: ${errorMessage(error)}` });
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
        }
        return reply.code(202).send({ reportId: report.id, status: 'QUEUED' });
    });
    app.get('/api/v1/public/reports/:id', {
        preHandler: (0, api_keys_1.requireScope)('reports:read'),
        schema: {
            description: 'Consulta estado e resultado de um relatorio.',
            security: [{ apiKey: [] }],
            headers: { type: 'object', required: ['x-api-key'], properties: { 'x-api-key': { type: 'string' } } },
            params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
            response: {
                200: { type: 'object', additionalProperties: true },
                401: { type: 'object', properties: { error: { type: 'string' } } },
                403: { type: 'object', properties: { error: { type: 'string' } } },
                404: { type: 'object', properties: { error: { type: 'string' } } },
                429: { type: 'object', properties: { message: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const report = await db_1.prisma.analyticsReport.findFirst({
            where: { id, organizationId: organizationId(request) }
        });
        if (!report)
            return reply.code(404).send({ error: 'Relatorio nao encontrado.' });
        return {
            id: report.id,
            type: report.type,
            status: report.status,
            result: report.resultJson ? JSON.parse(report.resultJson) : null,
            error: report.errorMessage,
            createdAt: report.createdAt,
            completedAt: report.completedAt
        };
    });
}
function conditionScore(condition) {
    const scores = {
        EXCELLENT: 5,
        GOOD: 4,
        FAIR: 3,
        POOR: 2,
        UNSERVICEABLE: 0
    };
    return scores[condition] ?? 0;
}
function errorMessage(error) {
    return error instanceof Error ? error.message : 'Erro inesperado ao enfileirar relatorio.';
}
