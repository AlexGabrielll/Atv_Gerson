import 'dotenv/config';
import { buildApp } from './app';
import { prisma } from './db';

async function main() {
  const app = await buildApp();
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  }
}

void main();
