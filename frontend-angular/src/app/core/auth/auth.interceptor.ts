import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../config/api-url.token';
import { AuthService } from './auth.service';

/** Envia o token apenas para a API do Babá Premium (nunca para outros endereços). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const apiUrl = inject(API_URL);
  if (!token || !req.url.startsWith(apiUrl)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
