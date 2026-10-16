import { Component, computed, input, output } from '@angular/core';
import { CategoriaRegistro, ItemLinhaDoTempo } from '../../../shared/models';
import { HoraPipe } from '../../../shared/pipes/formatacao.pipes';

export type FiltroLinhaDoTempo = 'todos' | 'alimentacao' | 'fralda' | 'sono' | 'outros';

const ESTILO_CATEGORIA: Record<CategoriaRegistro, { filtro: FiltroLinhaDoTempo; cor: string }> = {
  ALIMENTACAO: { filtro: 'alimentacao', cor: 'var(--primary)' },
  FRALDA: { filtro: 'fralda', cor: 'var(--secondary)' },
  SONO: { filtro: 'sono', cor: '#6366f1' },
  HIGIENE: { filtro: 'outros', cor: '#06b6d4' },
  MEDICAMENTO: { filtro: 'outros', cor: '#ef4444' },
  ATIVIDADE: { filtro: 'outros', cor: '#ec4899' },
};

/** Registros do dia, mais recentes primeiro; com ações de excluir e "acordou agora" quando habilitadas. */
@Component({
  selector: 'app-linha-do-tempo',
  imports: [HoraPipe],
  templateUrl: './linha-do-tempo.component.html',
  styleUrl: './linha-do-tempo.component.css',
})
export class LinhaDoTempoComponent {
  readonly itens = input.required<ItemLinhaDoTempo[]>();
  readonly filtro = input<FiltroLinhaDoTempo>('todos');
  readonly comAcoes = input(false);
  readonly vazio = input('Nenhum registro neste dia.');
  readonly excluir = output<ItemLinhaDoTempo>();
  readonly encerrarSono = output<ItemLinhaDoTempo>();

  readonly visiveis = computed(() => {
    const filtro = this.filtro();
    return [...this.itens()].reverse().filter(item => filtro === 'todos' || this.estilo(item).filtro === filtro);
  });

  estilo(item: ItemLinhaDoTempo) {
    return ESTILO_CATEGORIA[item.categoria] ?? ESTILO_CATEGORIA.ATIVIDADE;
  }
}
