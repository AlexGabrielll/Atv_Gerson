import { OperacaoBase } from "./operacao";

export class Soma extends OperacaoBase {
  public readonly nome = "Soma";
  public readonly quantidadeNumeros = 2;

  protected executar(primeiro: number, segundo: number): number {
    return primeiro + segundo;
  }
}

export class Subtracao extends OperacaoBase {
  public readonly nome = "Subtração";
  public readonly quantidadeNumeros = 2;

  protected executar(primeiro: number, segundo: number): number {
    return primeiro - segundo;
  }
}

export class Divisao extends OperacaoBase {
  public readonly nome = "Divisão";
  public readonly quantidadeNumeros = 2;

  protected executar(primeiro: number, segundo: number): number {
    if (segundo === 0) {
      throw new Error("Não é possível dividir por zero.");
    }

    return primeiro / segundo;
  }
}

export class Potenciacao extends OperacaoBase {
  public readonly nome = "Potenciação";
  public readonly quantidadeNumeros = 2;

  protected executar(base: number, expoente: number): number {
    return Math.pow(base, expoente);
  }
}

export class Radiciacao extends OperacaoBase {
  public readonly nome = "Radiciação";
  public readonly quantidadeNumeros = 2;

  protected executar(indice: number, radicando: number): number {
    if (indice === 0) {
      throw new Error("O índice da raiz não pode ser zero.");
    }

    if (radicando < 0 && Number.isInteger(indice) && indice % 2 === 0) {
      throw new Error("Não existe raiz real de índice par para número negativo.");
    }

    return Math.sign(radicando) * Math.pow(Math.abs(radicando), 1 / indice);
  }
}

export class Bhaskara extends OperacaoBase {
  public readonly nome = "Bhaskara";
  public readonly quantidadeNumeros = 3;

  protected executar(a: number, b: number, c: number): number[] {
    if (a === 0) {
      throw new Error('O coeficiente "a" não pode ser zero.');
    }

    const delta = b ** 2 - 4 * a * c;

    if (delta < 0) {
      throw new Error("A equação não possui raízes reais (delta negativo).");
    }

    if (delta === 0) {
      return [-b / (2 * a)];
    }

    const raizDoDelta = Math.sqrt(delta);
    return [(-b + raizDoDelta) / (2 * a), (-b - raizDoDelta) / (2 * a)];
  }
}
