import { DataHoraIso } from './comum.model';

export type TipoMidia = 'FOTO' | 'VIDEO';

/** MidiaResponse: sem URLs; miniatura e arquivo são baixados pelos endpoints autenticados */
export interface Midia {
  id: number;
  tipo: TipoMidia;
  contentType: string;
  tamanhoBytes: number;
  descricao: string | null;
  dataEnvio: DataHoraIso;
  enviadoPorId: number;
  enviadoPorNome: string;
  possuiMiniatura: boolean;
  podeExcluir: boolean;
}

/** MidiaPaginaResponse */
export interface PaginaMidias {
  itens: Midia[];
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
}
