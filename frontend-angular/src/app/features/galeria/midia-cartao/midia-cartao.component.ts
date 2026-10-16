import { Component, DestroyRef, ElementRef, afterNextRender, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MidiasApi } from '../../../core/api/midias.api';
import { Midia } from '../../../shared/models';
import { DataHoraBrPipe } from '../../../shared/pipes/formatacao.pipes';

/** Cartão da galeria. A miniatura só é baixada quando o cartão se aproxima da tela (economia de dados). */
@Component({
  selector: 'app-midia-cartao',
  imports: [DataHoraBrPipe],
  templateUrl: './midia-cartao.component.html',
  styleUrl: './midia-cartao.component.css',
})
export class MidiaCartaoComponent {
  private readonly api = inject(MidiasApi);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly midia = input.required<Midia>();
  readonly bebeId = input.required<number>();
  readonly abrir = output<Midia>();

  readonly src = signal<string | null>(null);
  readonly falhou = signal(false);
  private observador: IntersectionObserver | null = null;

  constructor() {
    afterNextRender(() => {
      if (!this.midia().possuiMiniatura) return;
      this.observador = new IntersectionObserver(entradas => {
        if (entradas.some(e => e.isIntersecting)) {
          this.observador?.disconnect();
          void this.carregarMiniatura();
        }
      }, { rootMargin: '200px' });
      this.observador.observe(this.host.nativeElement);
    });
    inject(DestroyRef).onDestroy(() => {
      this.observador?.disconnect();
      const src = this.src();
      if (src) URL.revokeObjectURL(src);
    });
  }

  private async carregarMiniatura(): Promise<void> {
    try {
      const blob = await firstValueFrom(this.api.miniatura(this.bebeId(), this.midia().id));
      if (blob) this.src.set(URL.createObjectURL(blob));
      else this.falhou.set(true);
    } catch {
      this.falhou.set(true);
    }
  }
}
