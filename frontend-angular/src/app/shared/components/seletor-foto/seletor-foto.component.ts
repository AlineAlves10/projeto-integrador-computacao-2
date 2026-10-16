import { Component, ElementRef, forwardRef, inject, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ArquivosService } from '../../../core/arquivos/arquivos.service';
import { FotoBebeComponent } from '../foto-bebe/foto-bebe.component';

/**
 * Escolha de foto com prévia e validação (JPEG, PNG ou WebP até 5 MB). Funciona como controle de formulário:
 * o valor é o File escolhido ou null.
 */
@Component({
  selector: 'app-seletor-foto',
  imports: [FotoBebeComponent],
  templateUrl: './seletor-foto.component.html',
  styleUrl: './seletor-foto.component.css',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SeletorFotoComponent), multi: true }],
})
export class SeletorFotoComponent implements ControlValueAccessor {
  private readonly arquivos = inject(ArquivosService);
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  readonly dica = input('Opcional • JPEG, PNG ou WebP, até 5 MB');

  readonly arquivo = signal<File | null>(null);
  readonly erro = signal<string | null>(null);
  readonly desabilitado = signal(false);

  private aoMudar: (valor: File | null) => void = () => {};
  private aoTocar: () => void = () => {};

  escolher(): void {
    this.campo().nativeElement.click();
  }

  async aoSelecionar(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const escolhido = entrada.files?.[0] ?? null;
    entrada.value = '';
    if (!escolhido) return;
    const problema = await this.arquivos.validarFotoPerfil(escolhido);
    this.erro.set(problema);
    if (problema) return;
    this.definir(escolhido);
  }

  remover(): void {
    this.erro.set(null);
    this.definir(null);
  }

  private definir(arquivo: File | null): void {
    this.arquivo.set(arquivo);
    this.aoMudar(arquivo);
    this.aoTocar();
  }

  writeValue(valor: File | null): void {
    this.arquivo.set(valor ?? null);
    if (!valor) this.erro.set(null);
  }

  registerOnChange(fn: (valor: File | null) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocar = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }
}
