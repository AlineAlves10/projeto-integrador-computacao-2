import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DataHoraIso, HorarioPrevisto, HorarioPrevistoRequest, StatusHorario } from '../../shared/models';
import { API_URL } from '../config/api-url.token';
import { parametros } from './http-utils';

/** HorarioPrevistoController (/bebes/{bebeId}/horarios-previstos): lembretes, não registros de rotina */
@Injectable({ providedIn: 'root' })
export class HorariosApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_URL)}/bebes`;

  listar(bebeId: number, filtros: { status?: StatusHorario; desde?: DataHoraIso } = {}): Observable<HorarioPrevisto[]> {
    return this.http.get<HorarioPrevisto[]>(`${this.url}/${bebeId}/horarios-previstos`, { params: parametros(filtros) });
  }

  criar(bebeId: number, dados: HorarioPrevistoRequest): Observable<HorarioPrevisto> {
    return this.http.post<HorarioPrevisto>(`${this.url}/${bebeId}/horarios-previstos`, dados);
  }

  /** Concluir um horário não cria registro de rotina */
  alterarStatus(bebeId: number, id: number, status: StatusHorario): Observable<HorarioPrevisto> {
    return this.http.patch<HorarioPrevisto>(`${this.url}/${bebeId}/horarios-previstos/${id}/status`, { status });
  }
}
