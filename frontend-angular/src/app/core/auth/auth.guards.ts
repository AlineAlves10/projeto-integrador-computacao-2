import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Telas internas: sem sessão válida, descarta o token vencido e vai para o login. */
export const autenticadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.estaAutenticado()) return true;
  auth.descartarSessaoLocal();
  return inject(Router).createUrlTree(['/login']);
};

/** Login e cadastro: quem já está autenticado vai direto para o painel. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.estaAutenticado()) return inject(Router).createUrlTree(['/dashboard']);
  auth.descartarSessaoLocal(); // token vencido não deve acompanhar o novo login
  return true;
};
