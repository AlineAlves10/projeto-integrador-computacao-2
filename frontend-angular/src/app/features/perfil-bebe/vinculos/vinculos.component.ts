import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { VinculosApi } from '../../../core/api/vinculos.api';
import { AuthService } from '../../../core/auth/auth.service';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../../core/http/api-error';
import { MensagemComponent, TipoMensagem } from '../../../shared/components/mensagem/mensagem.component';
import { Contato, ContatosBebe, ROTULO_PAPEL } from '../../../shared/models';
import { DataBrPipe } from '../../../shared/pipes/formatacao.pipes';

/**
 * Pessoas vinculadas ao bebê e seus contatos. O telefone só vem do servidor quando o usuário pode vê-lo
 * (babá vê o responsável; responsável vê a babá). Quem pode vincular ou remover também é decidido no servidor.
 */
@Component({
  selector: 'app-vinculos',
  imports: [ReactiveFormsModule, MensagemComponent, DataBrPipe],
  templateUrl: './vinculos.component.html',
  styleUrl: './vinculos.component.css',
})
export class VinculosComponent {
  private readonly api = inject(VinculosApi);
  private readonly auth = inject(AuthService);
  private readonly bebeAtivo = inject(BebeAtivoService);

  readonly bebeId = input.required<number>();

  readonly rotuloPapel = ROTULO_PAPEL;
  readonly dados = signal<ContatosBebe | null>(null);
  readonly enviando = signal(false);
  readonly mensagem = signal<{ texto: string; tipo: TipoMensagem } | null>(null);
  readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  constructor() {
    effect(() => {
      const bebeId = this.bebeId();
      untracked(() => {
        this.mensagem.set(null);
        this.form.reset();
        void this.carregar(bebeId, true);
      });
    });
  }

  async vincular(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagem.set({ texto: 'Informe um e-mail válido.', tipo: 'erro' });
      return;
    }
    const bebeId = this.bebeId();
    if (!this.bebeAtivo.confirmarContexto(bebeId)) return;
    this.enviando.set(true);
    this.mensagem.set(null);
    try {
      await firstValueFrom(this.api.vincularPorEmail(bebeId, this.form.controls.email.value.trim()));
      this.form.reset();
      this.mensagem.set({ texto: 'Pessoa vinculada ao bebê.', tipo: 'sucesso' });
      await this.carregar(bebeId, false);
    } catch (erro) {
      // O back-end devolve texto descritivo (ex.: "Usuário já está vinculado a este bebê")
      this.mensagem.set({ texto: textoDoErro(erro), tipo: 'erro' });
    } finally {
      this.enviando.set(false);
    }
  }

  async remover(contato: Contato): Promise<void> {
    const bebeId = this.bebeId();
    const pergunta = contato.voce
      ? 'Remover o seu próprio vínculo? Você perderá o acesso a este bebê.'
      : 'Remover este usuário do bebê?';
    if (!this.bebeAtivo.confirmarContexto(bebeId) || !confirm(pergunta)) return;
    try {
      await firstValueFrom(this.api.remover(bebeId, contato.usuarioId));
      if (contato.voce) {
        // Sem acesso a este bebê: escolhe outro (ou nenhum)
        const usuario = this.auth.usuario();
        if (usuario) this.auth.salvarBebePreferido(usuario.id, null);
        await this.bebeAtivo.carregar();
        return;
      }
      this.mensagem.set({ texto: 'Vínculo removido.', tipo: 'sucesso' });
      await this.carregar(bebeId, false);
    } catch (erro) {
      this.mensagem.set({ texto: textoDoErro(erro), tipo: 'erro' });
    }
  }

  private async carregar(bebeId: number, limpar: boolean): Promise<void> {
    if (limpar) this.dados.set(null);
    try {
      const dados = await firstValueFrom(this.api.contatos(bebeId));
      if (bebeId === this.bebeId()) this.dados.set(dados);
    } catch (erro) {
      this.mensagem.set({ texto: textoDoErro(erro), tipo: 'erro' });
    }
  }
}
