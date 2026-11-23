"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.organization.upsert({
        where: { id: 'greencode-demo' },
        update: {},
        create: { id: 'greencode-demo', name: 'Organizacao demonstracao Greencode' }
    });
    console.log('Organizacao de demonstracao criada. ID: greencode-demo');
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => prisma.$disconnect());
