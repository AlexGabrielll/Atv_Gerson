"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const descritorEmpresa_1 = __importDefault(require("./descritorEmpresa"));
const empresa_1 = __importDefault(require("./empresa"));
const endereco_1 = __importDefault(require("./endereco"));
const funcionario_1 = __importDefault(require("./funcionario"));
const telefone_1 = __importDefault(require("./telefone"));
const endereco = new endereco_1.default(123, 'Av. Paulista', 'Jardim Paulista', 'São Paulo');
const telefone = new telefone_1.default('011', '9-9999-9999');
const funcionario = new funcionario_1.default('Tony Stark', '123456789', '999.999.999-99', endereco, telefone);
const empresa = new empresa_1.default([funcionario], endereco, 'ABC LTDA', 'Mercado online', '999-999-999-999-99', [telefone]);
new descritorEmpresa_1.default().descrever(empresa);
