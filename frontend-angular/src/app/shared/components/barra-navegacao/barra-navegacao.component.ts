import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ItemNavegacao } from '../../../core/layout/navegacao';

/** Barra fixa inferior exibida no celular (abaixo de 1024 px). */
@Component({
  selector: 'app-barra-navegacao',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './barra-navegacao.component.html',
  styleUrl: './barra-navegacao.component.css',
})
export class BarraNavegacaoComponent {
  readonly itens = input.required<ItemNavegacao[]>();
}
