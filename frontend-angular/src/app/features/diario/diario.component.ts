import { Component, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DiarioApi } from '../../core/api/diario.api';
import { AuthService } from '../../core/auth/auth.service';
import { BebeAtivoService } from '../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../core/http/api-error';
import { MensagemComponent } from '../../shared/components/mensagem/mensagem.component';
import { NotaDiario } from '../../shared/models';
import { NotaCardComponent } from './nota-card/nota-card.component';
import { NotaModalComponent } from './nota-modal/nota-modal.component';

/** Diário do bebê: marcos, humor, saúde e notas livres (GET/POST/PUT/DELETE /bebes/{id}/diario). */
@Component({
  selector: 'app-diario',
  imports: [MensagemComponent, NotaCardComponent, NotaModalComponent],
  templateUrl: './diario.component.html',
  styleUrl: './diario.component.css',
  host: { class: 'pagina' },
})
export class DiarioComponent {
  private readonly api = inject(DiarioApi);
  readonly bebeAtivo = inject(BebeAtivoService);
  readonly usuarioId = inject(AuthService).usuario()?.id ?? null;

  readonly notas = signal<NotaDiario[] | null>(null);
  readonly erro = signal<string | null>(null);
  readonly modalAberto = signal(false);
  readonly notaEmEdicao = signal<NotaDiario | null>(null);

  constructor() {
    effect(() => {
      const bebeId = this.bebeAtivo.id();
      untracked(() => void this.carregar(bebeId, true));
    });
  }

  abrir(nota: NotaDiario | null = null): void {
    if (!this.bebeAtivo.atual()) {
      alert('Selecione ou cadastre um bebê antes de escrever no diário.');
      return;
    }
    this.notaEmEdicao.set(nota);
    this.modalAberto.set(true);
  }

  fechar(): void {
    this.modalAberto.set(false);
    this.notaEmEdicao.set(null);
  }

  recarregar(): void {
    void this.carregar(this.bebeAtivo.id(), false);
  }

  async excluir(nota: NotaDiario): Promise<void> {
    const bebeId = this.bebeAtivo.id();
    if (bebeId === null || !confirm('Excluir esta anotação?')) return;
    try {
      await firstValueFrom(this.api.excluir(bebeId, nota.id));
      this.recarregar();
    } catch (erro) {
      alert(textoDoErro(erro));
    }
  }

  private async carregar(bebeId: number | null, limpar: boolean): Promise<void> {
    this.erro.set(null);
    if (limpar) this.notas.set(null);
    if (bebeId === null) return;
    try {
      const notas = await firstValueFrom(this.api.listar(bebeId));
      if (bebeId === this.bebeAtivo.id()) this.notas.set(notas);
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    }
  }
}
