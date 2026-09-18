"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Calculadora = void 0;
class Calculadora {
    constructor(operacoes) {
        this.operacoes = new Map(operacoes.map((operacao, indice) => [(indice + 1).toString(), operacao]));
    }
    listarOperacoes() {
        return [...this.operacoes.values()];
    }
    obterOperacao(opcao) {
        const operacao = this.operacoes.get(opcao);
        if (!operacao) {
            throw new Error("Opção inválida.");
        }
        return operacao;
    }
}
exports.Calculadora = Calculadora;
