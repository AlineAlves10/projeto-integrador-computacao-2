import { DataHoraIso } from './comum.model';

export type TipoHorario = 'ALIMENTACAO' | 'SONO' | 'MEDICAMENTO' | 'BANHO' | 'CONSULTA' | 'VACINA' | 'OUTRO';
export type StatusHorario = 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO';

/** HorarioPrevistoResponse */
export interface HorarioPrevisto {
  id: number;
  tipo: TipoHorario;
  dataHoraPrevista: DataHoraIso;
  descricao: string | null;
  detalhes: string | null;
  local: string | null;
  status: StatusHorario;
  criadoPorNome: string | null;
}

/** HorarioPrevistoRequest: campos que não se aplicam ao tipo são descartados pelo servidor */
export interface HorarioPrevistoRequest {
  tipo: TipoHorario;
  dataHoraPrevista: DataHoraIso;
  descricao: string | null;
  detalhes: string | null;
  local: string | null;
}

export interface CampoHorario {
  rotulo: string;
  exemplo: string;
  obrigatorio?: boolean;
}

export interface ConfigTipoHorario {
  rotulo: string;
  descricao?: CampoHorario;
  detalhes?: CampoHorario;
  local?: CampoHorario;
  aviso?: string;
}

/**
 * Rótulos, exemplos e campos de cada tipo de horário previsto. Campo ausente = não se aplica ao tipo.
 * BANHO é o valor já existente na API e representa os cuidados de higiene em geral.
 */
export const TIPOS_HORARIO: Record<TipoHorario, ConfigTipoHorario> = {
  ALIMENTACAO: {
    rotulo: '🍼 Alimentação',
    descricao: { rotulo: 'Alimento ou tipo de leite (opcional)', exemplo: 'Ex.: leite materno, fórmula, papinha de legumes' },
  },
  SONO: {
    rotulo: '💤 Sono / soneca',
    descricao: { rotulo: 'Rotina de descanso (opcional)', exemplo: 'Ex.: soneca da tarde no berço' },
  },
  MEDICAMENTO: {
    rotulo: '💊 Medicamento',
    descricao: { rotulo: 'Nome do medicamento', exemplo: 'Ex.: vitamina D', obrigatorio: true },
    detalhes: { rotulo: 'Dose e orientações (opcional)', exemplo: 'Ex.: 4 gotas, via oral, conforme a receita' },
    aviso: 'Agende apenas medicamentos orientados por um profissional de saúde.',
  },
  BANHO: {
    rotulo: '🫧 Higiene',
    descricao: { rotulo: 'Tipo de cuidado (opcional)', exemplo: 'Ex.: banho, corte de unhas, lavagem nasal' },
  },
  CONSULTA: {
    rotulo: '🩺 Consulta',
    descricao: { rotulo: 'Profissional ou especialidade (opcional)', exemplo: 'Ex.: pediatra' },
    detalhes: { rotulo: 'Motivo (opcional)', exemplo: 'Ex.: acompanhamento de rotina' },
    local: { rotulo: 'Local (opcional)', exemplo: 'Ex.: clínica ou UBS' },
  },
  VACINA: {
    rotulo: '💉 Vacina',
    descricao: { rotulo: 'Vacina e dose (opcional)', exemplo: 'Ex.: pentavalente, 2ª dose' },
    local: { rotulo: 'Local (opcional)', exemplo: 'Ex.: posto de saúde' },
  },
  OUTRO: {
    rotulo: '📌 Outro',
    descricao: { rotulo: 'Descrição', exemplo: 'Descreva o que está previsto', obrigatorio: true },
  },
};

/** Texto de um horário previsto: descrição, detalhes e local preenchidos */
export function descreverHorario(h: Pick<HorarioPrevisto, 'descricao' | 'detalhes' | 'local'>): string {
  return [h.descricao, h.detalhes, h.local].filter(Boolean).join(' • ');
}
