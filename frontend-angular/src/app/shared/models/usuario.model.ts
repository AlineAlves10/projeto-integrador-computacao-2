import { DataHoraIso, DataIso } from './comum.model';

export type TipoUsuario = 'RESPONSAVEL' | 'BABA';

export const ROTULO_PAPEL: Record<TipoUsuario, string> = {
  RESPONSAVEL: 'Responsável',
  BABA: 'Babá',
};

/** UsuarioResponse. Para outras pessoas, e-mail e foto não vêm e o telefone só vem quando permitido. */
export interface Usuario {
  id: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  fotoPerfil?: string | null;
  dataCadastro?: DataIso | null;
  tipo: TipoUsuario;
}

/** LoginResponse */
export interface Sessao {
  token: string;
  tipoToken: string;
  expiraEm: DataHoraIso;
  usuario: Usuario;
}
