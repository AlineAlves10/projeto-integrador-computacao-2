import { Component, DestroyRef, ElementRef, computed, effect, inject, input, viewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { SerieDiaria, TipoGrafico, configurarGrafico } from './graficos.config';

/** Gráfico diário (Chart.js). Recriado quando os dados mudam e destruído ao sair da tela. */
@Component({
  selector: 'app-grafico',
  templateUrl: './grafico.component.html',
  styleUrl: './grafico.component.css',
})
export class GraficoComponent {
  readonly tipo = input.required<TipoGrafico>();
  readonly rotulos = input.required<string[]>();
  readonly valores = input.required<SerieDiaria>();
  readonly vazio = input('Sem dados no período.');

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  readonly temDados = computed(() => this.valores().some(v => v !== null));
  private grafico: Chart | null = null;

  constructor() {
    effect(() => {
      const canvas = this.canvas();
      const config = this.temDados() ? configurarGrafico(this.tipo(), this.rotulos(), this.valores()) : null;
      this.destruir();
      if (canvas && config) this.grafico = new Chart(canvas.nativeElement, config);
    });
    inject(DestroyRef).onDestroy(() => this.destruir());
  }

  private destruir(): void {
    this.grafico?.destroy();
    this.grafico = null;
  }
}
