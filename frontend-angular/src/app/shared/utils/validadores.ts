import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { hojeIsoLocal } from './datas';

/** Obrigatório ignorando espaços (o Validators.required aceita "   "). */
export const obrigatorio: ValidatorFn = (controle: AbstractControl): ValidationErrors | null => {
  const valor = controle.value;
  return valor === null || valor === undefined || String(valor).trim() === '' ? { obrigatorio: true } : null;
};

/** Data yyyy-MM-dd que não pode estar no futuro. */
export const naoFuturo: ValidatorFn = (controle: AbstractControl): ValidationErrors | null =>
  controle.value && String(controle.value) > hojeIsoLocal() ? { futuro: true } : null;

/** Mesmo filtro do servidor para telefones: só dígitos, espaços, parênteses, +, . e - (o formato é validado lá). */
export const caracteresDeTelefone: ValidatorFn = (controle: AbstractControl): ValidationErrors | null =>
  controle.value && !/^[\d\s()+.-]+$/.test(String(controle.value)) ? { telefone: true } : null;

/** Texto aparado ou null (campos opcionais enviados à API). */
export function textoOuNulo(valor: string | null | undefined): string | null {
  const limpo = (valor ?? '').trim();
  return limpo ? limpo : null;
}
