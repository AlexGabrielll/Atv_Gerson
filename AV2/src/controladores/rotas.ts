import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { EstadoEquipamento, PapelUsuario, PrismaClient } from '@prisma/client';
import { validarSenha } from '../servicos/autenticacao';
import { podeMudarEstado } from '../servicos/regra-equipamento';
import {
  criarContrato,
  criarLoteComEquipamentos,
  criarOrganizacao,
  mudarEstadoEquipamento
} from '../repositorios/greencode';

const esquemas = {
  login: { body: { type: 'object', required: ['email', 'senha'], additionalProperties: false, properties: {
    email: { type: 'string', minLength: 3, maxLength: 200 }, senha: { type: 'string', minLength: 8 }
  } } },
  organizacao: { body: { type: 'object', required: ['nome', 'cnpj'], additionalProperties: false, properties: {
    nome: { type: 'string', minLength: 2, maxLength: 150 }, cnpj: { type: 'string', pattern: '^\\d{14}$' }
  } } },
  lote: { body: { type: 'object', required: ['organizacaoId', 'nome', 'equipamentos'], additionalProperties: false, properties: {
    organizacaoId: { type: 'string', minLength: 1 }, nome: { type: 'string', minLength: 2, maxLength: 150 },
    equipamentos: { type: 'array', minItems: 1, items: { type: 'object', required: ['descricao', 'codigoBarrasInterno'], additionalProperties: false, properties: {
      descricao: { type: 'string', minLength: 2, maxLength: 200 }, codigoBarrasInterno: { type: 'string', minLength: 1, maxLength: 100 }
    } } }
  } } },
  contrato: { body: { type: 'object', required: ['organizacaoId', 'valorMensal', 'clausulas', 'inicio'], additionalProperties: false, properties: {
    organizacaoId: { type: 'string', minLength: 1 }, valorMensal: { type: 'number', minimum: 0 },
    clausulas: { type: 'object' }, inicio: { type: 'string', format: 'date-time' }, fim: { type: 'string', format: 'date-time' }
  } } },
  estado: { body: { type: 'object', required: ['estado', 'versao'], additionalProperties: false, properties: {
    estado: { type: 'string', enum: Object.values(EstadoEquipamento) }, versao: { type: 'integer', minimum: 1 },
    observacao: { type: 'string', maxLength: 500 }
  } } }
};

export function registrarRotas(app: FastifyInstance, banco: PrismaClient) {
  const exigirAdmin = async (pedido: FastifyRequest, resposta: FastifyReply) => {
    if (pedido.usuario?.papel !== PapelUsuario.ADMIN) {
      return resposta.code(403).send({ erro: 'Acesso permitido somente para administradores' });
    }
  };

  app.post<{ Body: { email: string; senha: string } }>('/login', { schema: esquemas.login }, async (pedido, resposta) => {
    const usuario = await banco.usuario.findUnique({ where: { email: pedido.body.email } });
    if (!usuario || !(await validarSenha(pedido.body.senha, usuario.senhaHash))) {
      return resposta.code(401).send({ erro: 'E-mail ou senha inválidos' });
    }

    const token = app.jwt.sign({ id: usuario.id, papel: usuario.papel });
    return { token };
  });

  app.post<{ Body: { nome: string; cnpj: string } }>('/organizacoes', {
    schema: esquemas.organizacao,
    preHandler: exigirAdmin
  }, async (pedido, resposta) => {
    try {
      const organizacao = await criarOrganizacao(banco, pedido.body.nome, pedido.body.cnpj);
      return resposta.code(201).send(organizacao);
    } catch (erro) {
      return tratarErro(erro, resposta);
    }
  });

  app.post<{ Body: { organizacaoId: string; nome: string; equipamentos: { descricao: string; codigoBarrasInterno: string }[] } }>(
    '/lotes', { schema: esquemas.lote, preHandler: exigirAdmin }, async (pedido, resposta) => {
      try {
        const lote = await criarLoteComEquipamentos(banco, pedido.body);
        return resposta.code(201).send(lote);
      } catch (erro) {
        return tratarErro(erro, resposta);
      }
    }
  );

  app.post<{
    Body: { organizacaoId: string; valorMensal: number; clausulas: object; inicio: string; fim?: string }
  }>('/contratos', { schema: esquemas.contrato, preHandler: exigirAdmin }, async (pedido, resposta) => {
    try {
      const contrato = await criarContrato(banco, {
        ...pedido.body,
        clausulas: pedido.body.clausulas,
        inicio: new Date(pedido.body.inicio),
        fim: pedido.body.fim ? new Date(pedido.body.fim) : undefined
      });
      return resposta.code(201).send(contrato);
    } catch (erro) {
      return tratarErro(erro, resposta);
    }
  });

  app.patch<{
    Params: { id: string };
    Body: { estado: EstadoEquipamento; versao: number; observacao?: string };
  }>('/equipamentos/:id/estado', { schema: esquemas.estado }, async (pedido, resposta) => {
    const novoEstado = pedido.body.estado;
    if (!Object.values(EstadoEquipamento).includes(novoEstado)) {
      return resposta.code(400).send({ erro: 'Estado inválido' });
    }

    try {
      const equipamentoAtual = await banco.equipamento.findUnique({ where: { id: pedido.params.id } });
      if (!equipamentoAtual) return resposta.code(404).send({ erro: 'Equipamento não encontrado' });
      if (!podeMudarEstado(equipamentoAtual.estado, novoEstado)) {
        return resposta.code(400).send({ erro: 'Transição de estado não permitida' });
      }
      const equipamento = await mudarEstadoEquipamento(banco, { id: pedido.params.id, ...pedido.body });
      return resposta.send(equipamento);
    } catch (erro) {
      return tratarErro(erro, resposta);
    }
  });
}

function tratarErro(erro: unknown, resposta: { code: (codigo: number) => { send: (corpo: object) => unknown } }) {
  const codigo = typeof erro === 'object' && erro !== null && 'statusCode' in erro
    ? Number(erro.statusCode)
    : 400;
  const mensagem = erro instanceof Error ? erro.message : 'Não foi possível concluir a operação';
  return resposta.code(codigo).send({ erro: mensagem });
}