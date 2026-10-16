import { Component, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MidiasApi } from '../../core/api/midias.api';
import { BebeAtivoService } from '../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../core/http/api-error';
import { MensagemComponent } from '../../shared/components/mensagem/mensagem.component';
import { Midia } from '../../shared/models';
import { EnvioMidiaComponent } from './envio-midia/envio-midia.component';
import { MidiaCartaoComponent } from './midia-cartao/midia-cartao.component';
import { VisualizadorMidiaComponent } from './visualizador-midia/visualizador-midia.component';

const TAMANHO_PAGINA = 12;

/** Galeria privada de fotos e vídeos do bebê ativo, paginada (mais recentes primeiro). */
@Component({
  selector: 'app-galeria',
  imports: [EnvioMidiaComponent, MensagemComponent, MidiaCartaoComponent, VisualizadorMidiaComponent],
  templateUrl: './galeria.component.html',
  styleUrl: './galeria.component.css',
  host: { class: 'pagina' },
})
export class GaleriaComponent {
  private readonly api = inject(MidiasApi);
  readonly bebeAtivo = inject(BebeAtivoService);

  readonly midias = signal<Midia[]>([]);
  readonly totalItens = signal<number | null>(null);
  readonly haMais = signal(false);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aberta = signal<Midia | null>(null);
  private proximaPagina = 0;

  constructor() {
    effect(() => {
      const bebeId = this.bebeAtivo.id();
      untracked(() => {
        this.aberta.set(null);
        void this.recomecar(bebeId);
      });
    });
  }

  recarregar(): void {
    void this.recomecar(this.bebeAtivo.id());
  }

  async carregarMais(): Promise<void> {
    const bebeId = this.bebeAtivo.id();
    if (bebeId === null || this.carregando()) return;
    this.carregando.set(true);
    try {
      const pagina = await firstValueFrom(this.api.listar(bebeId, this.proximaPagina, TAMANHO_PAGINA));
      if (bebeId !== this.bebeAtivo.id()) return;
      this.midias.update(atuais => [...atuais, ...pagina.itens]);
      this.totalItens.set(pagina.totalItens);
      this.proximaPagina = pagina.pagina + 1;
      this.haMais.set(this.proximaPagina < pagina.totalPaginas);
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }

  private async recomecar(bebeId: number | null): Promise<void> {
    this.midias.set([]);
    this.totalItens.set(null);
    this.haMais.set(false);
    this.erro.set(null);
    this.proximaPagina = 0;
    this.carregando.set(false);
    if (bebeId !== null) await this.carregarMais();
  }
}
