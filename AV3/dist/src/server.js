"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const db_1 = require("./db");
async function main() {
    const app = await (0, app_1.buildApp)();
    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? '0.0.0.0';
    try {
        await app.listen({ port, host });
    }
    catch (error) {
        app.log.error(error);
        await db_1.prisma.$disconnect();
        process.exitCode = 1;
    }
}
void main();
