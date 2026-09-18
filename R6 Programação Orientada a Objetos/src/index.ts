import * as readline from "node:readline/promises";
import { stdin as entrada, stdout as saida } from "node:process";
import { Calculadora } from "./calculadora";
import {
  Bhaskara,
  Divisao,
  Potenciacao,
  Radiciacao,
  Soma,
  Subtracao,
} from "./operacoes";

const calculadora = new Calculadora([
  new Soma(),
  new Subtracao(),
  new Divisao(),
  new Potenciacao(),
  new Radiciacao(),
  new Bhaskara(),
]);

const interfaceLinha = readline.createInterface({
  input: entrada,
  output: saida,
});

function mostrarMenu(): void {
  console.log("\n=== CALCULADORA POO ===");
  calculadora.listarOperacoes().forEach((operacao, indice) => {
    console.log(`${indice + 1}. ${operacao.nome}`);
  });
  console.log("0. Sair");
}

function lerNumeros(texto: string): number[] {
  const valores = texto
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number);

  if (valores.some((valor) => !Number.isFinite(valor))) {
    throw new Error("Digite apenas números separados por espaço ou vírgula.");
  }

  return valores;
}

async function executar(): Promise<void> {
  console.log("Calculadora especial - exercícios de POO");

  while (true) {
    mostrarMenu();
    const opcao = (await interfaceLinha.question("Escolha uma operação: ")).trim();

    if (opcao === "0") {
      console.log("Até mais!");
      return;
    }

    try {
      const operacao = calculadora.obterOperacao(opcao);
      console.log(
        `Digite ${operacao.quantidadeNumeros} número(s), separados por espaço ou vírgula.`,
      );
      const numeros = lerNumeros(await interfaceLinha.question("> "));
      const resultado = operacao.calcular(...numeros);

      if (Array.isArray(resultado)) {
        console.log(
          resultado.length === 1
            ? `Raiz: ${resultado[0]}`
            : `Raízes: x1 = ${resultado[0]}, x2 = ${resultado[1]}`,
        );
      } else {
        console.log(`Resultado: ${resultado}`);
      }
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Erro inesperado.";
      console.log(`Erro: ${mensagem}`);
    }
  }
}

executar()
  .catch((erro: unknown) => {
    const mensagem = erro instanceof Error ? erro.message : "Erro inesperado.";
    console.error(mensagem);
    process.exitCode = 1;
  })
  .finally(() => interfaceLinha.close());
