import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DataIso, Estatisticas, ItemLinhaDoTempo, ResumoDia } from '../../shared/models';
import { API_URL } from '../config/api-url.token';
import { parametros } from './http-utils';

/** ResumoController: números calculados pelo servidor a partir dos registros persistidos */
@Injectable({ providedIn: 'root' })
export class ResumoApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_URL)}/bebes`;

  doDia(bebeId: number, data: DataIso): Observable<ResumoDia> {
    return this.http.get<ResumoDia>(`${this.url}/${bebeId}/resumo`, { params: parametros({ data }) });
  }

  /** Itens em ordem cronológica */
  linhaDoTempo(bebeId: number, inicio: DataIso, fim: DataIso): Observable<ItemLinhaDoTempo[]> {
    return this.http.get<ItemLinhaDoTempo[]>(`${this.url}/${bebeId}/linha-do-tempo`, { params: parametros({ inicio, fim }) });
  }

  estatisticas(bebeId: number, inicio: DataIso, fim: DataIso): Observable<Estatisticas> {
    return this.http.get<Estatisticas>(`${this.url}/${bebeId}/estatisticas`, { params: parametros({ inicio, fim }) });
  }
}
