import { randomUUID } from 'node:crypto';
import { hashPassword, isValidCnpj } from './security.js';
import {
  appendJournalEntry,
  ensureDataDirectory,
  initializeStateIfNeeded,
  readJournalEntries,
  readJsonEncrypted,
  readJsonFile,
  writeJsonAtomic,
  writeJsonFile
} from './storage.js';
import type {
  AppState,
  BatchRecord,
  CommandResult,
  EquipmentRecord,
  EquipmentStatus,
  JournalEntry,
  MovementRecord,
  OrganizationRecord,
  Role,
  SessionInfo,
  UserRecord
} from './types.js';

const SESSION_TTL_MS = 30 * 60 * 1000;
const PHYSICAL_LEVELS: Record<string, number> = {
  novo: 0,
  bom: 1,
  regular: 2,
  danificado: 3,
  quebrado: 4
};

export class GreencodeApp {
  private state: AppState = initializeStateIfNeeded();
  private masterKey = '';
  private session: SessionInfo | null = null;

  constructor() {
    ensureDataDirectory();
    this.loadPersistedState();
  }

  getSession(): SessionInfo | null {
    return this.session;
  }

  isProvisioned(): boolean {
    return Boolean(this.masterKey && this.state.config.firstAdmin);
  }

  getState(): AppState {
    return this.state;
  }

  provision(adminUsername: string, password: string): CommandResult {
    if (this.isProvisioned()) {
      return { ok: false, level: 'warning', message: 'O sistema já foi provisionado.' };
    }

    this.masterKey = randomUUID().replace(/-/g, '');
    this.state.config = {
      masterKey: this.masterKey,
      createdAt: new Date().toISOString(),
      firstAdmin: adminUsername
    };

    const salt = randomUUID().replace(/-/g, '').slice(0, 16);
    const user: UserRecord = {
      id: randomUUID(),
      username: adminUsername,
      passwordHash: hashPassword(password, salt),
      salt,
      role: 'admin',
      createdAt: new Date().toISOString(),
      active: true
    };

    this.state.users = [user];
    this.saveAll();
    this.logAction('provisionamento', { username: adminUsername, role: 'admin' });
    return {
      ok: true,
      level: 'success',
      message: `Sistema provisionado. Usuário administrador '${adminUsername}' criado.`
    };
  }

  login(username: string, password: string): CommandResult {
    if (!this.isProvisioned()) {
      return { ok: false, level: 'error', message: 'O sistema ainda não foi provisionado.' };
    }

    const user = this.state.users.find((entry) => entry.username === username && entry.active);
    if (!user) {
      return { ok: false, level: 'error', message: 'Credenciais inválidas.' };
    }

    const candidateHash = hashPassword(password, user.salt);
    if (candidateHash !== user.passwordHash) {
      return { ok: false, level: 'error', message: 'Credenciais inválidas.' };
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    this.session = {
      username: user.username,
      role: user.role,
      loginAt: new Date().toISOString(),
      expiresAt
    };

    this.logAction('login', { username: user.username, role: user.role });
    return {
      ok: true,
      level: 'success',
      message: `Login realizado para ${user.username} (${user.role}).`
    };
  }

  logout(): CommandResult {
    if (!this.session) {
      return { ok: false, level: 'warning', message: 'Nenhuma sessão ativa.' };
    }

    const username = this.session.username;
    this.session = null;
    this.logAction('logout', { username });
    return { ok: true, level: 'info', message: `Sessão encerrada para ${username}.` };
  }

  ensureAuthenticated(): CommandResult | null {
    if (!this.session) {
      return { ok: false, level: 'error', message: 'É necessário autenticar-se primeiro.' };
    }

    if (new Date(this.session.expiresAt).getTime() < Date.now()) {
      this.session = null;
      return { ok: false, level: 'warning', message: 'Sessão expirada. Faça login novamente.' };
    }

    return null;
  }

  requirePermission(role: Role): CommandResult | null {
    const auth = this.ensureAuthenticated();
    if (auth) {
      return auth;
    }

    if (!this.session || (this.session.role !== role && this.session.role !== 'admin')) {
      return { ok: false, level: 'error', message: 'Permissão insuficiente para esta operação.' };
    }

    return null;
  }

  createUser(username: string, password: string, role: Role): CommandResult {
    const permission = this.requirePermission('admin');
    if (permission) {
      return permission;
    }

    if (!/^[a-zA-Z0-9._-]{3,}$/.test(username)) {
      return { ok: false, level: 'error', message: 'Nome de usuário inválido.' };
    }

    if (this.state.users.some((user) => user.username === username)) {
      return { ok: false, level: 'error', message: 'Usuário já existe.' };
    }

    const salt = randomUUID().replace(/-/g, '').slice(0, 16);
    const user: UserRecord = {
      id: randomUUID(),
      username,
      passwordHash: hashPassword(password, salt),
      salt,
      role,
      createdAt: new Date().toISOString(),
      active: true
    };

    this.state.users.push(user);
    this.saveAll();
    this.logAction('usuario_criado', { username, role });
    return { ok: true, level: 'success', message: `Usuário '${username}' criado com perfil ${role}.` };
  }

  listUsers(): CommandResult {
    const permission = this.requirePermission('admin');
    if (permission) {
      return permission;
    }

    const rows = this.state.users.map((user) => `${user.username} | ${user.role} | ${user.active ? 'ativo' : 'inativo'}`).join('\n');
    return { ok: true, level: 'info', message: rows || 'Nenhum usuário cadastrado.' };
  }

  createOrganization(id: string, name: string, cnpj: string, email: string): CommandResult {
    const permission = this.requirePermission('operator');
    if (permission) {
      return permission;
    }

    if (!isValidCnpj(cnpj)) {
      return { ok: false, level: 'error', message: 'CNPJ inválido.' };
    }

    if (this.state.organizations.some((organization) => organization.id === id || organization.cnpj === cnpj.replace(/\D/g, ''))) {
      return { ok: false, level: 'error', message: 'Organização ou CNPJ já cadastrados.' };
    }

    const organization: OrganizationRecord = {
      id,
      name,
      cnpj: cnpj.replace(/\D/g, ''),
      email,
      createdAt: new Date().toISOString()
    };

    this.state.organizations.push(organization);
    this.saveAll();
    this.logAction('organizacao_criada', { id, name, cnpj: organization.cnpj });
    return { ok: true, level: 'success', message: `Organização '${name}' cadastrada com sucesso.` };
  }

  listOrganizations(): CommandResult {
    const permission = this.requirePermission('operator');
    if (permission) {
      return permission;
    }

    const rows = this.state.organizations.map((organization) => `${organization.id} | ${organization.name} | ${organization.cnpj}`).join('\n');
    return { ok: true, level: 'info', message: rows || 'Nenhuma organização cadastrada.' };
  }

  createBatch(orgId: string, invoiceNumber: string, transporter: string, entryDateISO?: string): CommandResult {
    const permission = this.requirePermission('operator');
    if (permission) {
      return permission;
    }

    if (!this.state.organizations.some((organization) => organization.id === orgId)) {
      return { ok: false, level: 'error', message: `Organização '${orgId}' não encontrada.` };
    }

    const baseDate = entryDateISO ? new Date(entryDateISO) : new Date();
    const today = new Date();
    const diffDays = (today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);

    if (Number.isNaN(baseDate.getTime()) || baseDate > today || diffDays > 90) {
      return { ok: false, level: 'error', message: 'Data de entrada inválida. Deve estar entre hoje e 90 dias atrás.' };
    }

    const batch: BatchRecord = {
      id: `LOT-${randomUUID().slice(0, 8).toUpperCase()}`,
      organizationId: orgId,
      invoiceNumber,
      transporter,
      entryDate: baseDate.toISOString(),
      createdAt: new Date().toISOString(),
      status: 'aberto'
    };

    this.state.batches.push(batch);
    this.saveAll();
    this.logAction('lote_criado', { id: batch.id, orgId, invoiceNumber, transporter });
    return { ok: true, level: 'success', message: `Lote '${batch.id}' criado para a organização ${orgId}.` };
  }

  listBatches(): CommandResult {
    const permission = this.requirePermission('operator');
    if (permission) {
      return permission;
    }

    const rows = this.state.batches.map((batch) => `${batch.id} | ${batch.organizationId} | ${batch.invoiceNumber} | ${batch.status}`).join('\n');
    return { ok: true, level: 'info', message: rows || 'Nenhum lote cadastrado.' };
  }

  createEquipment(batchId: string, type: string, serialNumber: string, status: EquipmentStatus, physicalState: string): CommandResult {
    const permission = this.requirePermission('almoxarifado');
    if (permission) {
      return permission;
    }

    if (!this.state.batches.some((batch) => batch.id === batchId)) {
      return { ok: false, level: 'error', message: `Lote '${batchId}' não encontrado.` };
    }

    if (!this.state.equipment.every((equipment) => equipment.serialNumber !== serialNumber)) {
      return { ok: false, level: 'error', message: `Número de série '${serialNumber}' já cadastrado.` };
    }

    const equipment: EquipmentRecord = {
      id: `EQ-${randomUUID().slice(0, 8).toUpperCase()}`,
      batchId,
      type,
      serialNumber,
      status,
      physicalState,
      triageCompleted: false,
      createdAt: new Date().toISOString()
    };

    this.state.equipment.push(equipment);
    this.saveAll();
    this.logAction('equipamento_criado', { id: equipment.id, batchId, type, serialNumber, status });
    return { ok: true, level: 'success', message: `Equipamento '${equipment.id}' cadastrado.` };
  }

  completeTriage(equipmentId: string): CommandResult {
    const permission = this.requirePermission('almoxarifado');
    if (permission) {
      return permission;
    }

    const equipment = this.state.equipment.find((entry) => entry.id === equipmentId);
    if (!equipment) {
      return { ok: false, level: 'error', message: `Equipamento '${equipmentId}' não encontrado.` };
    }

    equipment.triageCompleted = true;
    equipment.status = 'triado';
    this.saveAll();
    this.logAction('triagem_concluida', { equipmentId, triageCompleted: true });
    return { ok: true, level: 'success', message: `Triagem concluída para o equipamento ${equipmentId}.` };
  }

  updatePhysicalState(equipmentId: string, physicalState: string, justification?: string): CommandResult {
    const permission = this.requirePermission('almoxarifado');
    if (permission) {
      return permission;
    }

    const equipment = this.state.equipment.find((entry) => entry.id === equipmentId);
    if (!equipment) {
      return { ok: false, level: 'error', message: `Equipamento '${equipmentId}' não encontrado.` };
    }

    const previousState = equipment.physicalState;
    const previousRank = PHYSICAL_LEVELS[previousState] ?? 0;
    const nextRank = PHYSICAL_LEVELS[physicalState] ?? 0;
    const delta = nextRank - previousRank;

    if (delta >= 2 && !justification?.trim()) {
      return { ok: false, level: 'error', message: 'Justificativa obrigatória quando o estado físico cai em duas categorias ou mais.' };
    }

    equipment.physicalState = physicalState;
    this.saveAll();
    this.logAction('estado_fisico_alterado', { equipmentId, from: previousState, to: physicalState, justification });
    return { ok: true, level: 'success', message: `Estado físico do equipamento ${equipmentId} atualizado para ${physicalState}.` };
  }

  moveEquipment(equipmentId: string, newStatus: EquipmentStatus, justification?: string): CommandResult {
    const permission = this.requirePermission('almoxarifado');
    if (permission) {
      return permission;
    }

    const equipment = this.state.equipment.find((entry) => entry.id === equipmentId);
    if (!equipment) {
      return { ok: false, level: 'error', message: `Equipamento '${equipmentId}' não encontrado.` };
    }

    if (newStatus === 'desmontagem' && !equipment.triageCompleted) {
      return { ok: false, level: 'error', message: 'Equipamento deve passar por triagem completa antes do desmonte.' };
    }

    const movement: MovementRecord = {
      id: `MOV-${randomUUID().slice(0, 8).toUpperCase()}`,
      equipmentId,
      fromStatus: equipment.status,
      toStatus: newStatus,
      occurredAt: new Date().toISOString(),
      actor: this.session?.username ?? 'system',
      justification
    };

    equipment.status = newStatus;
    this.state.movements.push(movement);
    this.saveAll();
    this.logAction('movimentacao', { equipmentId, fromStatus: movement.fromStatus, toStatus: newStatus, justification });
    return { ok: true, level: 'success', message: `Equipamento ${equipmentId} movido para ${newStatus}.` };
  }

  traceEquipment(equipmentId: string): CommandResult {
    const permission = this.requirePermission('auditor');
    if (permission) {
      return permission;
    }

    const equipment = this.state.equipment.find((entry) => entry.id === equipmentId);
    if (!equipment) {
      return { ok: false, level: 'error', message: `Equipamento '${equipmentId}' não encontrado.` };
    }

    const movements = this.state.movements.filter((movement) => movement.equipmentId === equipmentId);
    const report = [`Equipamento: ${equipment.id}`, `Tipo: ${equipment.type}`, `Serial: ${equipment.serialNumber}`, `Status: ${equipment.status}`, `Estado físico: ${equipment.physicalState}`, `Triagem: ${equipment.triageCompleted ? 'concluída' : 'pendente'}`];

    if (movements.length === 0) {
      report.push('Sem movimentações registradas.');
    } else {
      report.push('Movimentações:');
      movements.forEach((movement) => report.push(`- ${movement.occurredAt} | ${movement.fromStatus} -> ${movement.toStatus} | ${movement.actor}${movement.justification ? ` | ${movement.justification}` : ''}`));
    }

    return { ok: true, level: 'info', message: report.join('\n') };
  }

  listAudit(): CommandResult {
    const permission = this.requirePermission('auditor');
    if (permission) {
      return permission;
    }

    const journal = readJournalEntries(this.masterKey);
    const output = journal.slice(-20).map((entry) => `${entry.timestamp} | ${entry.actor} | ${entry.action} | ${JSON.stringify(entry.payload)}`).join('\n');
    return { ok: true, level: 'info', message: output || 'Nenhum registro de auditoria.' };
  }

  private saveAll(): void {
    writeJsonFile('config.json', this.state.config);
    writeJsonAtomic('users.json.enc', this.state.users, this.masterKey);
    writeJsonAtomic('organizations.json.enc', this.state.organizations, this.masterKey);
    writeJsonAtomic('batches.json.enc', this.state.batches, this.masterKey);
    writeJsonAtomic('equipment.json.enc', this.state.equipment, this.masterKey);
    writeJsonAtomic('movements.json.enc', this.state.movements, this.masterKey);
  }

  private logAction(action: string, payload: Record<string, unknown>): void {
    const entry: JournalEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      actor: this.session?.username ?? 'system',
      action,
      payload
    };

    this.state.journal.push(entry);
    appendJournalEntry(entry, this.masterKey);
  }

  private loadPersistedState(): void {
    const config = readJsonFile<AppState['config']>('config.json');
    if (!config) {
      return;
    }

    this.masterKey = config.masterKey || this.masterKey;
    const users = readJsonEncrypted<UserRecord[]>('users.json.enc', this.masterKey) ?? [];
    const organizations = readJsonEncrypted<OrganizationRecord[]>('organizations.json.enc', this.masterKey) ?? [];
    const batches = readJsonEncrypted<BatchRecord[]>('batches.json.enc', this.masterKey) ?? [];
    const equipment = readJsonEncrypted<EquipmentRecord[]>('equipment.json.enc', this.masterKey) ?? [];
    const movements = readJsonEncrypted<MovementRecord[]>('movements.json.enc', this.masterKey) ?? [];

    this.state = {
      config,
      users,
      organizations,
      batches,
      equipment,
      movements,
      journal: readJournalEntries(this.masterKey)
    };
  }
}
