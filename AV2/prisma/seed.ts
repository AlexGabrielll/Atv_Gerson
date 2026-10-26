import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const banco = new PrismaClient();

async function popularBanco() {
  const organizacao = await banco.organizacao.upsert({
    where: { cnpj: '12345678000199' },
    update: {},
    create: { nome: 'Organização de Demonstração', cnpj: '12345678000199' }
  });

  const hashSenha = await bcrypt.hash('greencode123', 10);
  await banco.usuario.upsert({
    where: { email: 'admin@greencode.local' },
    update: {},
    create: {
      nome: 'Administrador de Demonstração',
      email: 'admin@greencode.local',
      senhaHash: hashSenha,
      papel: 'ADMIN'
    }
  });

  await banco.contrato.upsert({
    where: { organizacaoId: organizacao.id },
    update: {},
    create: {
      organizacaoId: organizacao.id,
      valorMensal: 500,
      clausulas: { coleta: 'Mensal', destino: 'Reciclagem certificada' },
      inicio: new Date('2026-01-01T00:00:00.000Z')
    }
  });

  let lote = await banco.lote.findFirst({ where: { organizacaoId: organizacao.id, nome: 'Lote de Demonstração' } });
  if (!lote) {
    lote = await banco.lote.create({ data: { organizacaoId: organizacao.id, nome: 'Lote de Demonstração' } });
  }

  const equipamentos = [
    { codigoBarrasInterno: 'GC-DEMO-001', descricao: 'Notebook para triagem', estado: 'EM_TRIAGEM' },
    { codigoBarrasInterno: 'GC-DEMO-002', descricao: 'Monitor em reparo', estado: 'EM_REPARO' },
    { codigoBarrasInterno: 'GC-DEMO-003', descricao: 'Teclado recebido', estado: 'RECEBIDO' }
  ];

  for (const equipamento of equipamentos) {
    await banco.equipamento.upsert({
      where: { codigoBarrasInterno: equipamento.codigoBarrasInterno },
      update: { loteId: lote.id },
      create: { ...equipamento, loteId: lote.id }
    });
  }
}

popularBanco()
  .then(() => console.log('Dados de demonstração criados.'))
  .catch((erro) => {
    console.error('Falha ao popular o banco:', erro);
    process.exitCode = 1;
  })
  .finally(async () => banco.$disconnect());