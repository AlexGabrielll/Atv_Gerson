import { Cliente, Empresa, Endereco, Telefone } from "./cadastro.js";

const empresa = new Empresa("ABC LTDA", "Mercado Online", "12.345.678/0001-90", new Endereco("SP", "Sao Jose dos Campos", "Av Andromeda", 1000));
empresa.adicionarTelefone(new Telefone("12", "99999-0000"));
empresa.adicionarTelefone(new Telefone("12", "98888-0000"));

const dadosClientes = [
  ["Joao", "111.111.111-11", "Av Andromeda", 987, "99999-9999"],
  ["Gabriel", "222.222.222-22", "Av Andromeda", 412, "88888-8888"],
  ["Barbara", "333.333.333-33", "Av Sao Joao", 789, "77777-7777"],
  ["Marcia", "444.444.444-44", "Av Andromeda", 452, "66666-6666"],
  ["Carlos", "555.555.555-55", "Rua das Flores", 120, "95555-5555"],
] as const;

for (const [nome, cpf, rua, numero, telefone] of dadosClientes) {
  const cliente = new Cliente(nome, cpf, new Endereco("SP", "Sao Jose dos Campos", rua, numero));
  cliente.adicionarTelefone(new Telefone("12", telefone));
  cliente.adicionarTelefone(new Telefone("12", telefone));
  empresa.adicionarCliente(cliente);
}

console.log(empresa.detalhe());
