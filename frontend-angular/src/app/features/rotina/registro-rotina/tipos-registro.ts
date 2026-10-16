import { AcaoRapida } from '../../../shared/components/acoes-rapidas/acoes-rapidas.component';
import { TipoAtividade, TipoLeite } from '../../../shared/models';

/** Botões de registro rápido e o endpoint correspondente:
 *  alimentacao -> /alimentacoes   fralda -> /fraldas   sono -> /sonos   remedios -> /medicamentos
 *  banho -> /higienes   horario -> /horarios-previstos   acordou, rituais e brincar -> /atividades */
export type TipoRegistro =
  | 'alimentacao' | 'fralda' | 'sono' | 'remedios' | 'acordou'
  | 'ritual_bom_dia' | 'ritual_sono' | 'brincar' | 'banho' | 'horario';

export const TITULOS_REGISTRO: Record<TipoRegistro, string> = {
  alimentacao: '🍼 Registrar Alimentação',
  fralda: '🧷 Registrar Troca de Fralda',
  sono: '💤 Registrar Período de Sono',
  remedios: '💊 Registrar Medicação',
  acordou: '🦥 Hora que Acordou',
  ritual_bom_dia: '☀️ Ritual do Bom Dia',
  ritual_sono: '🌙 Ritual do Sono',
  brincar: '🧸 Momento de Brincar',
  banho: '🫧 Banho do Bebê',
  horario: '⏰ Agendar Próximo Horário',
};

export const ACOES_PRINCIPAIS: AcaoRapida<TipoRegistro>[] = [
  { tipo: 'alimentacao', icone: '🍼', rotulo: 'Alimentação', sub: '+ Registrar' },
  { tipo: 'fralda', icone: '🧷', rotulo: 'Fralda', sub: '+ Troca' },
  { tipo: 'sono', icone: '💤', rotulo: 'Sono / Soneca', sub: '+ Registrar' },
];

export const TODAS_AS_ACOES: AcaoRapida<TipoRegistro>[] = [
  ...ACOES_PRINCIPAIS,
  { tipo: 'remedios', icone: '💊', rotulo: 'Remédios', sub: '+ Registrar' },
  { tipo: 'acordou', icone: '🦥', rotulo: 'Hora que Acordou', sub: '+ Registrar' },
  { tipo: 'ritual_bom_dia', icone: '☀️', rotulo: 'Ritual do Bom Dia', sub: '+ Registrar' },
  { tipo: 'ritual_sono', icone: '🌙', rotulo: 'Ritual do Sono', sub: '+ Registrar' },
  { tipo: 'brincar', icone: '🧸', rotulo: 'Brincar', sub: '+ Registrar' },
  { tipo: 'banho', icone: '🫧', rotulo: 'Banho', sub: '+ Registrar' },
];

/** Opções do formulário de alimentação -> campos da API (leite materno e fórmula na mamadeira usam MAMADEIRA) */
export type OpcaoAlimentacao = 'PEITO' | 'LEITE_MATERNO' | 'FORMULA' | 'SOLIDA';

export const OPCOES_ALIMENTACAO: Record<OpcaoAlimentacao, { rotulo: string; tipoLeite?: TipoLeite }> = {
  PEITO: { rotulo: 'Amamentação no peito' },
  LEITE_MATERNO: { rotulo: 'Leite materno na mamadeira', tipoLeite: 'LEITE_MATERNO' },
  FORMULA: { rotulo: 'Fórmula infantil', tipoLeite: 'FORMULA' },
  SOLIDA: { rotulo: 'Papinha ou refeição' },
};

export const TIPO_ATIVIDADE: Partial<Record<TipoRegistro, TipoAtividade>> = {
  acordou: 'ACORDOU',
  ritual_bom_dia: 'RITUAL_BOM_DIA',
  ritual_sono: 'RITUAL_SONO',
  brincar: 'BRINCADEIRA',
};

export const HUMORES_AO_ACORDAR = ['Calmo e bem-disposto', 'Choroso / Irritado', 'Pedindo comida logo'];
