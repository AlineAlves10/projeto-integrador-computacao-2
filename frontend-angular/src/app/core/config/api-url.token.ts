import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Único ponto de onde sai o endereço da API (definido em src/environments). */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});
