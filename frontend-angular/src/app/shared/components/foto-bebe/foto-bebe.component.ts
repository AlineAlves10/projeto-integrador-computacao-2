import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BebesApi } from '../../../core/api/bebes.api';
import { Bebe } from '../../models';

export const FOTO_PADRAO = 'assets/images/bebe-padrao.svg';

/**
 * Foto redonda do bebê. Mostra o arquivo local escolhido (prévia) ou a foto persistida, baixada com o token
 * (GET /bebes/{id}/foto); sem foto, a imagem padrão. As URLs temporárias (blob:) são liberadas ao trocar e ao sair.
 */
@Component({
  selector: 'app-foto-bebe',
  templateUrl: './foto-bebe.component.html',
  styleUrl: './foto-bebe.component.css',
})
export class FotoBebeComponent {
  private readonly api = inject(BebesApi);

  readonly bebe = input<Bebe | null>(null);
  readonly arquivo = input<File | null>(null);
  readonly tamanho = input<'pequena' | 'normal' | 'grande'>('normal');
  readonly descricao = input('');

  readonly src = signal(FOTO_PADRAO);
  private urlTemporaria: string | null = null;
  private versao = 0;

  constructor() {
    effect(() => {
      const arquivo = this.arquivo();
      const bebe = this.bebe();
      untracked(() => void this.exibir(arquivo, bebe));
    });
    inject(DestroyRef).onDestroy(() => this.liberar());
  }

  private async exibir(arquivo: File | null, bebe: Bebe | null): Promise<void> {
    const versao = ++this.versao;
    this.trocar(arquivo ? URL.createObjectURL(arquivo) : null);
    if (arquivo || !bebe?.possuiFoto) return;
    try {
      const blob = await firstValueFrom(this.api.obterFoto(bebe.id));
      // Ignora a resposta se o componente já passou a mostrar outro bebê
      if (blob && versao === this.versao) this.trocar(URL.createObjectURL(blob));
    } catch {
      // foto indisponível: mantém a imagem padrão
    }
  }

  private trocar(urlTemporaria: string | null): void {
    this.liberar();
    this.urlTemporaria = urlTemporaria;
    this.src.set(urlTemporaria ?? FOTO_PADRAO);
  }

  private liberar(): void {
    if (this.urlTemporaria) URL.revokeObjectURL(this.urlTemporaria);
    this.urlTemporaria = null;
  }
}
