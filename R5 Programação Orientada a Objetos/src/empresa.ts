import Endereco from './endereco';
import Funcionario from './funcionario';
import Telefone from './telefone';

export default class Empresa {
  constructor(
    public funcionarios: Funcionario[],
    public endereco: Endereco,
    public razaoSocial: string,
    public nomeFantasia: string,
    public cnpj: string,
    public telefones: Telefone[] = [],
  ) {}
}
