"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Telefone {
    constructor(ddd, numero) {
        this.ddd = ddd;
        this.numero = numero;
    }
    toString() {
        return `(${this.ddd}) ${this.numero}`;
    }
}
exports.default = Telefone;
