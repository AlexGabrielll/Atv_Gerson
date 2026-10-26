export type EstadoEquipamento =
  | 'RECEBIDO'
  | 'EM_TRIAGEM'
  | 'EM_REPARO'
  | 'RECICLADO'
  | 'DESCARTADO';

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