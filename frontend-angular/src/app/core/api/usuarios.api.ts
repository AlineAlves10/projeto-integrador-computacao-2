import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../../shared/models';
import { API_URL } from '../config/api-url.token';

/** UsuarioController (/usuarios) */
@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_URL)}/usuarios`;

  /** Dados completos da própria conta */
  eu(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/me`);
  }

  /** Telefone de contato da própria conta; vazio remove */
  atualizarTelefone(telefone: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.url}/me/telefone`, { telefone });
  }
}
