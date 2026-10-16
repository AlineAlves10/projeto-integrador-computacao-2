import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ResumoApi } from '../../core/api/resumo.api';
import { BebeAtivoService } from '../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../core/http/api-error';
import { MensagemComponent } from '../../shared/components/mensagem/mensagem.component';
import { Estatisticas } from '../../shared/models';
import { formatarDuracao, hojeIsoLocal, rotuloDiaSemana, somarDias } from '../../shared/utils/datas';
import { GraficoComponent } from './grafico/grafico.component';

const numeroBr = (valor: number | null | undefined) => (valor ?? 0).toLocaleString('pt-BR');

/** "↑ 12% vs. período anterior" quando os dois períodos têm dados */
function comparar(atual: number | null, anterior: number | null): string {
  if (atual === null || anterior === null || anterior === 0) return 'Sem dados do período anterior para comparar';
  const variacao = Math.round(((atual - anterior) / anterior) * 100);
  if (variacao === 0) return 'Igual ao período anterior';
  return `${variacao > 0 ? '↑' : '↓'} ${Math.abs(variacao)}% vs. período anterior`;
}

/**
 * Médias e evolução de sono, alimentação e fraldas (GET /bebes/{id}/estatisticas). Dias sem registro são lacunas;
 * as médias consideram só os dias com a informação.
 */
@Component({
  selector: 'app-estatisticas',
  imports: [GraficoComponent, MensagemComponent],
  templateUrl: './estatisticas.component.html',
  styleUrl: './estatisticas.component.css',
  host: { class: 'pagina' },
})
export class EstatisticasComponent {
  private readonly api = inject(ResumoApi);
  readonly bebeAtivo = inject(BebeAtivoService);

  readonly periodos = [7, 14, 30];
  readonly dias = signal(7);
  readonly dados = signal<Estatisticas | null>(null);
  readonly erro = signal<string | null>(null);

  readonly rotulos = computed(() => this.dados()?.dias.map(d => rotuloDiaSemana(d.data)) ?? []);
  readonly horasSono = computed(() =>
    this.dados()?.dias.map(d => (d.sonoMinutos === null ? null : Math.round(d.sonoMinutos / 6) / 10)) ?? []);
  readonly volumes = computed(() => this.dados()?.dias.map(d => d.volumeMl) ?? []);

  readonly aviso = computed(() => {
    const d = this.dados();
    if (!d) return null;
    return d.periodo.diasComRegistro === 0
      ? 'Nenhum registro de rotina neste período. As estatísticas aparecem conforme os cuidados forem registrados.'
      : `Baseado em ${d.periodo.diasComRegistro} de ${d.dias.length} dias com registros.`;
  });

  readonly indicadores = computed(() => {
    const d = this.dados();
    if (!d) return null;
    const p = d.periodo;
    const ant = d.periodoAnterior;
    return {
      sono: {
        valor: p.mediaSonoMinutos !== null ? formatarDuracao(p.mediaSonoMinutos) : '—',
        comparacao: p.mediaSonoMinutos !== null ? comparar(p.mediaSonoMinutos, ant.mediaSonoMinutos) : 'Sem períodos de sono encerrados',
      },
      leite: {
        valor: p.mediaVolumeMl !== null ? `${Math.round(p.mediaVolumeMl)} ml` : '—',
        comparacao: p.mediaVolumeMl !== null
          ? `${comparar(p.mediaVolumeMl, ant.mediaVolumeMl)} • ${numeroBr(p.mediaRefeicoes)} refeições/dia`
          : 'Sem mamadeiras com volume informado',
      },
      fraldas: {
        valor: p.mediaFraldas !== null ? numeroBr(p.mediaFraldas) : '—',
        comparacao: p.mediaFraldas !== null ? comparar(p.mediaFraldas, ant.mediaFraldas) : 'Sem registros no período',
        // Médias de trocas em que houve cada eliminação (uma troca com ambos entra nas duas)
        detalhe: p.mediaFraldas !== null
          ? `Com xixi: ${numeroBr(p.mediaTrocasComXixi)}/dia • com cocô: ${numeroBr(p.mediaTrocasComCoco)}/dia`
          : '',
      },
    };
  });

  constructor() {
    effect(() => {
      const bebeId = this.bebeAtivo.id();
      const dias = this.dias();
      untracked(() => void this.carregar(bebeId, dias));
    });
  }

  alterarPeriodo(valor: string): void {
    this.dias.set(Number(valor));
  }

  private async carregar(bebeId: number | null, dias: number): Promise<void> {
    this.erro.set(null);
    this.dados.set(null);
    if (bebeId === null) return;
    const fim = hojeIsoLocal();
    try {
      const dados = await firstValueFrom(this.api.estatisticas(bebeId, somarDias(fim, -(dias - 1)), fim));
      if (bebeId === this.bebeAtivo.id() && dias === this.dias()) this.dados.set(dados);
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    }
  }
}
