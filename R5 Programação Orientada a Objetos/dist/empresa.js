"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Empresa {
    constructor(funcionarios, endereco, razaoSocial, nomeFantasia, cnpj, telefones = []) {
        this.funcionarios = funcionarios;
        this.endereco = endereco;
        this.razaoSocial = razaoSocial;
        this.nomeFantasia = nomeFantasia;
        this.cnpj = cnpj;
        this.telefones = telefones;
    }
}
exports.default = Empresa;
