import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContatosBebe, Vinculo } from '../../shared/models';
import { API_URL } from '../config/api-url.token';

/** UsuarioBebeController: as regras de quem pode vincular/remover ficam no servidor */
@Injectable({ providedIn: 'root' })
export class VinculosApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_URL)}/bebes`;

  /** Pessoas vinculadas; telefone e links só quando o usuário logado pode vê-los */
  contatos(bebeId: number): Observable<ContatosBebe> {
    return this.http.get<ContatosBebe>(`${this.url}/${bebeId}/contatos`);
  }

  /** O papel é definido pelo servidor (tipo da conta da pessoa vinculada) */
  vincularPorEmail(bebeId: number, email: string): Observable<Vinculo> {
    return this.http.post<Vinculo>(`${this.url}/${bebeId}/usuarios`, { email });
  }

  remover(bebeId: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${bebeId}/usuarios/${usuarioId}`);
  }
}
