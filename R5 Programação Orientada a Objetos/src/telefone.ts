export default class Telefone {
  constructor(
    public ddd: string,
    public numero: string,
  ) {}

  toString(): string {
    return `(${this.ddd}) ${this.numero}`;
  }
}
