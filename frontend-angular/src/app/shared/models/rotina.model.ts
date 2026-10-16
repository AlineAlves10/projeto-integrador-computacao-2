import { DataHoraIso } from './comum.model';

export type TipoAlimentacao = 'PEITO' | 'MAMADEIRA' | 'SOLIDA';
export type LadoAmamentacao = 'ESQUERDO' | 'DIREITO' | 'AMBOS';
export type TipoLeite = 'LEITE_MATERNO' | 'FORMULA';
export type TipoFralda = 'XIXI' | 'COCO' | 'MISTO' | 'LIMPA';
export type ConsistenciaFezes = 'LIQUIDA' | 'PASTOSA' | 'FIRME' | 'ENDURECIDA';
export type TipoHigiene = 'BANHO' | 'ESCOVACAO_DENTES' | 'CORTE_UNHAS' | 'LAVAGEM_NARIZ' | 'TROCA_ROUPA' | 'OUTRO';
export type TipoAtividade = 'ACORDOU' | 'RITUAL_BOM_DIA' | 'RITUAL_SONO' | 'BRINCADEIRA' | 'PASSEIO' | 'OBSERVACAO';

/** AlimentacaoRequest: só os campos do tipo escolhido são enviados */
export interface AlimentacaoRequest {
  tipo: TipoAlimentacao;
  dataHora: DataHoraIso;
  observacao: string | null;
  lado?: LadoAmamentacao;
  duracaoMinutos?: number | null;
  tipoLeite?: TipoLeite;
  volumeMl?: number | null;
  alimento?: string;
  quantidade?: string | null;
}

export interface FraldaRequest {
  tipo: TipoFralda;
  dataHora: DataHoraIso;
  consistenciaCoco: ConsistenciaFezes | null;
  observacoes: string | null;
}

/** fim nulo = bebê ainda dormindo */
export interface SonoRequest {
  inicio: DataHoraIso;
  fim: DataHoraIso | null;
  local: string | null;
}

export interface Sono {
  id: number;
  inicio: DataHoraIso;
  fim: DataHoraIso | null;
  duracaoMinutos: number | null;
  local: string | null;
}

export interface HigieneRequest {
  tipo: TipoHigiene;
  dataHora: DataHoraIso;
  observacoes: string | null;
}

export interface AtividadeRequest {
  tipo: TipoAtividade;
  dataHora: DataHoraIso;
  duracaoMinutos?: number | null;
  descricao: string | null;
}

/** Categorias da linha do tempo; cada uma corresponde a um recurso /bebes/{id}/{recurso} */
export type CategoriaRegistro = 'ALIMENTACAO' | 'FRALDA' | 'SONO' | 'HIGIENE' | 'MEDICAMENTO' | 'ATIVIDADE';

/** LinhaDoTempoItemResponse (id é o do registro dentro da sua categoria) */
export interface ItemLinhaDoTempo {
  categoria: CategoriaRegistro;
  id: number;
  tipo: string;
  dataHora: DataHoraIso;
  fim: DataHoraIso | null;
  titulo: string;
  descricao: string | null;
}

/** Recurso da API que grava/exclui cada categoria */
export const RECURSO_DA_CATEGORIA: Record<CategoriaRegistro, string> = {
  ALIMENTACAO: 'alimentacoes',
  FRALDA: 'fraldas',
  SONO: 'sonos',
  HIGIENE: 'higienes',
  MEDICAMENTO: 'medicamentos',
  ATIVIDADE: 'atividades',
};
