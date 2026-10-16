import { DataHoraIso } from './comum.model';

export type TagDiario = 'MARCO' | 'HUMOR' | 'SAUDE' | 'GERAL';

export const TAGS_DIARIO: Record<TagDiario, { rotulo: string; opcao: string }> = {
  MARCO: { rotulo: '⭐ Marco', opcao: '⭐ Marco de Desenvolvimento' },
  HUMOR: { rotulo: '😊 Humor', opcao: '😊 Comportamento & Humor' },
  SAUDE: { rotulo: '🩺 Saúde', opcao: '🩺 Sintoma / Saúde' },
  GERAL: { rotulo: '📝 Geral', opcao: '📝 Observação Geral' },
};

/** DiarioResponse */
export interface NotaDiario {
  id: number;
  dataHora: DataHoraIso;
  titulo: string;
  texto: string;
  tag: TagDiario;
  autorId: number | null;
  autorNome: string | null;
  atualizadoEm: DataHoraIso | null;
}

/** DiarioRequest: dataHora opcional (ausente = momento do registro) */
export interface NotaDiarioRequest {
  titulo: string;
  texto: string;
  tag: TagDiario;
  dataHora?: DataHoraIso;
}
