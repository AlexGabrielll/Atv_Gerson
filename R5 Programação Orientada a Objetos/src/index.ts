import Descritor from './descritorEmpresa';
import Empresa from './empresa';
import Endereco from './endereco';
import Funcionario from './funcionario';
import Telefone from './telefone';

const endereco = new Endereco(123, 'Av. Paulista', 'Jardim Paulista', 'São Paulo');
const telefone = new Telefone('011', '9-9999-9999');
const funcionario = new Funcionario(
  'Tony Stark',
  '123456789',
  '999.999.999-99',
  endereco,
  telefone,
);

const empresa = new Empresa(
  [funcionario],
  endereco,
  'ABC LTDA',
  'Mercado online',
  '999-999-999-999-99',
  [telefone],
);

new Descritor().descrever(empresa);
