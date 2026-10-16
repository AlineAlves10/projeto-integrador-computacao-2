import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { ROTULO_PAPEL } from '../../models';
import { IdadePipe } from '../../pipes/formatacao.pipes';
import { FotoBebeComponent } from '../foto-bebe/foto-bebe.component';
import { MensagemComponent } from '../mensagem/mensagem.component';

/** Bebê ativo no topo das telas internas, com a lista para trocar quando o usuário tem mais de um. */
@Component({
  selector: 'app-seletor-bebe',
  imports: [RouterLink, FotoBebeComponent, MensagemComponent, IdadePipe],
  templateUrl: './seletor-bebe.component.html',
  styleUrl: './seletor-bebe.component.css',
})
export class SeletorBebeComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly bebeAtivo = inject(BebeAtivoService);
  readonly rotuloPapel = ROTULO_PAPEL;
  readonly listaAberta = signal(false);

  alternarLista(): void {
    this.listaAberta.update(aberta => !aberta);
  }

  selecionar(bebeId: number): void {
    this.listaAberta.set(false);
    this.bebeAtivo.selecionar(bebeId);
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: MouseEvent): void {
    if (!this.host.nativeElement.contains(evento.target as Node)) this.listaAberta.set(false);
  }

  @HostListener('document:keydown.escape')
  aoPressionarEsc(): void {
    this.listaAberta.set(false);
  }
}
