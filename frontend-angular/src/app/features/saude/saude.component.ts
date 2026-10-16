import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HorariosApi } from '../../core/api/horarios.api';
import { RecursoSaude, SaudeApi } from '../../core/api/saude.api';
import { BebeAtivoService } from '../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../core/http/api-error';
import { MensagemComponent } from '../../shared/components/mensagem/mensagem.component';
import { Crescimento, HorarioPrevisto, Medicamento, Vacina, descreverHorario } from '../../shared/models';
import { DataBrPipe, DataHoraBrPipe } from '../../shared/pipes/formatacao.pipes';
import { agoraIsoLocal } from '../../shared/utils/datas';
import { formatarNumero } from '../../shared/utils/formatos';
import { RegistroSaudeModalComponent } from './registro-saude-modal/registro-saude-modal.component';

interface Caderneta {
  bebeId: number;
  crescimentos: Crescimento[];
  vacinas: Vacina[];
  medicamentos: Medicamento[];
  proximaConsulta: HorarioPrevisto | null;
}

/** Caderneta de saúde do bebê ativo: biometria com histórico, vacinas, medicamentos e próxima consulta. */
@Component({
  selector: 'app-saude',
  imports: [MensagemComponent, RegistroSaudeModalComponent, DataBrPipe, DataHoraBrPipe],
  templateUrl: './saude.component.html',
  styleUrl: './saude.component.css',
  host: { class: 'pagina' },
})
export class SaudeComponent {
  private readonly saudeApi = inject(SaudeApi);
  private readonly horariosApi = inject(HorariosApi);
  readonly bebeAtivo = inject(BebeAtivoService);

  readonly caderneta = signal<Caderneta | null>(null);
  readonly erro = signal<string | null>(null);
  readonly modalAberto = signal(false);
  readonly numero = formatarNumero;
  readonly descreverHorario = descreverHorario;

  // Últimos valores conhecidos de cada medida (podem vir de medições diferentes; a lista vem da mais recente)
  readonly ultimoPeso = computed(() => this.caderneta()?.crescimentos.find(c => c.pesoKg !== null) ?? null);
  readonly ultimaAltura = computed(() => this.caderneta()?.crescimentos.find(c => c.alturaCm !== null) ?? null);

  constructor() {
    effect(() => {
      const bebeId = this.bebeAtivo.id();
      untracked(() => void this.carregar(bebeId));
    });
  }

  novoRegistro(): void {
    if (!this.bebeAtivo.atual()) {
      this.erro.set('Selecione ou cadastre um bebê antes de registrar.');
      return;
    }
    this.modalAberto.set(true);
  }

  medidas(c: Crescimento): string {
    return [
      c.pesoKg !== null ? `Peso ${this.numero(c.pesoKg, 2)} kg` : '',
      c.alturaCm !== null ? `Comprimento ${this.numero(c.alturaCm, 1)} cm` : '',
      c.perimetroCefalicoCm !== null ? `Perímetro cefálico ${this.numero(c.perimetroCefalicoCm, 1)} cm` : '',
      c.observacoes ?? '',
    ].filter(Boolean).join(' • ');
  }

  async excluir(recurso: RecursoSaude, id: number): Promise<void> {
    const bebeId = this.bebeAtivo.id();
    if (bebeId === null || !confirm('Excluir este registro da caderneta?')) return;
    try {
      await firstValueFrom(this.saudeApi.excluir(bebeId, recurso, id));
      await this.carregar(bebeId);
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    }
  }

  recarregar(): void {
    void this.carregar(this.bebeAtivo.id());
  }

  private async carregar(bebeId: number | null): Promise<void> {
    this.erro.set(null);
    // Outro bebê: não mostra os dados do anterior enquanto carrega
    if (this.caderneta()?.bebeId !== bebeId) this.caderneta.set(null);
    if (bebeId === null) return;
    try {
      const [crescimentos, vacinas, medicamentos, pendentes] = await Promise.all([
        firstValueFrom(this.saudeApi.crescimentos(bebeId)),
        firstValueFrom(this.saudeApi.vacinas(bebeId)),
        firstValueFrom(this.saudeApi.medicamentos(bebeId)),
        firstValueFrom(this.horariosApi.listar(bebeId, { status: 'PENDENTE', desde: agoraIsoLocal() })),
      ]);
      if (bebeId !== this.bebeAtivo.id()) return;
      this.caderneta.set({
        bebeId,
        crescimentos, vacinas, medicamentos,
        proximaConsulta: pendentes.find(h => h.tipo === 'CONSULTA') ?? null,
      });
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    }
  }
}
