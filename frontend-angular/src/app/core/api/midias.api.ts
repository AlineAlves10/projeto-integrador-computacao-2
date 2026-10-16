import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Midia, PaginaMidias } from '../../shared/models';
import { API_URL } from '../config/api-url.token';
import { baixarBlob, parametros } from './http-utils';

/**
 * MidiaController (/bebes/{bebeId}/midias). Não há URL pública de arquivo: miniaturas e originais são
 * baixados com o token e exibidos por URLs temporárias do navegador (blob:).
 */
@Injectable({ providedIn: 'root' })
export class MidiasApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_URL)}/bebes`;

  /** Mais recentes primeiro */
  listar(bebeId: number, pagina: number, tamanho: number): Observable<PaginaMidias> {
    return this.http.get<PaginaMidias>(`${this.url}/${bebeId}/midias`, { params: parametros({ pagina, tamanho }) });
  }

  /** miniatura: quadro do vídeo gerado no navegador (o servidor valida e redimensiona) */
  enviar(bebeId: number, arquivo: File, miniatura: Blob | null, descricao: string): Observable<Midia> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    if (miniatura) form.append('miniatura', miniatura, 'miniatura.jpg');
    if (descricao) form.append('descricao', descricao);
    return this.http.post<Midia>(`${this.url}/${bebeId}/midias`, form);
  }

  miniatura(bebeId: number, id: number): Observable<Blob | null> {
    return baixarBlob(this.http, `${this.url}/${bebeId}/midias/${id}/miniatura`);
  }

  arquivo(bebeId: number, id: number): Observable<Blob | null> {
    return baixarBlob(this.http, `${this.url}/${bebeId}/midias/${id}/arquivo`);
  }

  excluir(bebeId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${bebeId}/midias/${id}`);
  }
}
