import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DiarioApi } from '../../../core/api/diario.api';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../../core/http/api-error';
import { MensagemComponent } from '../../../shared/components/mensagem/mensagem.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotaDiario, TAGS_DIARIO, TagDiario } from '../../../shared/models';
import { obrigatorio } from '../../../shared/utils/validadores';

/** Nova anotação ou edição de uma existente (mantém a data original da nota). */
@Component({
  selector: 'app-nota-modal',
  imports: [ReactiveFormsModule, ModalComponent, MensagemComponent],
  templateUrl: './nota-modal.component.html',
  styleUrl: './nota-modal.component.css',
})
export class NotaModalComponent {
  private readonly api = inject(DiarioApi);
  private readonly bebeAtivo = inject(BebeAtivoService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly aberto = input(false);
  /** Nota a editar; null = nova anotação */
  readonly nota = input<NotaDiario | null>(null);
  readonly fechar = output<void>();
  readonly salvo = output<void>();

  readonly opcoes = Object.entries(TAGS_DIARIO) as [TagDiario, { opcao: string }][];
  readonly form = this.fb.group({
    tag: this.fb.control<TagDiario>('MARCO'),
    titulo: ['', [obrigatorio, Validators.maxLength(150)]],
    texto: ['', [obrigatorio, Validators.maxLength(5000)]],
  });
  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly titulo = computed(() =>
    `${this.nota() ? 'Editar Anotação' : 'Nova Anotação no Diário'} — ${this.bebeAtivo.atual()?.nome ?? ''}`);
  private bebeDoFormulario: number | null = null;

  constructor() {
    effect(() => {
      if (!this.aberto()) return;
      const nota = this.nota();
      untracked(() => {
        this.bebeDoFormulario = this.bebeAtivo.id();
        this.erro.set(null);
        this.form.reset(nota ? { tag: nota.tag, titulo: nota.titulo, texto: nota.texto } : { tag: 'MARCO' });
      });
    });
    effect(() => {
      const id = this.bebeAtivo.id();
      if (untracked(this.aberto) && this.bebeDoFormulario !== null && id !== this.bebeDoFormulario) {
        untracked(() => this.fechar.emit());
      }
    });
  }

  async salvar(): Promise<void> {
    if (this.enviando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Preencha o título e a descrição.');
      return;
    }
    if (!this.bebeAtivo.confirmarContexto(this.bebeDoFormulario)) {
      this.fechar.emit();
      return;
    }
    const bebeId = this.bebeDoFormulario!;
    const v = this.form.getRawValue();
    const dados = { titulo: v.titulo.trim(), texto: v.texto.trim(), tag: v.tag };
    const nota = this.nota();
    this.enviando.set(true);
    try {
      await firstValueFrom(nota
        ? this.api.atualizar(bebeId, nota.id, { ...dados, dataHora: nota.dataHora })
        : this.api.criar(bebeId, dados));
      this.salvo.emit();
      this.fechar.emit();
    } catch (erro) {
      this.erro.set(textoDoErro(erro));
    } finally {
      this.enviando.set(false);
    }
  }
}
