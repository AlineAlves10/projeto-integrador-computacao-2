import { Component, input, output } from '@angular/core';
import { HorarioPrevisto, StatusHorario, TIPOS_HORARIO, descreverHorario } from '../../../shared/models';
import { agoraIsoLocal, formatarDataHoraBr, hojeIsoLocal, horaDe } from '../../../shared/utils/datas';

/** Lembretes pendentes, com marcar como feito / cancelar. Concluir não cria registro de rotina. */
@Component({
  selector: 'app-proximos-horarios',
  templateUrl: './proximos-horarios.component.html',
  styleUrl: './proximos-horarios.component.css',
})
export class ProximosHorariosComponent {
  readonly horarios = input.required<HorarioPrevisto[]>();
  readonly alterarStatus = output<{ horario: HorarioPrevisto; status: StatusHorario }>();

  rotulo(h: HorarioPrevisto): string {
    const descricao = descreverHorario(h);
    return `${TIPOS_HORARIO[h.tipo]?.rotulo ?? h.tipo}${descricao ? ` — ${descricao}` : ''}`;
  }

  quando(h: HorarioPrevisto): string {
    return h.dataHoraPrevista.slice(0, 10) === hojeIsoLocal() ? horaDe(h.dataHoraPrevista) : formatarDataHoraBr(h.dataHoraPrevista);
  }

  atrasado(h: HorarioPrevisto): boolean {
    return h.dataHoraPrevista < agoraIsoLocal();
  }
}
