import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { FotoBebeComponent } from '../../../shared/components/foto-bebe/foto-bebe.component';
import { MensagemComponent } from '../../../shared/components/mensagem/mensagem.component';
import { ROTULO_PAPEL } from '../../../shared/models';
import { IdadePipe } from '../../../shared/pipes/formatacao.pipes';

/** Bebês acessíveis pelo usuário (GET /bebes/meus), com a opção de selecionar outro. */
@Component({
  selector: 'app-meus-bebes',
  imports: [FotoBebeComponent, MensagemComponent, IdadePipe],
  templateUrl: './meus-bebes.component.html',
  styleUrl: './meus-bebes.component.css',
})
export class MeusBebesComponent {
  readonly bebeAtivo = inject(BebeAtivoService);
  readonly ehBaba = inject(AuthService).ehBaba;
  readonly rotuloPapel = ROTULO_PAPEL;
}
