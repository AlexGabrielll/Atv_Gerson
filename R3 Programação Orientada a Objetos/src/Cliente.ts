import { Endereco } from './Endereco';
import { Telefone } from './Telefone';

export class Cliente {
  #cpf: string;
  private endereco?: Endereco;
  private telefones: Telefone[] = [];

  constructor(
    cpf: string,
    public nome: string,
  ) {
    this.#cpf = cpf;
  }

  get cpf(): string {
    return this.#cpf;
  }

  getNomeMaiusculo(): string {
    return this.nome.toUpperCase();
  }

  getNomeMinusculo(): string {
    return this.nome.toLowerCase();
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

  detalhe(): string {
    const linhas = [
      `Nome: ${this.nome}`,
      this.endereco?.detalhe() ?? 'Endereco nao informado',
      ...this.telefones.map((telefone) => telefone.detalhe()),
    ];

    return linhas.join('\n');
  }
}
