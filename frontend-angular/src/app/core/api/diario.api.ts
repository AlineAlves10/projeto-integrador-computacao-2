import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotaDiario, NotaDiarioRequest } from '../../shared/models';
import { API_URL } from '../config/api-url.token';

/** DiarioController (/bebes/{bebeId}/diario): editar e excluir só pelo autor (conferido no servidor) */
@Injectable({ providedIn: 'root' })
export class DiarioApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_URL)}/bebes`;

  listar(bebeId: number): Observable<NotaDiario[]> {
    return this.http.get<NotaDiario[]>(`${this.url}/${bebeId}/diario`);
  }

  criar(bebeId: number, dados: NotaDiarioRequest): Observable<NotaDiario> {
    return this.http.post<NotaDiario>(`${this.url}/${bebeId}/diario`, dados);
  }

  atualizar(bebeId: number, id: number, dados: NotaDiarioRequest): Observable<NotaDiario> {
    return this.http.put<NotaDiario>(`${this.url}/${bebeId}/diario/${id}`, dados);
  }

  excluir(bebeId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${bebeId}/diario/${id}`);
  }
}
