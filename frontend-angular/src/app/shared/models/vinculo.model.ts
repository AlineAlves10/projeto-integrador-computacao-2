import { DataHoraIso } from './comum.model';
import { TipoUsuario } from './usuario.model';

/** ContatoResponse: telefone e links só vêm preenchidos quando o usuário logado pode ver o contato */
export interface Contato {
  usuarioId: number;
  nome: string;
  papel: TipoUsuario;
  dataVinculo: DataHoraIso;
  voce: boolean;
  telefone: string | null;
  linkLigacao: string | null;
  linkWhatsapp: string | null;
  podeRemover: boolean;
}

/** ContatosBebeResponse */
export interface ContatosBebe {
  podeGerenciarVinculos: boolean;
  contatos: Contato[];
}

/** UsuarioBebeResponse */
export interface Vinculo {
  usuarioId: number;
  bebeId: number;
  papel: TipoUsuario;
  dataVinculo: DataHoraIso;
}
