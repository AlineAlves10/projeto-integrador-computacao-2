import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ResumoApi } from '../../core/api/resumo.api';
import { RotinaApi } from '../../core/api/rotina.api';
import { BebeAtivoService } from '../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../core/http/api-error';
import { AcoesRapidasComponent } from '../../shared/components/acoes-rapidas/acoes-rapidas.component';
import { MensagemComponent } from '../../shared/components/mensagem/mensagem.component';
import { DataIso, ItemLinhaDoTempo } from '../../shared/models';
import { agoraIsoLocal, hojeIsoLocal, rotuloDiaPorExtenso } from '../../shared/utils/datas';
import { FiltroLinhaDoTempo, LinhaDoTempoComponent } from './linha-do-tempo/linha-do-tempo.component';
import { RegistroRotinaModalComponent } from './registro-rotina/registro-rotina-modal.component';
import { ACOES_PRINCIPAIS, TipoRegistro } from './registro-rotina/tipos-registro';

/** Histórico de atividades do bebê ativo por data, com registro, exclusão e encerramento de sono. */
@Component({
  selector: 'app-rotina',
  imports: [AcoesRapidasComponent, LinhaDoTempoComponent, MensagemComponent, RegistroRotinaModalComponent],
  templateUrl: './rotina.component.html',
  styleUrl: './rotina.component.css',
  host: { class: 'pagina' },
})
export class RotinaComponent {
  private readonly resumoApi = inject(ResumoApi);
  private readonly rotinaApi = inject(RotinaApi);
  readonly bebeAtivo = inject(BebeAtivoService);

  readonly acoes = ACOES_PRINCIPAIS;
  readonly filtros: { valor: FiltroLinhaDoTempo; rotulo: string }[] = [
    { valor: 'todos', rotulo: 'Todos' },
    { valor: 'alimentacao', rotulo: '🍼 Alimentação' },
    { valor: 'fralda', rotulo: '🧷 Fraldas' },
    { valor: 'sono', rotulo: '💤 Sono' },
    { valor: 'outros', rotulo: '✨ Outros' },
  ];
  readonly hoje = hojeIsoLocal();

  readonly data = signal<DataIso>(this.hoje);
  readonly rotuloData = computed(() => rotuloDiaPorExtenso(this.data()));
  readonly filtro = signal<FiltroLinhaDoTempo>('todos');
  readonly itens = signal<ItemLinhaDoTempo[] | null>(null);
  readonly erro = signal<string | null>(null);
  readonly registroAberto = signal<TipoRegistro | null>(null);

  constructor() {
    effect(() => {
      const bebeId = this.bebeAtivo.id();
      const data = this.data();
      untracked(() => void this.carregar(bebeId, data));
    });
  }

  /** Datas vazias ou futuras são recusadas e o campo volta para a data exibida */
  alterarData(campo: HTMLInputElement): void {
    if (campo.value && campo.value <= this.hoje) this.data.set(campo.value);
    else campo.value = this.data();
  }

  abrirRegistro(tipo: TipoRegistro): void {
    if (!this.bebeAtivo.atual()) {
      alert('Selecione ou cadastre um bebê antes de registrar atividades.');
      return;
    }
    this.registroAberto.set(tipo);
  }

  recarregar(): void {
    void this.carregar(this.bebeAtivo.id(), this.data());
  }

  async excluir(item: ItemLinhaDoTempo): Promise<void> {
    const bebeId = this.bebeAtivo.id();
    if (bebeId === null || !confirm('Excluir este registro?')) return;
    try {
      await firstValueFrom(this.rotinaApi.excluir(bebeId, item.categoria, item.id));
      this.recarregar();
    } catch (erro) {
      alert(textoDoErro(erro));
    }
  }

  async encerrarSono(item: ItemLinhaDoTempo): Promise<void> {
    const bebeId = this.bebeAtivo.id();
    if (bebeId === null) return;
    try {
      await firstValueFrom(this.rotinaApi.encerrarSono(bebeId, item.id, agoraIsoLocal()));
      this.recarregar();
    } catch (erro) {
      alert(textoDoErro(erro));
    }
  }

  private async carregar(bebeId: number | null, data: DataIso): Promise<void> {
    this.erro.set(null);
    this.itens.set(null);
    if (bebeId === null) return;
    try {
      const itens = await firstValueFrom(this.resumoApi.linhaDoTempo(bebeId, data, data));
      // Ignora a resposta se o bebê ou a data mudaram enquanto carregava
      if (bebeId === this.bebeAtivo.id() && data === this.data()) this.itens.set(itens);
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    }
  }
}
