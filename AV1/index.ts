import readline from 'node:readline';
import { GreencodeApp } from './app.js';
import { GreencodeCli } from './cli.js';

const app = new GreencodeApp();
const cli = new GreencodeCli(app);

function printResult(message: string): void {
  console.log(message);
}

if (process.argv.length > 2) {
  const command = process.argv.slice(2).join(' ');
  const result = cli.handle(command);
  printResult(result.message);
  process.exit(result.ok ? 0 : 1);
}

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

console.log('greencode CLI');
console.log('Digite "help" para conhecer os comandos.');

terminal.on('line', (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) {
    return;
  }

  const result = cli.handle(trimmed);
  console.log(result.message);

  if (result.level === 'error' || result.level === 'warning') {
    process.stdout.write('> ');
    return;
  }

  process.stdout.write('> ');
});

process.stdout.write('> ');
