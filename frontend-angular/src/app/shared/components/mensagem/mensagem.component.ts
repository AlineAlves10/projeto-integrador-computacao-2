import { Component, input } from '@angular/core';

export type TipoMensagem = 'erro' | 'sucesso' | 'aviso';

/** Aviso dentro de cartões e formulários (erro, sucesso ou informação). Sem texto, não ocupa espaço. */
@Component({
  selector: 'app-mensagem',
  templateUrl: './mensagem.component.html',
  styleUrl: './mensagem.component.css',
})
export class MensagemComponent {
  readonly texto = input<string | null | undefined>(null);
  readonly tipo = input<TipoMensagem>('erro');
}
