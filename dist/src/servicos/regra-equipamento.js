"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.papeisUsuario = exports.estadosEquipamento = void 0;
exports.ehEstadoEquipamento = ehEstadoEquipamento;
exports.podeMudarEstado = podeMudarEstado;
exports.estadosEquipamento = [
    'RECEBIDO',
    'EM_TRIAGEM',
    'EM_REPARO',
    'RECICLADO',
    'DESCARTADO'
];
exports.papeisUsuario = ['ADMIN', 'OPERADOR'];
function ehEstadoEquipamento(estado) {
    return exports.estadosEquipamento.includes(estado);
}
const proximosEstados = {
    RECEBIDO: ['EM_TRIAGEM'],
    EM_TRIAGEM: ['EM_REPARO', 'RECICLADO', 'DESCARTADO'],
    EM_REPARO: ['RECICLADO', 'DESCARTADO'],
    RECICLADO: [],
    DESCARTADO: []
};
function podeMudarEstado(atual, proximo) {
    return proximosEstados[atual].includes(proximo);
}
