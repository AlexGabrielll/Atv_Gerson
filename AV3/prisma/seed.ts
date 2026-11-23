import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
