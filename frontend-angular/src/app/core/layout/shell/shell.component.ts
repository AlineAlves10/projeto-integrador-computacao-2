import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraNavegacaoComponent } from '../../../shared/components/barra-navegacao/barra-navegacao.component';
import { SeletorBebeComponent } from '../../../shared/components/seletor-bebe/seletor-bebe.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../auth/auth.service';
import { BebeAtivoService } from '../../bebe-ativo/bebe-ativo.service';
import { ITENS_NAVEGACAO } from '../navegacao';

/**
 * Estrutura das telas internas: sidebar no computador, barra inferior no celular e o seletor do bebê ativo
 * acima do conteúdo. Os bebês do usuário são carregados uma vez ao entrar.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, BarraNavegacaoComponent, SeletorBebeComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  readonly itens = ITENS_NAVEGACAO;

  constructor() {
    void inject(BebeAtivoService).carregar();
  }

  sair(): void {
    this.auth.logout();
  }
}
