import { DataIso } from './comum.model';
import { HorarioPrevisto } from './horario.model';

/** ResumoDiaResponse: valores nulos significam "sem informação", não zero */
export interface ResumoDia {
  data: DataIso;
  totalRegistros: number;
  alimentacao: {
    refeicoes: number;
    mamadeiras: number;
    mamadeirasLeiteMaterno: number;
    mamadeirasFormula: number;
    amamentacoes: number;
    solidas: number;
    volumeTotalMl: number | null;
    mamadeirasSemVolume: number;
  };
  sono: { periodos: number; minutosTotais: number | null; emAndamento: number };
  fraldas: {
    trocas: number; xixi: number; coco: number; misto: number; limpa: number;
    trocasComXixi: number; trocasComCoco: number;
  };
  atividades: number;
  medicamentos: number;
  proximosHorarios: HorarioPrevisto[];
  observacoesDiario: string[];
}

/** EstatisticasResponse: dias sem registro têm contagens nulas (não zero) */
export interface DiaEstatistica {
  data: DataIso;
  possuiRegistros: boolean;
  sonoMinutos: number | null;
  periodosSono: number | null;
  refeicoes: number | null;
  volumeMl: number | null;
  fraldas: number | null;
  trocasComXixi: number | null;
  trocasComCoco: number | null;
}

export interface PeriodoEstatistica {
  inicio: DataIso;
  fim: DataIso;
  diasComRegistro: number;
  mediaSonoMinutos: number | null;
  mediaRefeicoes: number | null;
  mediaVolumeMl: number | null;
  mediaFraldas: number | null;
  mediaTrocasComXixi: number | null;
  mediaTrocasComCoco: number | null;
}

export interface Estatisticas {
  inicio: DataIso;
  fim: DataIso;
  dias: DiaEstatistica[];
  periodo: PeriodoEstatistica;
  periodoAnterior: PeriodoEstatistica;
}
