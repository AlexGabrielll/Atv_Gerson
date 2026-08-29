export class Telefone {
  constructor(
    public ddd: string,
    public numero: string,
  ) {}

  getDddMaiusculo(): string {
    return this.ddd.toUpperCase();
  }

  getDddMinusculo(): string {
    return this.ddd.toLowerCase();
  }

  getNumeroMaiusculo(): string {
    return this.numero.toUpperCase();
  }

  getNumeroMinusculo(): string {
    return this.numero.toLowerCase();
  }

  detalhe(): string {
    return `ddd: ${this.ddd} numero: ${this.numero}`;
  }
}
