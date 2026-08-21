interface ITelefoneCelular {
    getDdd(): string;
    setDdd(ddd: string): void;

    getNumero(): string;
    setNumero(numero: string): void;

    getDddMaiusculo(): string;
    getDddMinusculo(): string;

    getNumeroMaiusculo(): string;
    getNumeroMinusculo(): string;
}

interface IEndereco {
    getEstado(): string;
    setEstado(estado: string): void;

    getCidade(): string;
    setCidade(cidade: string): void;

    getRua(): string;
    setRua(rua: string): void;

    getNumero(): string;
    setNumero(numero: string): void;

    getEstadoMaiusculo(): string;
    getEstadoMinusculo(): string;

    getCidadeMaiusculo(): string;
    getCidadeMinusculo(): string;

    getRuaMaiusculo(): string;
    getRuaMinusculo(): string;

    getNumeroMaiusculo(): string;
    getNumeroMinusculo(): string;
}

interface ICliente {
    getNome(): string;
    setNome(nome: string): void;

    getTelefone(): ITelefoneCelular;
    setTelefone(telefone: ITelefoneCelular): void;

    getEmail(): string;
    setEmail(email: string): void;

    getEndereco(): IEndereco;
    setEndereco(endereco: IEndereco): void;

    getNomeMaiusculo(): string;
    getNomeMinusculo(): string;

    getEmailMaiusculo(): string;
    getEmailMinusculo(): string;

    readonly descricao: string;
}

function validarTexto(valor: string, nomeAtributo: string): string {
    if (typeof valor !== "string") {
        throw new Error(`${nomeAtributo} deve ser uma string.`);
    }

    const valorTratado = valor.trim();

    if (valorTratado.length === 0) {
        throw new Error(`${nomeAtributo} não pode ficar vazio.`);
    }

    return valorTratado;
}

class TelefoneCelular implements ITelefoneCelular {
    private ddd: string;
    private numero: string;

    constructor(ddd: string, numero: string) {
        this.ddd = validarTexto(ddd, "DDD");
        this.numero = validarTexto(numero, "Número");
    }

    getDdd(): string {
        return this.ddd;
    }

    setDdd(ddd: string): void {
        this.ddd = validarTexto(ddd, "DDD");
    }

    getNumero(): string {
        return this.numero;
    }

    setNumero(numero: string): void {
        this.numero = validarTexto(numero, "Número");
    }

    getDddMaiusculo(): string {
        return this.ddd.toUpperCase();
    }

    getDddMinusculo(): string {
        return this.ddd.toLowerCase();
    }

    getNumeroMaiusculo(): string {
        return this.numero.toUpperCase();
    }

    getNumeroMinusculo(): string {
        return this.numero.toLowerCase();
    }
}

class Endereco implements IEndereco {
    private estado: string;
    private cidade: string;
    private rua: string;
    private numero: string;

    constructor(estado: string, cidade: string, rua: string, numero: string) {
        this.estado = validarTexto(estado, "Estado");
        this.cidade = validarTexto(cidade, "Cidade");
        this.rua = validarTexto(rua, "Rua");
        this.numero = validarTexto(numero, "Número");
    }

    getEstado(): string {
        return this.estado;
    }

    setEstado(estado: string): void {
        this.estado = validarTexto(estado, "Estado");
    }

    getCidade(): string {
        return this.cidade;
    }

    setCidade(cidade: string): void {
        this.cidade = validarTexto(cidade, "Cidade");
    }

    getRua(): string {
        return this.rua;
    }

    setRua(rua: string): void {
        this.rua = validarTexto(rua, "Rua");
    }

    getNumero(): string {
        return this.numero;
    }

    setNumero(numero: string): void {
        this.numero = validarTexto(numero, "Número");
    }

    getEstadoMaiusculo(): string {
        return this.estado.toUpperCase();
    }

    getEstadoMinusculo(): string {
        return this.estado.toLowerCase();
    }

    getCidadeMaiusculo(): string {
        return this.cidade.toUpperCase();
    }

    getCidadeMinusculo(): string {
        return this.cidade.toLowerCase();
    }

    getRuaMaiusculo(): string {
        return this.rua.toUpperCase();
    }

    getRuaMinusculo(): string {
        return this.rua.toLowerCase();
    }

    getNumeroMaiusculo(): string {
        return this.numero.toUpperCase();
    }

    getNumeroMinusculo(): string {
        return this.numero.toLowerCase();
    }
}

class Cliente implements ICliente {
    private nome: string;
    private telefone: ITelefoneCelular;
    private email: string;
    private endereco: IEndereco;

    constructor(nome: string, telefone: ITelefoneCelular, email: string, endereco: IEndereco) {
        this.nome = validarTexto(nome, "Nome");
        this.email = validarTexto(email, "E-mail");

        if (!telefone) {
            throw new Error("Telefone é obrigatório.");
        }

        if (!endereco) {
            throw new Error("Endereço é obrigatório.");
        }

        this.telefone = telefone;
        this.endereco = endereco;
    }

    getNome(): string {
        return this.nome;
    }

    setNome(nome: string): void {
        this.nome = validarTexto(nome, "Nome");
    }

    getTelefone(): ITelefoneCelular {
        return this.telefone;
    }

    setTelefone(telefone: ITelefoneCelular): void {
        if (!telefone) {
            throw new Error("Telefone é obrigatório.");
        }
        this.telefone = telefone;
    }

    getEmail(): string {
        return this.email;
    }

    setEmail(email: string): void {
        this.email = validarTexto(email, "E-mail");
    }

    getEndereco(): IEndereco {
        return this.endereco;
    }

    setEndereco(endereco: IEndereco): void {
        if (!endereco) {
            throw new Error("Endereço é obrigatório.");
        }
        this.endereco = endereco;
    }

    getNomeMaiusculo(): string {
        return this.nome.toUpperCase();
    }

    getNomeMinusculo(): string {
        return this.nome.toLowerCase();
    }

    getEmailMaiusculo(): string {
        return this.email.toUpperCase();
    }

    getEmailMinusculo(): string {
        return this.email.toLowerCase();
    }

    get descricao(): string {
        return `
----------------------------
Informações do Cliente:
${this.nome}
----------------------------
Telefone:
DDD: ${this.telefone.getDdd()}
Número: ${this.telefone.getNumero()}
----------------------------
Endereço:
Rua: ${this.endereco.getRua()}
Número: ${this.endereco.getNumero()}
Cidade: ${this.endereco.getCidade()}
Estado: ${this.endereco.getEstado()}
----------------------------`;
    }
}

function ordenarClientesPorNome(clientes: ICliente[]): ICliente[] {
    if (!Array.isArray(clientes)) {
        throw new Error("O parâmetro clientes deve ser um Array.");
    }

    clientes.forEach((cliente, indice) => {
        if (!cliente) {
            throw new Error(`O cliente na posição ${indice} é inválido.`);
        }
    });

    return clientes.slice().sort((clienteA, clienteB) => {
        return clienteA
            .getNome()
            .localeCompare(clienteB.getNome(), "pt-BR", { sensitivity: "base" });
    });
}

const telefone = new TelefoneCelular("11", "999999999");
const endereco = new Endereco("SP", "São Paulo", "Av. Paulista", "987");
const cliente = new Cliente("Carlos Conrado Heinz", telefone, "carlos.conrado@app.com", endereco);

console.log(cliente.descricao);

console.log("\n========== TESTE DOS GETTERS ==========");
console.log("Nome:", cliente.getNome());
console.log("E-mail:", cliente.getEmail());
console.log("DDD:", cliente.getTelefone().getDdd());
console.log("Número:", cliente.getTelefone().getNumero());
console.log("Cidade:", cliente.getEndereco().getCidade());
console.log("Rua:", cliente.getEndereco().getRua());

console.log("\n========== TESTE MAIÚSCULO/MINÚSCULO ==========");
console.log("Nome maiúsculo:", cliente.getNomeMaiusculo());
console.log("Nome minúsculo:", cliente.getNomeMinusculo());
console.log("E-mail maiúsculo:", cliente.getEmailMaiusculo());
console.log("E-mail minúsculo:", cliente.getEmailMinusculo());
console.log("Cidade maiúscula:", cliente.getEndereco().getCidadeMaiusculo());
console.log("Cidade minúscula:", cliente.getEndereco().getCidadeMinusculo());
console.log("Rua maiúscula:", cliente.getEndereco().getRuaMaiusculo());
console.log("Rua minúscula:", cliente.getEndereco().getRuaMinusculo());

console.log("\n========== TESTE DOS SETTERS ==========");
cliente.setNome("João da Silva");
cliente.setEmail("joao.silva@email.com");
cliente.getTelefone().setDdd("12");
cliente.getTelefone().setNumero("988887777");
cliente.getEndereco().setEstado("SP");
cliente.getEndereco().setCidade("São José dos Campos");
cliente.getEndereco().setRua("Rua Doutor João");
cliente.getEndereco().setNumero("123");
console.log(cliente.descricao);

const telefone1 = new TelefoneCelular("11", "988887777");
const endereco1 = new Endereco("SP", "São Paulo", "Rua Augusta", "100");
const cliente1 = new Cliente("Carlos Conrado Heinz", telefone1, "carlos@email.com", endereco1);

const telefone2 = new TelefoneCelular("12", "977776666");
const endereco2 = new Endereco("SP", "São José dos Campos", "Avenida Cassiano Ricardo", "500");
const cliente2 = new Cliente("Ana Beatriz", telefone2, "ana@email.com", endereco2);

const telefone3 = new TelefoneCelular("13", "966665555");
const endereco3 = new Endereco("SP", "Santos", "Avenida Ana Costa", "300");
const cliente3 = new Cliente("Bruno Oliveira", telefone3, "bruno@email.com", endereco3);

const telefone4 = new TelefoneCelular("19", "955554444");
const endereco4 = new Endereco("SP", "Campinas", "Rua Barão Geraldo", "200");
const cliente4 = new Cliente("Daniel Souza", telefone4, "daniel@email.com", endereco4);

const clientes: ICliente[] = [cliente1, cliente2, cliente3, cliente4];

console.log("\n========== CLIENTES ORIGINAIS ==========");
clientes.forEach((clienteAtual) => {
    console.log(clienteAtual.getNome());
});

const clientesOrdenados = ordenarClientesPorNome(clientes);

console.log("\n========== CLIENTES ORDENADOS ==========");
clientesOrdenados.forEach((clienteAtual) => {
    console.log(clienteAtual.getNome());
});

console.log("\n========== ARRAY ORIGINAL APÓS ORDENAÇÃO ==========");
clientes.forEach((clienteAtual) => {
    console.log(clienteAtual.getNome());
});
