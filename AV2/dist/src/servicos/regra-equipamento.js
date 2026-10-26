"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.podeMudarEstado = podeMudarEstado;
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
