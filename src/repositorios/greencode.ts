import { Prisma, PrismaClient } from '@prisma/client';
import { EstadoEquipamento } from '../servicos/regra-equipamento';

export async function criarLoteComEquipamentos(
  banco: PrismaClient,
  entrada: { nome: string; organizacaoId: string; equipamentos: { descricao: string; codigoBarrasInterno: string }[] }
) {
  return banco.$transaction(async (transacao) => transacao.lote.create({
    data: {
      nome: entrada.nome,
      organizacaoId: entrada.organizacaoId,
      equipamentos: { create: entrada.equipamentos }
    },
    include: { equipamentos: true }
  }));
}

export async function mudarEstadoEquipamento(
  banco: PrismaClient,
  entrada: { id: string; estado: EstadoEquipamento; versao: number; observacao?: string }
) {
  return banco.$transaction(async (transacao) => {
    const atual = await transacao.equipamento.findUnique({ where: { id: entrada.id } });
    if (!atual) throw Object.assign(new Error('Equipamento não encontrado'), { statusCode: 404 });
    if (atual.versao !== entrada.versao) {
      throw Object.assign(new Error('O equipamento foi alterado por outra requisição'), { statusCode: 409 });
    }

    const alterado = await transacao.equipamento.updateMany({
      where: { id: entrada.id, versao: entrada.versao },
      data: { estado: entrada.estado, versao: { increment: 1 } }
    });
    if (alterado.count !== 1) {
      throw Object.assign(new Error('O equipamento foi alterado por outra requisição'), { statusCode: 409 });
    }

    await transacao.movimentacao.create({
      data: {
        equipamentoId: entrada.id,
        estadoAnterior: atual.estado,
        estadoNovo: entrada.estado,
        observacao: entrada.observacao
      }
    });

    return transacao.equipamento.findUniqueOrThrow({ where: { id: entrada.id } });
  });
}

export async function criarOrganizacao(banco: PrismaClient, nome: string, cnpj: string) {
  return banco.organizacao.create({ data: { nome, cnpj } });
}

export async function criarContrato(
  banco: PrismaClient,
  entrada: { organizacaoId: string; valorMensal: number; clausulas: Prisma.InputJsonValue; inicio: Date; fim?: Date }
) {
  return banco.contrato.create({ data: entrada });
}