import { Cliente } from './Cliente';
import { Empresa } from './Empresa';
import { Endereco } from './Endereco';
import { Telefone } from './Telefone';

const empresa = new Empresa('12.345.678/0001-90', 'ABC LTDA', 'Mercado Online');
empresa.setEndereco(new Endereco('SP', 'Sao Jose dos Campos', 'Av Andromeda', '987'));
empresa.adicionarTelefone(new Telefone('99999999', '99999999'));
empresa.adicionarTelefone(new Telefone('99999999', '99999999'));

const dadosClientes = [
  ['111.111.111-11', 'Joao', 'SP', 'Sao Jose dos Campos', 'Av Andromeda', '987', '99999999'],
  ['222.222.222-22', 'Gabriel', 'SP', 'Sao Jose dos Campos', 'Av Andromeda', '412', '88888888'],
  ['333.333.333-33', 'Barbara', 'SP', 'Sao Jose dos Campos', 'Av Sao Joao', '789', '77777777'],
  ['444.444.444-44', 'Marcia', 'SP', 'Sao Jose dos Campos', 'Av Andromeda', '452', '66666666'],
  ['555.555.555-55', 'Carlos', 'SP', 'Sao Jose dos Campos', 'Rua Central', '123', '55555555'],
] as const;

for (const [cpf, nome, estado, cidade, rua, numero, telefone] of dadosClientes) {
  const cliente = new Cliente(cpf, nome);
  cliente.setEndereco(new Endereco(estado, cidade, rua, numero));
  cliente.adicionarTelefone(new Telefone(telefone, telefone));
  cliente.adicionarTelefone(new Telefone(telefone, telefone));
  empresa.adicionarCliente(cliente);
}

console.log(empresa.detalhe());
