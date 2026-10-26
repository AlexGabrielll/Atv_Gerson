"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarLoteComEquipamentos = criarLoteComEquipamentos;
exports.mudarEstadoEquipamento = mudarEstadoEquipamento;
exports.criarOrganizacao = criarOrganizacao;
exports.criarContrato = criarContrato;
async function criarLoteComEquipamentos(banco, entrada) {
    return banco.$transaction(async (transacao) => transacao.lote.create({
        data: {
            nome: entrada.nome,
            organizacaoId: entrada.organizacaoId,
            equipamentos: { create: entrada.equipamentos }
        },
        include: { equipamentos: true }
    }));
}
async function mudarEstadoEquipamento(banco, entrada) {
    return banco.$transaction(async (transacao) => {
        const atual = await transacao.equipamento.findUnique({ where: { id: entrada.id } });
        if (!atual)
            throw Object.assign(new Error('Equipamento não encontrado'), { statusCode: 404 });
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
async function criarOrganizacao(banco, nome, cnpj) {
    return banco.organizacao.create({ data: { nome, cnpj } });
}
async function criarContrato(banco, entrada) {
    return banco.contrato.create({ data: entrada });
}
