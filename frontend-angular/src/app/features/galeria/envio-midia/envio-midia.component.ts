import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MidiasApi } from '../../../core/api/midias.api';
import { ArquivosService, TIPOS_FOTO, TIPOS_VIDEO } from '../../../core/arquivos/arquivos.service';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../../core/http/api-error';
import { MensagemComponent, TipoMensagem } from '../../../shared/components/mensagem/mensagem.component';

/** Envio de foto ou vídeo para a galeria privada do bebê (formato e tamanho conferidos antes e no servidor). */
@Component({
  selector: 'app-envio-midia',
  imports: [ReactiveFormsModule, MensagemComponent],
  templateUrl: './envio-midia.component.html',
  styleUrl: './envio-midia.component.css',
})
export class EnvioMidiaComponent {
  private readonly api = inject(MidiasApi);
  private readonly arquivos = inject(ArquivosService);
  private readonly bebeAtivo = inject(BebeAtivoService);
  private readonly campoArquivo = viewChild.required<ElementRef<HTMLInputElement>>('campoArquivo');

  readonly bebeId = input.required<number>();
  readonly enviado = output<void>();

  readonly aceitos = [...TIPOS_FOTO, ...TIPOS_VIDEO].join(',');
  readonly form = inject(NonNullableFormBuilder).group({
    arquivo: new FormControl<File | null>(null, Validators.required),
    descricao: ['', Validators.maxLength(300)],
  });
  readonly enviando = signal(false);
  readonly mensagem = signal<{ texto: string; tipo: TipoMensagem } | null>(null);

  aoEscolher(evento: Event): void {
    this.form.controls.arquivo.setValue((evento.target as HTMLInputElement).files?.[0] ?? null);
  }

  async enviar(): Promise<void> {
    const arquivo = this.form.controls.arquivo.value;
    if (!arquivo || this.enviando()) return;
    const bebeId = this.bebeId();
    if (!this.bebeAtivo.confirmarContexto(bebeId)) return;
    this.mensagem.set(null);
    this.enviando.set(true);
    try {
      const tipo = this.arquivos.tipoDaMidia(arquivo);
      const miniatura = tipo === 'VIDEO' ? await this.arquivos.miniaturaDoVideo(arquivo) : null;
      await firstValueFrom(this.api.enviar(bebeId, arquivo, miniatura, this.form.controls.descricao.value.trim()));
      this.form.reset();
      this.campoArquivo().nativeElement.value = '';
      this.mensagem.set({ texto: 'Mídia enviada.', tipo: 'sucesso' });
      this.enviado.emit();
    } catch (erro) {
      this.mensagem.set({ texto: textoDoErro(erro), tipo: 'erro' });
    } finally {
      this.enviando.set(false);
    }
  }
}
