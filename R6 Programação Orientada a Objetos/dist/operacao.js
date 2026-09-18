"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperacaoBase = void 0;
class OperacaoBase {
    calcular(...numeros) {
        this.validarQuantidade(numeros);
        return this.executar(...numeros);
    }
    validarQuantidade(numeros) {
        if (numeros.length !== this.quantidadeNumeros) {
            throw new Error(`A operação "${this.nome}" precisa de ${this.quantidadeNumeros} número(s).`);
        }
        if (numeros.some((numero) => !Number.isFinite(numero))) {
            throw new Error("Todos os valores devem ser números válidos.");
        }
    }
}
exports.OperacaoBase = OperacaoBase;
