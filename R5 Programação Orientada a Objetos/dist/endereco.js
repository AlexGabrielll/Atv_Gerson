"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Endereco {
    constructor(numero, rua, bairro, cidade) {
        this.numero = numero;
        this.rua = rua;
        this.bairro = bairro;
        this.cidade = cidade;
    }
    toString() {
        return `Rua: ${this.rua} Bairro: ${this.bairro} Cidade: ${this.cidade} numero: ${this.numero}`;
    }
}
exports.default = Endereco;
