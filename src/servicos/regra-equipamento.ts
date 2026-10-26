export const estadosEquipamento = [
  'RECEBIDO',
  'EM_TRIAGEM',
  'EM_REPARO',
  'RECICLADO',
  'DESCARTADO'
] as const;

export type EstadoEquipamento = (typeof estadosEquipamento)[number];

export const papeisUsuario = ['ADMIN', 'OPERADOR'] as const;
export type PapelUsuario = (typeof papeisUsuario)[number];

export function ehEstadoEquipamento(estado: string): estado is EstadoEquipamento {
  return estadosEquipamento.includes(estado as EstadoEquipamento);
}

const proximosEstados: Record<EstadoEquipamento, EstadoEquipamento[]> = {
  RECEBIDO: ['EM_TRIAGEM'],
  EM_TRIAGEM: ['EM_REPARO', 'RECICLADO', 'DESCARTADO'],
  EM_REPARO: ['RECICLADO', 'DESCARTADO'],
  RECICLADO: [],
  DESCARTADO: []
};

export function podeMudarEstado(atual: EstadoEquipamento, proximo: EstadoEquipamento) {
  return proximosEstados[atual].includes(proximo);
}