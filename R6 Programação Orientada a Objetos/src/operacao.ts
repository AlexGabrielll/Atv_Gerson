export interface Operacao {
  readonly nome: string;
  readonly quantidadeNumeros: number;
  calcular(...numeros: number[]): number | number[];
}

export abstract class OperacaoBase implements Operacao {
  public abstract readonly nome: string;
  public abstract readonly quantidadeNumeros: number;

  public calcular(...numeros: number[]): number | number[] {
    this.validarQuantidade(numeros);
    return this.executar(...numeros);
  }

  protected abstract executar(...numeros: number[]): number | number[];

  private validarQuantidade(numeros: number[]): void {
    if (numeros.length !== this.quantidadeNumeros) {
      throw new Error(
        `A operação "${this.nome}" precisa de ${this.quantidadeNumeros} número(s).`,
      );
    }

    if (numeros.some((numero) => !Number.isFinite(numero))) {
      throw new Error("Todos os valores devem ser números válidos.");
    }
  }
}
