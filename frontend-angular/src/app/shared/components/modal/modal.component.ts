import { Component, HostListener, input, output } from '@angular/core';

/**
 * Diálogo sobreposto com conteúdo projetado. Fecha pelo botão ×, pela tecla Esc e, quando
 * fecharAoClicarFora = true, ao clicar no fundo (desligado em formulários para não perder o que foi digitado).
 */
@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  readonly aberto = input(false);
  readonly titulo = input('');
  readonly largura = input<'normal' | 'larga'>('normal');
  readonly fecharAoClicarFora = input(false);
  readonly fechar = output<void>();

  @HostListener('document:keydown.escape')
  aoPressionarEsc(): void {
    if (this.aberto()) this.fechar.emit();
  }

  aoClicarNoFundo(evento: MouseEvent): void {
    if (this.fecharAoClicarFora() && evento.target === evento.currentTarget) this.fechar.emit();
  }
}
