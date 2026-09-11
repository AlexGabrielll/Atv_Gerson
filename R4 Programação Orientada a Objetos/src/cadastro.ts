function formatar(valor: string | number, maiusculo: boolean): string {
  const texto = String(valor);
  return maiusculo ? texto.toUpperCase() : texto.toLowerCase();
}

export class Telefone {
  constructor(public ddd: string, public numero: string) {}

  getDddMaiusculo(): string { return formatar(this.ddd, true); }
  getDddMinusculo(): string { return formatar(this.ddd, false); }
  getNumeroMaiusculo(): string { return formatar(this.numero, true); }
  getNumeroMinusculo(): string { return formatar(this.numero, false); }
  detalhe(): string { return `ddd: ${this.ddd} numero: ${this.numero}`; }
}

export class Endereco {
  constructor(public estado: string, public cidade: string, public rua: string, public numero: number) {}

  getEstadoMaiusculo(): string { return formatar(this.estado, true); }
  getEstadoMinusculo(): string { return formatar(this.estado, false); }
  getCidadeMaiusculo(): string { return formatar(this.cidade, true); }
  getCidadeMinusculo(): string { return formatar(this.cidade, false); }
  getRuaMaiusculo(): string { return formatar(this.rua, true); }
  getRuaMinusculo(): string { return formatar(this.rua, false); }
  getNumeroMaiusculo(): string { return formatar(this.numero, true); }
  getNumeroMinusculo(): string { return formatar(this.numero, false); }
  detalhe(): string { return `Estado: ${this.estado} cidade: ${this.cidade} rua: ${this.rua} numero: ${this.numero}`; }
}

export class Cliente {
  #cpf: string;
  public readonly telefones = new Set<Telefone>();

  constructor(public nome: string, cpf: string, public endereco: Endereco) { this.#cpf = cpf; }

  get cpf(): string { return this.#cpf; }
  getCpfMaiusculo(): string { return formatar(this.#cpf, true); }
  getCpfMinusculo(): string { return formatar(this.#cpf, false); }
  getNomeMaiusculo(): string { return formatar(this.nome, true); }
  getNomeMinusculo(): string { return formatar(this.nome, false); }
  adicionarTelefone(telefone: Telefone): void { this.telefones.add(telefone); }
  removerTelefone(telefone: Telefone): boolean { return this.telefones.delete(telefone); }

  detalhe(): string {
    return [`Nome: ${this.nome}`, this.endereco.detalhe(), ...[...this.telefones].map((telefone) => telefone.detalhe())].join("\n");
  }
}

export class Empresa {
  #cnpj: string;
  public readonly clientes = new Set<Cliente>();
  public readonly telefones = new Set<Telefone>();

  constructor(public razaoSocial: string, public nomeFantasia: string, cnpj: string, public endereco: Endereco) { this.#cnpj = cnpj; }

  get cnpj(): string { return this.#cnpj; }
  getCnpjMaiusculo(): string { return formatar(this.#cnpj, true); }
  getCnpjMinusculo(): string { return formatar(this.#cnpj, false); }
  getRazaoSocialMaiusculo(): string { return formatar(this.razaoSocial, true); }
  getRazaoSocialMinusculo(): string { return formatar(this.razaoSocial, false); }
  getNomeFantasiaMaiusculo(): string { return formatar(this.nomeFantasia, true); }
  getNomeFantasiaMinusculo(): string { return formatar(this.nomeFantasia, false); }
  adicionarCliente(cliente: Cliente): void { this.clientes.add(cliente); }
  removerCliente(cliente: Cliente): boolean { return this.clientes.delete(cliente); }
  adicionarTelefone(telefone: Telefone): void { this.telefones.add(telefone); }
  removerTelefone(telefone: Telefone): boolean { return this.telefones.delete(telefone); }

  detalhe(): string {
    return [`Razao Social: ${this.razaoSocial}`, `Nome Fantasia: ${this.nomeFantasia}`, "-----------------", ...[...this.clientes].flatMap((cliente) => [cliente.detalhe(), ""])].join("\n").trimEnd();
  }
}
