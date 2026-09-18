"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bhaskara = exports.Radiciacao = exports.Potenciacao = exports.Divisao = exports.Subtracao = exports.Soma = void 0;
const operacao_1 = require("./operacao");
class Soma extends operacao_1.OperacaoBase {
    constructor() {
        super(...arguments);
        this.nome = "Soma";
        this.quantidadeNumeros = 2;
    }
    executar(primeiro, segundo) {
        return primeiro + segundo;
    }
}
exports.Soma = Soma;
class Subtracao extends operacao_1.OperacaoBase {
    constructor() {
        super(...arguments);
        this.nome = "Subtração";
        this.quantidadeNumeros = 2;
    }
    executar(primeiro, segundo) {
        return primeiro - segundo;
    }
}
exports.Subtracao = Subtracao;
class Divisao extends operacao_1.OperacaoBase {
    constructor() {
        super(...arguments);
        this.nome = "Divisão";
        this.quantidadeNumeros = 2;
    }
    executar(primeiro, segundo) {
        if (segundo === 0) {
            throw new Error("Não é possível dividir por zero.");
        }
        return primeiro / segundo;
    }
}
exports.Divisao = Divisao;
class Potenciacao extends operacao_1.OperacaoBase {
    constructor() {
        super(...arguments);
        this.nome = "Potenciação";
        this.quantidadeNumeros = 2;
    }
    executar(base, expoente) {
        return Math.pow(base, expoente);
    }
}
exports.Potenciacao = Potenciacao;
class Radiciacao extends operacao_1.OperacaoBase {
    constructor() {
        super(...arguments);
        this.nome = "Radiciação";
        this.quantidadeNumeros = 2;
    }
    executar(indice, radicando) {
        if (indice === 0) {
            throw new Error("O índice da raiz não pode ser zero.");
        }
        if (radicando < 0 && Number.isInteger(indice) && indice % 2 === 0) {
            throw new Error("Não existe raiz real de índice par para número negativo.");
        }
        return Math.sign(radicando) * Math.pow(Math.abs(radicando), 1 / indice);
    }
}
exports.Radiciacao = Radiciacao;
class Bhaskara extends operacao_1.OperacaoBase {
    constructor() {
        super(...arguments);
        this.nome = "Bhaskara";
        this.quantidadeNumeros = 3;
    }
    executar(a, b, c) {
        if (a === 0) {
            throw new Error('O coeficiente "a" não pode ser zero.');
        }
        const delta = b ** 2 - 4 * a * c;
        if (delta < 0) {
            throw new Error("A equação não possui raízes reais (delta negativo).");
        }
        if (delta === 0) {
            return [-b / (2 * a)];
        }
        const raizDoDelta = Math.sqrt(delta);
        return [(-b + raizDoDelta) / (2 * a), (-b - raizDoDelta) / (2 * a)];
    }
}
exports.Bhaskara = Bhaskara;
