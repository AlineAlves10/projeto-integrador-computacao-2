import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HorariosApi } from '../../../core/api/horarios.api';
import { RotinaApi } from '../../../core/api/rotina.api';
import { SaudeApi } from '../../../core/api/saude.api';
import { AlimentacaoRequest, DataIso, Sono, TipoFralda } from '../../../shared/models';
import { somarDias } from '../../../shared/utils/datas';
import { textoOuNulo } from '../../../shared/utils/validadores';
import { ValoresRegistro } from './form-registro';
import { OPCOES_ALIMENTACAO, TIPO_ATIVIDADE, TipoRegistro } from './tipos-registro';

/**
 * Regras do registro de rotina: converte os valores do formulário na requisição do endpoint de cada tipo,
 * enviando apenas os campos que se aplicam. Erros de preenchimento são lançados como Error com a mensagem.
 */
@Injectable({ providedIn: 'root' })
export class RegistroRotinaService {
  private readonly rotina = inject(RotinaApi);
  private readonly saude = inject(SaudeApi);
  private readonly horarios = inject(HorariosApi);

  /** Sono iniciado e ainda sem fim (ontem ou no dia), para "Hora que acordou" oferecer encerrá-lo. */
  async sonoEmAndamento(bebeId: number, dataBase: DataIso): Promise<Sono | null> {
    const sonos = await firstValueFrom(this.rotina.listarSonos(bebeId, somarDias(dataBase, -1), dataBase));
    return sonos.find(s => !s.fim) ?? null;
  }

  /** Tipo da troca: xixi e cocô juntos = MISTO; "limpa" exclui os dois. */
  tipoDaFralda(v: Pick<ValoresRegistro, 'xixi' | 'coco' | 'limpa'>): TipoFralda | null {
    if (v.xixi && v.coco) return 'MISTO';
    if (v.coco) return 'COCO';
    if (v.xixi) return 'XIXI';
    return v.limpa ? 'LIMPA' : null;
  }

  async salvar(tipo: TipoRegistro, bebeId: number, dataBase: DataIso, v: ValoresRegistro, sonoAberto: Sono | null): Promise<void> {
    const dataHora = `${dataBase}T${v.hora}:00`;
    const observacao = textoOuNulo(v.observacao);

    switch (tipo) {
      case 'alimentacao': {
        if (!v.tipoAlimento) throw new Error('Selecione o tipo de alimentação.');
        const opcao = OPCOES_ALIMENTACAO[v.tipoAlimento];
        let corpo: AlimentacaoRequest;
        if (v.tipoAlimento === 'PEITO') {
          corpo = { tipo: 'PEITO', dataHora, observacao, lado: v.lado || undefined, duracaoMinutos: v.duracaoMamada };
        } else if (opcao.tipoLeite) {
          corpo = { tipo: 'MAMADEIRA', dataHora, observacao, tipoLeite: opcao.tipoLeite, volumeMl: v.volume };
        } else {
          corpo = { tipo: 'SOLIDA', dataHora, observacao, alimento: v.alimento.trim(), quantidade: textoOuNulo(v.quantidade) };
        }
        await firstValueFrom(this.rotina.registrarAlimentacao(bebeId, corpo));
        return;
      }
      case 'fralda': {
        const tipoFralda = this.tipoDaFralda(v);
        if (!tipoFralda) throw new Error('Marque xixi, cocô ou fralda limpa.');
        await firstValueFrom(this.rotina.registrarFralda(bebeId, {
          tipo: tipoFralda,
          dataHora,
          consistenciaCoco: v.coco ? v.consistencia || null : null,
          observacoes: observacao,
        }));
        return;
      }
      case 'sono': {
        // Fim menor que o início: o sono começou no dia anterior
        const diaInicio = v.sonoFim && v.sonoFim < v.sonoInicio ? somarDias(dataBase, -1) : dataBase;
        await firstValueFrom(this.rotina.registrarSono(bebeId, {
          inicio: `${diaInicio}T${v.sonoInicio}:00`,
          fim: v.sonoFim ? `${dataBase}T${v.sonoFim}:00` : null,
          local: textoOuNulo(v.sonoLocal),
        }));
        return;
      }
      case 'remedios':
        await firstValueFrom(this.saude.registrarMedicamento(bebeId, {
          nomeMedicamento: v.remedioNome.trim(),
          dosagem: v.remedioDose.trim(),
          viaAdministracao: textoOuNulo(v.remedioVia),
          dataHora,
          observacoes: null,
        }));
        return;
      case 'acordou':
        if (sonoAberto && v.encerrarSono) {
          await firstValueFrom(this.rotina.encerrarSono(bebeId, sonoAberto.id, dataHora));
        }
        await firstValueFrom(this.rotina.registrarAtividade(bebeId, { tipo: 'ACORDOU', dataHora, descricao: v.humor }));
        return;
      case 'ritual_bom_dia':
      case 'ritual_sono':
      case 'brincar':
        await firstValueFrom(this.rotina.registrarAtividade(bebeId, {
          tipo: TIPO_ATIVIDADE[tipo]!,
          dataHora,
          duracaoMinutos: tipo === 'brincar' ? v.duracao : null,
          descricao: observacao,
        }));
        return;
      case 'banho':
        await firstValueFrom(this.rotina.registrarHigiene(bebeId, { tipo: 'BANHO', dataHora, observacoes: observacao }));
        return;
      case 'horario':
        if (!v.horarioTipo) throw new Error('Selecione o tipo do horário.');
        await firstValueFrom(this.horarios.criar(bebeId, {
          tipo: v.horarioTipo,
          dataHoraPrevista: `${v.horarioQuando}:00`,
          descricao: textoOuNulo(v.horarioDescricao),
          detalhes: textoOuNulo(v.horarioDetalhes),
          local: textoOuNulo(v.horarioLocal),
        }));
        return;
    }
  }
}
