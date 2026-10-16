import { Component, computed, input } from '@angular/core';
import { ResumoDia } from '../../../shared/models';
import { formatarDuracao } from '../../../shared/utils/datas';

const juntar = (partes: (string | false | 0 | null)[]) => partes.filter(Boolean).join(' • ');

/** Resumo de hoje: sono, leite, fraldas e refeições. Valores ausentes aparecem como "—", nunca como zero. */
@Component({
  selector: 'app-resumo-dia',
  templateUrl: './resumo-dia.component.html',
  styleUrl: './resumo-dia.component.css',
})
export class ResumoDiaComponent {
  readonly resumo = input.required<ResumoDia>();

  readonly indicadores = computed(() => {
    const r = this.resumo();
    const vazio = r.totalRegistros === 0;
    return [
      {
        rotulo: 'Sono Total',
        valor: r.sono.minutosTotais !== null ? formatarDuracao(r.sono.minutosTotais) : '—',
        detalhe: juntar([r.sono.periodos && `${r.sono.periodos} período(s)`, r.sono.emAndamento && 'dormindo agora']),
      },
      {
        rotulo: 'Leite Ingerido',
        valor: r.alimentacao.volumeTotalMl !== null ? `${r.alimentacao.volumeTotalMl} ml` : '—',
        detalhe: juntar([
          r.alimentacao.mamadeirasLeiteMaterno && `${r.alimentacao.mamadeirasLeiteMaterno} de leite materno`,
          r.alimentacao.mamadeirasFormula && `${r.alimentacao.mamadeirasFormula} de fórmula`,
          r.alimentacao.mamadeirasSemVolume && `${r.alimentacao.mamadeirasSemVolume} sem volume informado`,
        ]),
      },
      {
        rotulo: 'Fraldas Trocadas',
        valor: vazio ? '—' : `${r.fraldas.trocas} ${r.fraldas.trocas === 1 ? 'troca' : 'trocas'}`,
        // Uma troca com xixi e cocô entra nas duas contagens, mas conta uma vez no total de trocas
        detalhe: r.fraldas.trocas
          ? juntar([
              `${r.fraldas.trocasComXixi} com xixi`,
              `${r.fraldas.trocasComCoco} com cocô`,
              r.fraldas.misto && `${r.fraldas.misto} com ambos`,
              r.fraldas.limpa && `${r.fraldas.limpa} limpa(s)`,
            ])
          : '',
      },
      {
        rotulo: 'Refeições',
        valor: vazio ? '—' : String(r.alimentacao.refeicoes),
        detalhe: juntar([
          r.alimentacao.amamentacoes && `${r.alimentacao.amamentacoes} no peito`,
          r.atividades && `${r.atividades} atividade(s)`,
          r.medicamentos && `${r.medicamentos} medicamento(s)`,
        ]),
      },
    ];
  });
}
