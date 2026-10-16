import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiError, mensagemDeErro } from './api-error';

/**
 * Converte toda falha HTTP em ApiError com mensagem legível. Em downloads (responseType blob) o corpo do erro
 * também chega como Blob e precisa ser lido como texto. 401 com sessão ativa = sessão expirada.
 */
export const erroInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((erro: unknown) => {
      if (!(erro instanceof HttpErrorResponse)) return throwError(() => erro);
      if (erro.status === 401 && req.headers.has('Authorization')) {
        auth.encerrarSessao(true);
      }
      const corpo = erro.error instanceof Blob ? from(erro.error.text()) : from(Promise.resolve(erro.error));
      return corpo.pipe(
        switchMap(texto => throwError(() => new ApiError(erro.status, mensagemDeErro(erro.status, texto)))),
      );
    }),
  );
};
