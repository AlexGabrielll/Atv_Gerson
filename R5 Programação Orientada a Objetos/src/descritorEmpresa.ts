import Empresa from './empresa';

export default class Descritor {
  descrever(empresa: Empresa): void {
    console.log(`Razão social: ${empresa.razaoSocial}`);
    console.log(`Nome fantasia: ${empresa.nomeFantasia}`);
    console.log(`cnpj: ${empresa.cnpj}`);
    console.log('Endereço');
    console.log(empresa.endereco.toString());
    console.log('');
    console.log('funcionários:');

    empresa.funcionarios.forEach((funcionario) => {
      console.log(`Nome: ${funcionario.nome}`);
      console.log(`matricula: ${funcionario.matricula}`);
      console.log(`cpf: ${funcionario.cpf}`);
      console.log(funcionario.endereco.toString());
    });
  }
}
