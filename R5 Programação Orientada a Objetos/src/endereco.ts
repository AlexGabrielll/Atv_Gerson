export default class Endereco {
  constructor(
    public numero: number,
    public rua: string,
    public bairro: string,
    public cidade: string,
  ) {}

  toString(): string {
    return `Rua: ${this.rua} Bairro: ${this.bairro} Cidade: ${this.cidade} numero: ${this.numero}`;
  }
}
