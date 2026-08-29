export class Endereco {
  constructor(
    public estado: string,
    public cidade: string,
    public rua: string,
    public numero: string,
  ) {}

  getEstadoMaiusculo(): string {
    return this.estado.toUpperCase();
  }

  getEstadoMinusculo(): string {
    return this.estado.toLowerCase();
  }

  getCidadeMaiusculo(): string {
    return this.cidade.toUpperCase();
  }

  getCidadeMinusculo(): string {
    return this.cidade.toLowerCase();
  }

  getRuaMaiusculo(): string {
    return this.rua.toUpperCase();
  }

  getRuaMinusculo(): string {
    return this.rua.toLowerCase();
  }

  getNumeroMaiusculo(): string {
    return this.numero.toUpperCase();
  }

  getNumeroMinusculo(): string {
    return this.numero.toLowerCase();
  }

  detalhe(): string {
    return `Estado: ${this.estado} cidade: ${this.cidade} rua: ${this.rua} numero: ${this.numero}`;
  }
}
