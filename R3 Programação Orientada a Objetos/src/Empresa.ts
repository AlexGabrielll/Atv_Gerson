import { Cliente } from './Cliente';
import { Endereco } from './Endereco';
import { Telefone } from './Telefone';

export class Empresa {
  #cnpj: string;
  private endereco?: Endereco;
  private telefones: Telefone[] = [];
  private clientes: Cliente[] = [];

  constructor(
    cnpj: string,
    public razaoSocial: string,
    public nomeFantasia: string,
  ) {
    this.#cnpj = cnpj;
  }

  get cnpj(): string {
    return this.#cnpj;
  }

  getRazaoSocialMaiusculo(): string {
    return this.razaoSocial.toUpperCase();
  }

  getRazaoSocialMinusculo(): string {
    return this.razaoSocial.toLowerCase();
  }

  getNomeFantasiaMaiusculo(): string {
    return this.nomeFantasia.toUpperCase();
  }

  getNomeFantasiaMinusculo(): string {
    return this.nomeFantasia.toLowerCase();
  }

  getEndereco(): Endereco | undefined {
    return this.endereco;
  }

  setEndereco(endereco: Endereco): void {
    this.endereco = endereco;
  }

  getTelefones(): Telefone[] {
    return [...this.telefones];
  }

  adicionarTelefone(telefone: Telefone): void {
    this.telefones.push(telefone);
  }

  removerTelefone(indice: number): void {
    if (indice < 0 || indice >= this.telefones.length) {
      throw new RangeError('Indice de telefone invalido.');
    }

    this.telefones.splice(indice, 1);
  }

  getClientes(): Cliente[] {
    return [...this.clientes];
  }

  adicionarCliente(cliente: Cliente): void {
    this.clientes.push(cliente);
  }

  removerCliente(indice: number): void {
    if (indice < 0 || indice >= this.clientes.length) {
      throw new RangeError('Indice de cliente invalido.');
    }

    this.clientes.splice(indice, 1);
  }

  detalhe(): string {
    const linhas = [
      `Razao Social: ${this.razaoSocial}`,
      `Nome fantasia: ${this.nomeFantasia}`,
      '--------------------',
      ...this.clientes.map((cliente) => cliente.detalhe()),
    ];

    return linhas.join('\n\n');
  }
}
