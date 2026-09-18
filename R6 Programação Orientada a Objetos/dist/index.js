"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("node:readline/promises"));
const node_process_1 = require("node:process");
const calculadora_1 = require("./calculadora");
const operacoes_1 = require("./operacoes");
const calculadora = new calculadora_1.Calculadora([
    new operacoes_1.Soma(),
    new operacoes_1.Subtracao(),
    new operacoes_1.Divisao(),
    new operacoes_1.Potenciacao(),
    new operacoes_1.Radiciacao(),
    new operacoes_1.Bhaskara(),
]);
const interfaceLinha = readline.createInterface({
    input: node_process_1.stdin,
    output: node_process_1.stdout,
});
function mostrarMenu() {
    console.log("\n=== CALCULADORA POO ===");
    calculadora.listarOperacoes().forEach((operacao, indice) => {
        console.log(`${indice + 1}. ${operacao.nome}`);
    });
    console.log("0. Sair");
}
function lerNumeros(texto) {
    const valores = texto
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number);
    if (valores.some((valor) => !Number.isFinite(valor))) {
        throw new Error("Digite apenas números separados por espaço ou vírgula.");
    }
    return valores;
}
async function executar() {
    console.log("Calculadora especial - exercícios de POO");
    while (true) {
        mostrarMenu();
        const opcao = (await interfaceLinha.question("Escolha uma operação: ")).trim();
        if (opcao === "0") {
            console.log("Até mais!");
            return;
        }
        try {
            const operacao = calculadora.obterOperacao(opcao);
            console.log(`Digite ${operacao.quantidadeNumeros} número(s), separados por espaço ou vírgula.`);
            const numeros = lerNumeros(await interfaceLinha.question("> "));
            const resultado = operacao.calcular(...numeros);
            if (Array.isArray(resultado)) {
                console.log(resultado.length === 1
                    ? `Raiz: ${resultado[0]}`
                    : `Raízes: x1 = ${resultado[0]}, x2 = ${resultado[1]}`);
            }
            else {
                console.log(`Resultado: ${resultado}`);
            }
        }
        catch (erro) {
            const mensagem = erro instanceof Error ? erro.message : "Erro inesperado.";
            console.log(`Erro: ${mensagem}`);
        }
    }
}
executar()
    .catch((erro) => {
    const mensagem = erro instanceof Error ? erro.message : "Erro inesperado.";
    console.error(mensagem);
    process.exitCode = 1;
})
    .finally(() => interfaceLinha.close());
