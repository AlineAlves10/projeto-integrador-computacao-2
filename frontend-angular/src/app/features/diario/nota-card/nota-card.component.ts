import { Component, input, output } from '@angular/core';
import { NotaDiario, TAGS_DIARIO } from '../../../shared/models';
import { DataHoraBrPipe } from '../../../shared/pipes/formatacao.pipes';

/** Anotação do diário; editar/excluir aparecem só para o autor (o servidor também confere). */
@Component({
  selector: 'app-nota-card',
  imports: [DataHoraBrPipe],
  templateUrl: './nota-card.component.html',
  styleUrl: './nota-card.component.css',
})
export class NotaCardComponent {
  readonly nota = input.required<NotaDiario>();
  readonly propria = input(false);
  readonly editar = output<NotaDiario>();
  readonly excluir = output<NotaDiario>();

  readonly tags = TAGS_DIARIO;
}
