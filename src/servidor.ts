import 'dotenv/config';
import { criarApp } from './app';

async function iniciar() {
  const segredo = process.env.JWT_SEGREDO ?? 'greencode-segredo-local-apenas-desenvolvimento';
  const app = criarApp({ segredoJwt: segredo });
  const porta = Number(process.env.PORTA ?? 3000);
  await app.listen({ port: porta, host: '0.0.0.0' });

  const encerrar = async () => {
    await app.close();
    process.exit(0);
  };

  process.once('SIGINT', encerrar);
  process.once('SIGTERM', encerrar);
}

iniciar().catch((erro) => {
  console.error('Falha ao iniciar a API:', erro);
  process.exit(1);
});