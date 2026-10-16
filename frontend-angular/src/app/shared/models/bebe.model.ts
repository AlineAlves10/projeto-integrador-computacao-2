import { DataIso } from './comum.model';
import { Sessao, TipoUsuario } from './usuario.model';

export type Sexo = 'M' | 'F';

export const ROTULO_SEXO: Record<string, string> = { M: 'Masculino', F: 'Feminino' };

/** BebeResponse. possuiFoto indica se há foto em GET /bebes/{id}/foto. */
export interface Bebe {
  id: number;
  nome: string;
  dataNascimento: DataIso;
  sexo: Sexo;
  possuiFoto: boolean;
  observacoes: string;
  nomeResponsavel: string | null;
}

/** BebeVinculadoResponse: bebê acessível e o papel do usuário logado nesse vínculo */
export interface BebeVinculado {
  bebe: Bebe;
  papel: TipoUsuario;
}

/** BebeRequest (a foto é enviada à parte, em PUT /bebes/{id}/foto) */
export interface NovoBebe {
  nome: string;
  dataNascimento: DataIso;
  sexo: Sexo;
  observacoes: string;
  nomeResponsavel?: string | null;
}

export type FaixaEtaria =
  | 'ZERO_A_TRES_MESES' | 'QUATRO_A_SEIS_MESES' | 'SETE_A_DOZE_MESES'
  | 'UM_A_DOIS_ANOS' | 'DOIS_A_TRES_ANOS' | 'TRES_ANOS_OU_MAIS';

export const FAIXAS_ETARIAS: { valor: FaixaEtaria; rotulo: string }[] = [
  { valor: 'ZERO_A_TRES_MESES', rotulo: '0 a 3 meses' },
  { valor: 'QUATRO_A_SEIS_MESES', rotulo: '4 a 6 meses' },
  { valor: 'SETE_A_DOZE_MESES', rotulo: '7 a 12 meses' },
  { valor: 'UM_A_DOIS_ANOS', rotulo: '1 a 2 anos' },
  { valor: 'DOIS_A_TRES_ANOS', rotulo: '2 a 3 anos' },
  { valor: 'TRES_ANOS_OU_MAIS', rotulo: '3 anos ou mais' },
];

/** Page do Spring Data (GET /bebes/baba/{id}); só os campos usados pelo front */
export interface Pagina<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

/** POST /auth/cadastro */
export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
  telefone: string | null;
  tipo: TipoUsuario;
  bebes: NovoBebe[];
}

export interface CadastroResponse {
  sessao: Sessao;
  bebes: Bebe[];
}
