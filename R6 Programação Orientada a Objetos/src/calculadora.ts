import { Operacao } from "./operacao";

export class Calculadora {
  private readonly operacoes: ReadonlyMap<string, Operacao>;

  public constructor(operacoes: Operacao[]) {
    this.operacoes = new Map(
      operacoes.map((operacao, indice) => [(indice + 1).toString(), operacao]),
    );
  }

  public listarOperacoes(): Operacao[] {
    return [...this.operacoes.values()];
  }

  public obterOperacao(opcao: string): Operacao {
    const operacao = this.operacoes.get(opcao);

    if (!operacao) {
      throw new Error("Opção inválida.");
    }

    return operacao;
  }
}
