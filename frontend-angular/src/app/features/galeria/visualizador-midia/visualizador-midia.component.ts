import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MidiasApi } from '../../../core/api/midias.api';
import { textoDoErro } from '../../../core/http/api-error';
import { MensagemComponent } from '../../../shared/components/mensagem/mensagem.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { Midia } from '../../../shared/models';
import { TamanhoArquivoPipe } from '../../../shared/pipes/formatacao.pipes';
import { formatarDataHoraBr } from '../../../shared/utils/datas';
import { formatarTamanho } from '../../../shared/utils/formatos';

/** Visualização individual. Foto: baixada ao abrir. Vídeo: só quando o usuário pede (pode ser grande). */
@Component({
  selector: 'app-visualizador-midia',
  imports: [ModalComponent, MensagemComponent, TamanhoArquivoPipe],
  templateUrl: './visualizador-midia.component.html',
  styleUrl: './visualizador-midia.component.css',
})
export class VisualizadorMidiaComponent {
  private readonly api = inject(MidiasApi);

  /** Mídia aberta; null = fechado */
  readonly midia = input<Midia | null>(null);
  readonly bebeId = input.required<number>();
  readonly fechar = output<void>();
  readonly excluida = output<void>();

  readonly url = signal<string | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly excluindo = signal(false);

  readonly titulo = computed(() => (this.midia()?.tipo === 'VIDEO' ? 'Vídeo' : 'Foto'));
  readonly info = computed(() => {
    const m = this.midia();
    return m
      ? [m.descricao, `Enviado em ${formatarDataHoraBr(m.dataEnvio)} por ${m.enviadoPorNome}`, formatarTamanho(m.tamanhoBytes)]
          .filter(Boolean).join(' • ')
      : '';
  });

  constructor() {
    effect(() => {
      const midia = this.midia();
      untracked(() => {
        this.liberar();
        this.erro.set(null);
        if (midia?.tipo === 'FOTO') void this.carregarOriginal(midia);
      });
    });
    inject(DestroyRef).onDestroy(() => this.liberar());
  }

  async carregarOriginal(midia: Midia): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    try {
      const blob = await firstValueFrom(this.api.arquivo(this.bebeId(), midia.id));
      if (this.midia()?.id !== midia.id) return; // já fechou ou abriu outra mídia
      if (!blob) throw new Error('Arquivo não encontrado.');
      this.liberar();
      this.url.set(URL.createObjectURL(blob));
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }

  async excluir(midia: Midia): Promise<void> {
    if (!confirm('Excluir esta mídia? Esta ação não pode ser desfeita.')) return;
    this.excluindo.set(true);
    try {
      await firstValueFrom(this.api.excluir(this.bebeId(), midia.id));
      this.excluida.emit();
      this.fechar.emit();
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    } finally {
      this.excluindo.set(false);
    }
  }

  private liberar(): void {
    const url = this.url();
    if (url) URL.revokeObjectURL(url);
    this.url.set(null);
  }
}
