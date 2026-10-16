import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { ApiError } from '../http/api-error';

type ValorParametro = string | number | boolean | null | undefined;

/** Query string ignorando filtros vazios. */
export function parametros(valores: Record<string, ValorParametro>): HttpParams {
  let params = new HttpParams();
  for (const [chave, valor] of Object.entries(valores)) {
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      params = params.set(chave, String(valor));
    }
  }
  return params;
}

/** Binário autenticado (foto, miniatura, vídeo). 404 = não existe -> null. */
export function baixarBlob(http: HttpClient, url: string): Observable<Blob | null> {
  return http.get(url, { responseType: 'blob' }).pipe(
    catchError((erro: unknown) => (erro instanceof ApiError && erro.status === 404 ? of(null) : throwError(() => erro))),
  );
}
