"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const fastify_1 = __importDefault(require("fastify"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const static_1 = __importDefault(require("@fastify/static"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const routes_1 = require("./routes");
async function buildApp() {
    const app = (0, fastify_1.default)({ logger: true });
    await app.register(rate_limit_1.default, {
        global: true,
        max: 100,
        timeWindow: '1 minute',
        keyGenerator: (request) => {
            const apiKey = request.headers['x-api-key'];
            return Array.isArray(apiKey) ? apiKey[0] : apiKey ?? request.ip;
        }
    });
    await app.register(swagger_1.default, {
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
    await app.register(routes_1.registerRoutes);
    await app.register(swagger_ui_1.default, { routePrefix: '/docs' });
    app.get('/health', async () => ({ status: 'ok' }));
    const clientBuild = node_path_1.default.resolve(process.cwd(), 'client', 'dist');
    if ((0, node_fs_1.existsSync)(clientBuild)) {
        await app.register(static_1.default, { root: clientBuild, prefix: '/' });
    }
    return app;
}
