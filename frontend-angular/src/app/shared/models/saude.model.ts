import { DataHoraIso, DataIso } from './comum.model';

/** BigDecimal chega como número no JSON */
export interface Crescimento {
  id: number;
  dataRegistro: DataIso;
  pesoKg: number | null;
  alturaCm: number | null;
  perimetroCefalicoCm: number | null;
  observacoes: string | null;
}

export type CrescimentoRequest = Omit<Crescimento, 'id'>;

export interface Vacina {
  id: number;
  nomeVacina: string;
  dose: string;
  dataAplicacao: DataIso;
  proximaDose: DataIso | null;
  observacoes: string | null;
}

export type VacinaRequest = Omit<Vacina, 'id'>;

export interface Medicamento {
  id: number;
  nomeMedicamento: string;
  dosagem: string;
  dataHora: DataHoraIso;
  viaAdministracao: string | null;
  observacoes: string | null;
}

export type MedicamentoRequest = Omit<Medicamento, 'id'>;
