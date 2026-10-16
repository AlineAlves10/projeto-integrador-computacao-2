import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { BebeAtivoService } from '../../core/bebe-ativo/bebe-ativo.service';
import { BebeSelecionadoComponent } from './bebe-selecionado/bebe-selecionado.component';
import { BuscaBabaComponent } from './busca-baba/busca-baba.component';
import { MeusBebesComponent } from './meus-bebes/meus-bebes.component';
import { MinhaContaComponent } from './minha-conta/minha-conta.component';
import { NovoBebeComponent } from './novo-bebe/novo-bebe.component';
import { VinculosComponent } from './vinculos/vinculos.component';

/** Perfil: bebê selecionado e foto, bebês acessíveis, vínculos e contatos, busca da babá, novo bebê e conta. */
@Component({
  selector: 'app-perfil-bebe',
  imports: [BebeSelecionadoComponent, BuscaBabaComponent, MeusBebesComponent, MinhaContaComponent, NovoBebeComponent, VinculosComponent],
  templateUrl: './perfil-bebe.component.html',
  styleUrl: './perfil-bebe.component.css',
  host: { class: 'pagina' },
})
export class PerfilBebeComponent {
  readonly bebeAtivo = inject(BebeAtivoService);
  readonly usuario = inject(AuthService).usuario;
}
