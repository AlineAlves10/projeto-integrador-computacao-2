import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../../core/http/api-error';
import { MensagemComponent } from '../../../shared/components/mensagem/mensagem.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { DataIso, Sono, TIPOS_HORARIO, TipoHorario } from '../../../shared/models';
import { DataHoraBrPipe } from '../../../shared/pipes/formatacao.pipes';
import { horaAtual } from '../../../shared/utils/datas';
import { criarFormRegistro } from './form-registro';
import { RegistroRotinaService } from './registro-rotina.service';
import { HUMORES_AO_ACORDAR, OPCOES_ALIMENTACAO, OpcaoAlimentacao, TITULOS_REGISTRO, TipoRegistro } from './tipos-registro';

/**
 * Formulário de registro de rotina (dashboard e rotina). Abre quando `tipo` recebe um valor; grava no bebê
 * ativo no momento da abertura e fecha sozinho se o bebê ativo mudar antes do envio.
 */
@Component({
  selector: 'app-registro-rotina-modal',
  imports: [NgTemplateOutlet, ReactiveFormsModule, ModalComponent, MensagemComponent, DataHoraBrPipe],
  templateUrl: './registro-rotina-modal.component.html',
  styleUrl: './registro-rotina-modal.component.css',
})
export class RegistroRotinaModalComponent {
  private readonly bebeAtivo = inject(BebeAtivoService);
  private readonly registro = inject(RegistroRotinaService);

  /** Tipo a registrar; null = fechado */
  readonly tipo = input<TipoRegistro | null>(null);
  /** Dia usado nos campos de horário (dashboard: hoje; rotina: data escolhida) */
  readonly dataBase = input.required<DataIso>();
  readonly fechar = output<void>();
  readonly salvo = output<void>();

  readonly form = criarFormRegistro(inject(NonNullableFormBuilder));
  readonly opcoesAlimentacao = Object.entries(OPCOES_ALIMENTACAO) as [OpcaoAlimentacao, { rotulo: string }][];
  readonly tiposHorario = Object.entries(TIPOS_HORARIO) as [TipoHorario, (typeof TIPOS_HORARIO)[TipoHorario]][];
  readonly humores = HUMORES_AO_ACORDAR;

  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sonoAberto = signal<Sono | null>(null);
  readonly horarioTipo = signal<TipoHorario | ''>('');
  private bebeDoFormulario: number | null = null;

  readonly titulo = computed(() => {
    const tipo = this.tipo();
    return tipo ? `${TITULOS_REGISTRO[tipo]} — ${this.bebeAtivo.atual()?.nome ?? ''}` : '';
  });
  readonly configHorario = computed(() => {
    const tipo = this.horarioTipo();
    return tipo ? TIPOS_HORARIO[tipo] : null;
  });

  constructor() {
    effect(() => {
      const tipo = this.tipo();
      if (tipo) untracked(() => this.preparar(tipo));
    });
    // Bebê trocado (nesta ou em outra aba) com o formulário aberto: fecha sem gravar
    effect(() => {
      const id = this.bebeAtivo.id();
      if (untracked(this.tipo) && this.bebeDoFormulario !== null && id !== this.bebeDoFormulario) {
        untracked(() => this.fechar.emit());
      }
    });
    // Ao mudar o tipo de horário, os campos começam vazios
    this.form.controls.horarioTipo.valueChanges.pipe(takeUntilDestroyed()).subscribe(tipo => {
      this.horarioTipo.set(tipo);
      this.form.patchValue({ horarioDescricao: '', horarioDetalhes: '', horarioLocal: '' });
    });
  }

  private preparar(tipo: TipoRegistro): void {
    const bebeId = this.bebeAtivo.id();
    this.bebeDoFormulario = bebeId;
    this.erro.set(null);
    this.sonoAberto.set(null);
    this.horarioTipo.set('');
    const agora = horaAtual();
    this.form.reset({ hora: agora, sonoInicio: agora });
    if (tipo === 'acordou' && bebeId !== null) void this.buscarSonoAberto(bebeId);
  }

  private async buscarSonoAberto(bebeId: number): Promise<void> {
    try {
      const sono = await this.registro.sonoEmAndamento(bebeId, this.dataBase());
      if (this.bebeDoFormulario === bebeId) this.sonoAberto.set(sono);
    } catch {
      // sem a consulta, apenas não oferece encerrar o sono
    }
  }

  /** Xixi e cocô podem ser marcados juntos; "limpa" desmarca os dois (e vice-versa). */
  ajustarFralda(origem: 'xixi' | 'coco' | 'limpa', marcado: boolean): void {
    if (!marcado) return;
    if (origem === 'limpa') this.form.patchValue({ xixi: false, coco: false });
    else this.form.controls.limpa.setValue(false);
  }

  async salvar(): Promise<void> {
    const tipo = this.tipo();
    if (!tipo || this.enviando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Preencha os campos obrigatórios.');
      return;
    }
    if (!this.bebeAtivo.confirmarContexto(this.bebeDoFormulario)) {
      this.fechar.emit();
      return;
    }
    this.enviando.set(true); // evita registros duplicados por duplo clique
    this.erro.set(null);
    try {
      await this.registro.salvar(tipo, this.bebeDoFormulario!, this.dataBase(), this.form.getRawValue(), this.sonoAberto());
      this.salvo.emit();
      this.fechar.emit();
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    } finally {
      this.enviando.set(false);
    }
  }
}
