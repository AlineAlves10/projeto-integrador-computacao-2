import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HorariosApi } from '../../../core/api/horarios.api';
import { SaudeApi } from '../../../core/api/saude.api';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../../core/http/api-error';
import { MensagemComponent } from '../../../shared/components/mensagem/mensagem.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { agoraIsoLocal, hojeIsoLocal } from '../../../shared/utils/datas';
import { textoOuNulo } from '../../../shared/utils/validadores';

export type TipoRegistroSaude = 'crescimento' | 'vacina' | 'medicamento' | 'consulta';

/**
 * Novo registro da caderneta: medidas (cada medição é um registro novo, o histórico é preservado), vacina,
 * medicamento administrado ou consulta agendada (horário previsto do tipo CONSULTA).
 */
@Component({
  selector: 'app-registro-saude-modal',
  imports: [ReactiveFormsModule, ModalComponent, MensagemComponent],
  templateUrl: './registro-saude-modal.component.html',
  styleUrl: './registro-saude-modal.component.css',
})
export class RegistroSaudeModalComponent {
  private readonly saudeApi = inject(SaudeApi);
  private readonly horariosApi = inject(HorariosApi);
  private readonly bebeAtivo = inject(BebeAtivoService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly aberto = input(false);
  readonly fechar = output<void>();
  readonly salvo = output<void>();

  readonly hoje = hojeIsoLocal();
  readonly form = this.fb.group({
    tipo: this.fb.control<TipoRegistroSaude>('crescimento'),
    crescData: '',
    peso: new FormControl<number | null>(null),
    altura: new FormControl<number | null>(null),
    perimetro: new FormControl<number | null>(null),
    vacNome: '',
    vacDose: '',
    vacData: '',
    vacProxima: '',
    medNome: '',
    medDose: '',
    medVia: '',
    medQuando: '',
    consQuando: '',
    consDescricao: '',
    consMotivo: '',
    consLocal: '',
    observacoes: '',
  });
  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);
  private bebeDoFormulario: number | null = null;

  constructor() {
    effect(() => {
      if (this.aberto()) untracked(() => this.preparar());
    });
    effect(() => {
      const id = this.bebeAtivo.id();
      if (untracked(this.aberto) && this.bebeDoFormulario !== null && id !== this.bebeDoFormulario) {
        untracked(() => this.fechar.emit());
      }
    });
  }

  titulo(): string {
    return `Novo Registro de Saúde — ${this.bebeAtivo.atual()?.nome ?? ''}`;
  }

  private preparar(): void {
    this.bebeDoFormulario = this.bebeAtivo.id();
    this.erro.set(null);
    this.form.reset({
      tipo: 'crescimento',
      crescData: hojeIsoLocal(),
      vacData: hojeIsoLocal(),
      medQuando: agoraIsoLocal().slice(0, 16),
    });
  }

  async salvar(): Promise<void> {
    if (this.enviando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Preencha os campos obrigatórios.');
      return;
    }
    if (!this.bebeAtivo.confirmarContexto(this.bebeDoFormulario)) {
      this.fechar.emit();
      return;
    }
    const bebeId = this.bebeDoFormulario!;
    const v = this.form.getRawValue();
    const observacoes = textoOuNulo(v.observacoes);
    this.enviando.set(true);
    this.erro.set(null);
    try {
      switch (v.tipo) {
        case 'crescimento':
          if (v.peso === null && v.altura === null && v.perimetro === null) throw new Error('Informe ao menos uma medida.');
          await firstValueFrom(this.saudeApi.registrarCrescimento(bebeId, {
            dataRegistro: v.crescData, pesoKg: v.peso, alturaCm: v.altura, perimetroCefalicoCm: v.perimetro, observacoes,
          }));
          break;
        case 'vacina':
          await firstValueFrom(this.saudeApi.registrarVacina(bebeId, {
            nomeVacina: v.vacNome.trim(), dose: v.vacDose.trim(), dataAplicacao: v.vacData,
            proximaDose: v.vacProxima || null, observacoes,
          }));
          break;
        case 'medicamento':
          await firstValueFrom(this.saudeApi.registrarMedicamento(bebeId, {
            nomeMedicamento: v.medNome.trim(), dosagem: v.medDose.trim(), viaAdministracao: textoOuNulo(v.medVia),
            dataHora: `${v.medQuando}:00`, observacoes,
          }));
          break;
        case 'consulta':
          await firstValueFrom(this.horariosApi.criar(bebeId, {
            tipo: 'CONSULTA', dataHoraPrevista: `${v.consQuando}:00`, descricao: textoOuNulo(v.consDescricao),
            detalhes: textoOuNulo(v.consMotivo), local: textoOuNulo(v.consLocal),
          }));
          break;
      }
      this.salvo.emit();
      this.fechar.emit();
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    } finally {
      this.enviando.set(false);
    }
  }
}
