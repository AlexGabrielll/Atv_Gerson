"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarApp = criarApp;
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const client_1 = require("@prisma/client");
const rotas_1 = require("./controladores/rotas");
function criarApp(opcoes = {}) {
    const app = (0, fastify_1.default)({ logger: false });
    const banco = opcoes.banco ?? new client_1.PrismaClient();
    app.get('/saude', async () => ({ status: 'ok' }));
    app.register(jwt_1.default, { secret: opcoes.segredoJwt ?? process.env.JWT_SEGREDO ?? 'segredo-local-de-desenvolvimento' });
    app.decorateRequest('usuario', null);
    app.addHook('preHandler', async (pedido, resposta) => {
        if (pedido.url === '/saude' || pedido.url === '/login')
            return;
        try {
            await pedido.jwtVerify();
            pedido.usuario = pedido.user;
        }
        catch {
            return resposta.code(401).send({ erro: 'Token ausente ou inválido' });
        }
    });
    (0, rotas_1.registrarRotas)(app, banco);
    app.addHook('onClose', async () => {
        if (!opcoes.banco)
            await banco.$disconnect();
    });
    return app;
}
