import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Crescimento, CrescimentoRequest, Medicamento, MedicamentoRequest, Vacina, VacinaRequest,
} from '../../shared/models';
import { API_URL } from '../config/api-url.token';

export type RecursoSaude = 'crescimentos' | 'vacinas' | 'medicamentos';

/** SaudeController (/bebes/{bebeId}/crescimentos | vacinas | medicamentos) */
@Injectable({ providedIn: 'root' })
export class SaudeApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_URL)}/bebes`;

  crescimentos(bebeId: number): Observable<Crescimento[]> {
    return this.http.get<Crescimento[]>(`${this.url}/${bebeId}/crescimentos`);
  }

  registrarCrescimento(bebeId: number, dados: CrescimentoRequest): Observable<Crescimento> {
    return this.http.post<Crescimento>(`${this.url}/${bebeId}/crescimentos`, dados);
  }

  vacinas(bebeId: number): Observable<Vacina[]> {
    return this.http.get<Vacina[]>(`${this.url}/${bebeId}/vacinas`);
  }

  registrarVacina(bebeId: number, dados: VacinaRequest): Observable<Vacina> {
    return this.http.post<Vacina>(`${this.url}/${bebeId}/vacinas`, dados);
  }

  medicamentos(bebeId: number): Observable<Medicamento[]> {
    return this.http.get<Medicamento[]>(`${this.url}/${bebeId}/medicamentos`);
  }

  /** Usado pela caderneta e pelo registro rápido de remédios */
  registrarMedicamento(bebeId: number, dados: MedicamentoRequest): Observable<Medicamento> {
    return this.http.post<Medicamento>(`${this.url}/${bebeId}/medicamentos`, dados);
  }

  excluir(bebeId: number, recurso: RecursoSaude, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${bebeId}/${recurso}/${id}`);
  }
}
