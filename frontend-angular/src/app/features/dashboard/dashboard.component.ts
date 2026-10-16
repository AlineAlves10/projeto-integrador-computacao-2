import { Component, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HorariosApi } from '../../core/api/horarios.api';
import { ResumoApi } from '../../core/api/resumo.api';
import { BebeAtivoService } from '../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../core/http/api-error';
import { AcoesRapidasComponent } from '../../shared/components/acoes-rapidas/acoes-rapidas.component';
import { MensagemComponent } from '../../shared/components/mensagem/mensagem.component';
import { HorarioPrevisto, ItemLinhaDoTempo, ResumoDia, StatusHorario } from '../../shared/models';
import { hojeIsoLocal } from '../../shared/utils/datas';
import { LinhaDoTempoComponent } from '../rotina/linha-do-tempo/linha-do-tempo.component';
import { RegistroRotinaModalComponent } from '../rotina/registro-rotina/registro-rotina-modal.component';
import { TODAS_AS_ACOES, TipoRegistro } from '../rotina/registro-rotina/tipos-registro';
import { ProximosHorariosComponent } from './proximos-horarios/proximos-horarios.component';
import { ResumoDiaComponent } from './resumo-dia/resumo-dia.component';

/** Painel do dia do bebê ativo: registro rápido, resumo, linha do tempo e próximos horários. */
@Component({
  selector: 'app-dashboard',
  imports: [
    AcoesRapidasComponent, LinhaDoTempoComponent, MensagemComponent, ProximosHorariosComponent,
    RegistroRotinaModalComponent, ResumoDiaComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  host: { class: 'pagina' },
})
export class DashboardComponent {
  private readonly resumoApi = inject(ResumoApi);
  private readonly horariosApi = inject(HorariosApi);
  readonly bebeAtivo = inject(BebeAtivoService);

  readonly acoes = TODAS_AS_ACOES;
  readonly hoje = hojeIsoLocal();

  readonly resumo = signal<ResumoDia | null>(null);
  readonly linhaDoTempo = signal<ItemLinhaDoTempo[] | null>(null);
  readonly erroResumo = signal<string | null>(null);
  readonly erroLinhaDoTempo = signal<string | null>(null);
  readonly erroHorarios = signal<string | null>(null);
  readonly registroAberto = signal<TipoRegistro | null>(null);

  constructor() {
    effect(() => {
      const bebeId = this.bebeAtivo.id();
      untracked(() => this.carregar(bebeId));
    });
  }

  abrirRegistro(tipo: TipoRegistro): void {
    if (!this.bebeAtivo.atual()) {
      alert('Selecione ou cadastre um bebê antes de registrar atividades.');
      return;
    }
    this.registroAberto.set(tipo);
  }

  recarregar(): void {
    this.carregar(this.bebeAtivo.id());
  }

  async alterarHorario(evento: { horario: HorarioPrevisto; status: StatusHorario }): Promise<void> {
    const bebeId = this.bebeAtivo.id();
    if (bebeId === null) return;
    this.erroHorarios.set(null);
    try {
      await firstValueFrom(this.horariosApi.alterarStatus(bebeId, evento.horario.id, evento.status));
      await this.carregarResumo(bebeId);
    } catch (erro) {
      this.erroHorarios.set(textoDoErro(erro));
    }
  }

  private carregar(bebeId: number | null): void {
    this.resumo.set(null);
    this.linhaDoTempo.set(null);
    this.erroResumo.set(null);
    this.erroLinhaDoTempo.set(null);
    this.erroHorarios.set(null);
    if (bebeId === null) return;
    void this.carregarResumo(bebeId);
    void this.carregarLinhaDoTempo(bebeId);
  }

  private async carregarResumo(bebeId: number): Promise<void> {
    try {
      const resumo = await firstValueFrom(this.resumoApi.doDia(bebeId, this.hoje));
      if (bebeId === this.bebeAtivo.id()) this.resumo.set(resumo);
    } catch (erro) {
      this.erroResumo.set(textoDoErro(erro));
    }
  }

  private async carregarLinhaDoTempo(bebeId: number): Promise<void> {
    try {
      const itens = await firstValueFrom(this.resumoApi.linhaDoTempo(bebeId, this.hoje, this.hoje));
      if (bebeId === this.bebeAtivo.id()) this.linhaDoTempo.set(itens);
    } catch (erro) {
      this.erroLinhaDoTempo.set(textoDoErro(erro));
    }
  }
}
