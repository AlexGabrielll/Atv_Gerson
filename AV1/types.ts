export type Role = 'admin' | 'operator' | 'almoxarifado' | 'auditor';
export type LogLevel = 'info' | 'success' | 'warning' | 'error';
export type EquipmentStatus =
  | 'recebido'
  | 'triado'
  | 'desmontagem'
  | 'reuso'
  | 'reciclagem'
  | 'descartado';

export interface ConfigState {
  masterKey: string;
  createdAt: string;
  firstAdmin: string;
}

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: Role;
  createdAt: string;
  active: boolean;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  createdAt: string;
}

export interface BatchRecord {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  transporter: string;
  entryDate: string;
  createdAt: string;
  status: 'aberto' | 'recebido' | 'triado';
}

export interface EquipmentRecord {
  id: string;
  batchId: string;
  type: string;
  serialNumber: string;
  status: EquipmentStatus;
  physicalState: string;
  triageCompleted: boolean;
  createdAt: string;
}

export interface MovementRecord {
  id: string;
  equipmentId: string;
  fromStatus: EquipmentStatus | 'novo';
  toStatus: EquipmentStatus;
  occurredAt: string;
  actor: string;
  justification?: string;
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  payload: Record<string, unknown>;
}

export interface AppState {
  config: ConfigState;
  users: UserRecord[];
  organizations: OrganizationRecord[];
  batches: BatchRecord[];
  equipment: EquipmentRecord[];
  movements: MovementRecord[];
  journal: JournalEntry[];
}

export interface SessionInfo {
  username: string;
  role: Role;
  loginAt: string;
  expiresAt: string;
}

export interface CommandResult {
  ok: boolean;
  message: string;
  level: LogLevel;
}
