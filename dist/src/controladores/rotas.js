"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarRotas = registrarRotas;
const autenticacao_1 = require("../servicos/autenticacao");
const regra_equipamento_1 = require("../servicos/regra-equipamento");
const greencode_1 = require("../repositorios/greencode");
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
                estado: { type: 'string', enum: regra_equipamento_1.estadosEquipamento }, versao: { type: 'integer', minimum: 1 },
                observacao: { type: 'string', maxLength: 500 }
            } } }
};
function registrarRotas(app, banco) {
    const exigirAdmin = async (pedido, resposta) => {
        if (pedido.usuario?.papel !== 'ADMIN') {
            return resposta.code(403).send({ erro: 'Acesso permitido somente para administradores' });
        }
    };
    app.post('/login', { schema: esquemas.login }, async (pedido, resposta) => {
        const usuario = await banco.usuario.findUnique({ where: { email: pedido.body.email } });
        if (!usuario || !(await (0, autenticacao_1.validarSenha)(pedido.body.senha, usuario.senhaHash))) {
            return resposta.code(401).send({ erro: 'E-mail ou senha inválidos' });
        }
        const token = app.jwt.sign({ id: usuario.id, papel: usuario.papel });
        return { token };
    });
    app.post('/organizacoes', {
        schema: esquemas.organizacao,
        preHandler: exigirAdmin
    }, async (pedido, resposta) => {
        try {
            const organizacao = await (0, greencode_1.criarOrganizacao)(banco, pedido.body.nome, pedido.body.cnpj);
            return resposta.code(201).send(organizacao);
        }
        catch (erro) {
            return tratarErro(erro, resposta);
        }
    });
    app.post('/lotes', { schema: esquemas.lote, preHandler: exigirAdmin }, async (pedido, resposta) => {
        try {
            const lote = await (0, greencode_1.criarLoteComEquipamentos)(banco, pedido.body);
            return resposta.code(201).send(lote);
        }
        catch (erro) {
            return tratarErro(erro, resposta);
        }
    });
    app.post('/contratos', { schema: esquemas.contrato, preHandler: exigirAdmin }, async (pedido, resposta) => {
        try {
            const contrato = await (0, greencode_1.criarContrato)(banco, {
                ...pedido.body,
                clausulas: pedido.body.clausulas,
                inicio: new Date(pedido.body.inicio),
                fim: pedido.body.fim ? new Date(pedido.body.fim) : undefined
            });
            return resposta.code(201).send(contrato);
        }
        catch (erro) {
            return tratarErro(erro, resposta);
        }
    });
    app.patch('/equipamentos/:id/estado', { schema: esquemas.estado }, async (pedido, resposta) => {
        const novoEstado = pedido.body.estado;
        if (!regra_equipamento_1.estadosEquipamento.includes(novoEstado)) {
            return resposta.code(400).send({ erro: 'Estado inválido' });
        }
        try {
            const equipamentoAtual = await banco.equipamento.findUnique({ where: { id: pedido.params.id } });
            if (!equipamentoAtual)
                return resposta.code(404).send({ erro: 'Equipamento não encontrado' });
            if (!(0, regra_equipamento_1.ehEstadoEquipamento)(equipamentoAtual.estado)) {
                return resposta.code(500).send({ erro: 'O equipamento possui um estado inválido no banco' });
            }
            if (!(0, regra_equipamento_1.podeMudarEstado)(equipamentoAtual.estado, novoEstado)) {
                return resposta.code(400).send({ erro: 'Transição de estado não permitida' });
            }
            const equipamento = await (0, greencode_1.mudarEstadoEquipamento)(banco, { id: pedido.params.id, ...pedido.body });
            return resposta.send(equipamento);
        }
        catch (erro) {
            return tratarErro(erro, resposta);
        }
    });
}
function tratarErro(erro, resposta) {
    const codigo = typeof erro === 'object' && erro !== null && 'statusCode' in erro
        ? Number(erro.statusCode)
        : 400;
    const mensagem = erro instanceof Error ? erro.message : 'Não foi possível concluir a operação';
    return resposta.code(codigo).send({ erro: mensagem });
}
