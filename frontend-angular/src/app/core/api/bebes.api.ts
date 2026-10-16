import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Bebe, BebeVinculado, FaixaEtaria, NovoBebe, Pagina } from '../../shared/models';
import { API_URL } from '../config/api-url.token';
import { baixarBlob, parametros } from './http-utils';

export interface FiltrosBebesDaBaba {
  nomeBebe?: string;
  nomeResponsavel?: string;
  faixaEtaria?: FaixaEtaria | '';
}

/** BebeController (/bebes) */
@Injectable({ providedIn: 'root' })
export class BebesApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_URL)}/bebes`;

  /** Bebês acessíveis pelo usuário logado, com o papel dele em cada um */
  meus(): Observable<BebeVinculado[]> {
    return this.http.get<BebeVinculado[]>(`${this.url}/meus`);
  }

  /** Cria o bebê já vinculado a quem cadastra (babás devem informar nomeResponsavel) */
  cadastrar(dados: NovoBebe): Observable<Bebe> {
    return this.http.post<Bebe>(this.url, dados);
  }

  buscarDaBaba(idBaba: number, filtros: FiltrosBebesDaBaba): Observable<Pagina<Bebe>> {
    return this.http.get<Pagina<Bebe>>(`${this.url}/baba/${idBaba}`, { params: parametros({ ...filtros }) });
  }

  enviarFoto(bebeId: number, arquivo: File): Observable<Bebe> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http.put<Bebe>(`${this.url}/${bebeId}/foto`, form);
  }

  /** Foto persistida; null quando o bebê não tem foto */
  obterFoto(bebeId: number): Observable<Blob | null> {
    return baixarBlob(this.http, `${this.url}/${bebeId}/foto`);
  }

  removerFoto(bebeId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${bebeId}/foto`);
  }
}
