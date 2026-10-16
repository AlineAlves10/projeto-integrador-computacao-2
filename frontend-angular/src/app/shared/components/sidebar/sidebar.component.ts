import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ItemNavegacao } from '../../../core/layout/navegacao';

/** Menu lateral exibido no computador (a partir de 1024 px). */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly itens = input.required<ItemNavegacao[]>();
  readonly sair = output<void>();
}
