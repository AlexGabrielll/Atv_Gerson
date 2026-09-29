import { GreencodeApp } from './app.js';
import type { CommandResult, Role } from './types.js';

export class GreencodeCli {
  constructor(private readonly app: GreencodeApp) {}

  handle(input: string): CommandResult {
    const tokens = this.parseTokens(input);
    if (tokens.length === 0) {
      return { ok: false, level: 'error', message: 'Comando vazio.' };
    }

    const [command, ...rest] = tokens;
    const positional = rest.filter((token) => !token.startsWith('--'));
    const options = this.parseOptions(rest);

    switch (command.toLowerCase()) {
      case 'help':
      case 'ajuda':
        return { ok: true, level: 'info', message: this.helpText() };
      case 'provision':
      case 'provisionar':
        return this.app.provision(positional[0] ?? '', positional[1] ?? '');
      case 'login':
        return this.app.login(positional[0] ?? '', positional[1] ?? '');
      case 'logout':
      case 'sair':
        return this.app.logout();
      case 'usuario':
      case 'user':
        return this.handleUserCommand(positional, options);
      case 'organizacao':
      case 'org':
      case 'empresa':
        return this.handleOrganizationCommand(positional, options);
      case 'lote':
      case 'batch':
        return this.handleBatchCommand(positional, options);
      case 'equipamento':
      case 'equipment':
        return this.handleEquipmentCommand(positional, options);
      case 'triagem':
        return this.app.completeTriage(positional[0] ?? '');
      case 'movimentar':
      case 'move':
        return this.app.moveEquipment(positional[0] ?? '', this.normalizeStatus(positional[1] ?? ''), options.justificativa ?? options.justification);
      case 'estado':
      case 'physical':
        return this.app.updatePhysicalState(positional[0] ?? '', this.normalizePhysical(positional[1] ?? ''), options.justificativa ?? options.justification);
      case 'rastrear':
      case 'trace':
        return this.app.traceEquipment(positional[0] ?? '');
      case 'auditoria':
      case 'audit':
      case 'log':
        return this.app.listAudit();
      case 'listar':
      case 'list':
        return this.handleListCommand(positional);
      default:
        return { ok: false, level: 'error', message: `Comando desconhecido: ${command}.` };
    }
  }

  private handleUserCommand(positional: string[], options: Record<string, string>): CommandResult {
    const action = positional[0] ?? '';
    if (action === 'criar' || action === 'create') {
      const username = positional[1] ?? '';
      const password = positional[2] ?? '';
      const role = this.normalizeRole(positional[3] ?? options.role ?? 'admin');
      return this.app.createUser(username, password, role);
    }

    if (action === 'listar' || action === 'list') {
      return this.app.listUsers();
    }

    return { ok: false, level: 'error', message: 'Uso: usuario criar <usuario> <senha> <perfil> | usuario listar' };
  }

  private handleOrganizationCommand(positional: string[], options: Record<string, string>): CommandResult {
    const action = positional[0] ?? '';
    if (action === 'criar' || action === 'create') {
      const id = positional[1] ?? options.id ?? '';
      const name = positional[2] ?? options.name ?? '';
      const cnpj = positional[3] ?? options.cnpj ?? '';
      const email = positional[4] ?? options.email ?? '';
      return this.app.createOrganization(id, name, cnpj, email);
    }

    if (action === 'listar' || action === 'list') {
      return this.app.listOrganizations();
    }

    return { ok: false, level: 'error', message: 'Uso: organizacao criar <id> <nome> <cnpj> <email> | organizacao listar' };
  }

  private handleBatchCommand(positional: string[], options: Record<string, string>): CommandResult {
    const action = positional[0] ?? '';
    if (action === 'criar' || action === 'create') {
      const orgId = options.org ?? positional[1] ?? '';
      const invoiceNumber = options.nf ?? positional[2] ?? '';
      const transporter = options.transp ?? positional[3] ?? '';
      const date = options.date ?? positional[4] ?? undefined;
      return this.app.createBatch(orgId, invoiceNumber, transporter, date);
    }

    if (action === 'listar' || action === 'list') {
      return this.app.listBatches();
    }

    return { ok: false, level: 'error', message: 'Uso: lote criar --org <id> --nf <numero> --transp <nome> --date <yyyy-mm-dd> | lote listar' };
  }

  private handleEquipmentCommand(positional: string[], options: Record<string, string>): CommandResult {
    const action = positional[0] ?? '';
    if (action === 'criar' || action === 'create') {
      const batchId = options.lote ?? positional[1] ?? '';
      const type = options.tipo ?? positional[2] ?? '';
      const serial = options.serial ?? positional[3] ?? '';
      const status = this.normalizeStatus(options.status ?? positional[4] ?? 'recebido');
      const physicalState = this.normalizePhysical(options.fisico ?? positional[5] ?? 'novo');
      return this.app.createEquipment(batchId, type, serial, status, physicalState);
    }

    if (action === 'listar' || action === 'list') {
      return this.app.traceEquipment(positional[1] ?? '');
    }

    return { ok: false, level: 'error', message: 'Uso: equipamento criar --lote <id> --tipo <tipo> --serial <serial> --status <status> --fisico <estado> | equipamento listar' };
  }

  private handleListCommand(positional: string[]): CommandResult {
    const subject = positional[0] ?? '';
    switch (subject) {
      case 'usuarios':
      case 'users':
        return this.app.listUsers();
      case 'organizacoes':
      case 'orgs':
        return this.app.listOrganizations();
      case 'lotes':
      case 'batches':
        return this.app.listBatches();
      case 'audit':
      case 'auditoria':
      case 'logs':
        return this.app.listAudit();
      default:
        return { ok: false, level: 'error', message: 'Lista não suportada. Use: usuarios, organizacoes, lotes, audit.' };
    }
  }

  private parseOptions(tokens: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (!token.startsWith('--')) {
        continue;
      }

      const key = token.slice(2);
      const value = tokens[index + 1] && !tokens[index + 1].startsWith('--') ? tokens[index + 1] : '';
      result[key] = value;
      if (value) {
        index += 1;
      }
    }
    return result;
  }

  private parseTokens(input: string): string[] {
    const regex = /"[^"]*"|'[^']*'|\S+/g;
    const matches = input.match(regex) ?? [];
    return matches.map((token) => token.replace(/^['"]|['"]$/g, ''));
  }

  private normalizeRole(role: string): Role {
    const normalized = role.toLowerCase();
    if (normalized === 'admin' || normalized === 'adm') return 'admin';
    if (normalized === 'operator' || normalized === 'operador' || normalized === 'op') return 'operator';
    if (normalized === 'almoxarifado' || normalized === 'almox' || normalized === 'warehouse') return 'almoxarifado';
    if (normalized === 'auditor' || normalized === 'aud') return 'auditor';
    return 'operator';
  }

  private normalizeStatus(status: string): any {
    const normalized = status.toLowerCase();
    if (normalized === 'recebido' || normalized === 'received') return 'recebido';
    if (normalized === 'triado' || normalized === 'triage') return 'triado';
    if (normalized === 'desmontagem' || normalized === 'dismantle') return 'desmontagem';
    if (normalized === 'reuso' || normalized === 'reuse') return 'reuso';
    if (normalized === 'reciclagem' || normalized === 'recycle') return 'reciclagem';
    if (normalized === 'descartado' || normalized === 'discarded') return 'descartado';
    return 'recebido';
  }

  private normalizePhysical(state: string): string {
    const normalized = state.toLowerCase();
    if (normalized === 'novo' || normalized === 'new') return 'novo';
    if (normalized === 'bom' || normalized === 'good') return 'bom';
    if (normalized === 'regular' || normalized === 'standard') return 'regular';
    if (normalized === 'danificado' || normalized === 'damaged') return 'danificado';
    if (normalized === 'quebrado' || normalized === 'broken') return 'quebrado';
    return 'novo';
  }

  private helpText(): string {
    return [
      'greencode CLI',
      'provisionar <usuario> <senha>',
      'login <usuario> <senha>',
      'logout',
      'usuario criar <usuario> <senha> <perfil>',
      'usuario listar',
      'organizacao criar <id> <nome> <cnpj> <email>',
      'organizacao listar',
      'lote criar --org <id> --nf <numero> --transp <nome> --date <yyyy-mm-dd>',
      'lote listar',
      'equipamento criar --lote <id> --tipo <tipo> --serial <serial> --status <status> --fisico <estado>',
      'triagem <id>',
      'movimentar <id> <status> [--justificativa "texto"]',
      'estado <id> <estado> [--justificativa "texto"]',
      'rastrear <id>',
      'auditoria',
      'help'
    ].join('\n');
  }
}
