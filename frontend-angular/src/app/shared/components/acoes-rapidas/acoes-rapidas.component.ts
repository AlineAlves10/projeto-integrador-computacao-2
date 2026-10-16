import { Component, input, output } from '@angular/core';

export interface AcaoRapida<T extends string = string> {
  tipo: T;
  icone: string;
  rotulo: string;
  sub: string;
}

/** Grade de botões grandes de registro (área do polegar no celular). */
@Component({
  selector: 'app-acoes-rapidas',
  templateUrl: './acoes-rapidas.component.html',
  styleUrl: './acoes-rapidas.component.css',
})
export class AcoesRapidasComponent<T extends string = string> {
  readonly acoes = input.required<AcaoRapida<T>[]>();
  readonly escolher = output<T>();
}
