import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AlimentacaoRequest, AtividadeRequest, CategoriaRegistro, DataHoraIso, DataIso, FraldaRequest, HigieneRequest,
  RECURSO_DA_CATEGORIA, Sono, SonoRequest,
} from '../../shared/models';
import { API_URL } from '../config/api-url.token';
import { parametros } from './http-utils';

/** RotinaController (/bebes/{bebeId}/...) */
@Injectable({ providedIn: 'root' })
export class RotinaApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_URL)}/bebes`;

  registrarAlimentacao(bebeId: number, dados: AlimentacaoRequest): Observable<unknown> {
    return this.http.post(`${this.url}/${bebeId}/alimentacoes`, dados);
  }

  registrarFralda(bebeId: number, dados: FraldaRequest): Observable<unknown> {
    return this.http.post(`${this.url}/${bebeId}/fraldas`, dados);
  }

  registrarSono(bebeId: number, dados: SonoRequest): Observable<Sono> {
    return this.http.post<Sono>(`${this.url}/${bebeId}/sonos`, dados);
  }

  listarSonos(bebeId: number, inicio: DataIso, fim: DataIso): Observable<Sono[]> {
    return this.http.get<Sono[]>(`${this.url}/${bebeId}/sonos`, { params: parametros({ inicio, fim }) });
  }

  encerrarSono(bebeId: number, sonoId: number, fim: DataHoraIso): Observable<Sono> {
    return this.http.patch<Sono>(`${this.url}/${bebeId}/sonos/${sonoId}/fim`, { fim });
  }

  registrarHigiene(bebeId: number, dados: HigieneRequest): Observable<unknown> {
    return this.http.post(`${this.url}/${bebeId}/higienes`, dados);
  }

  registrarAtividade(bebeId: number, dados: AtividadeRequest): Observable<unknown> {
    return this.http.post(`${this.url}/${bebeId}/atividades`, dados);
  }

  /** Exclui um item da linha do tempo pelo recurso da sua categoria */
  excluir(bebeId: number, categoria: CategoriaRegistro, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${bebeId}/${RECURSO_DA_CATEGORIA[categoria]}/${id}`);
  }
}
