import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { UsuariosApi } from '../../../core/api/usuarios.api';
import { AuthService } from '../../../core/auth/auth.service';
import { textoDoErro } from '../../../core/http/api-error';
import { MensagemComponent, TipoMensagem } from '../../../shared/components/mensagem/mensagem.component';
import { ROTULO_PAPEL } from '../../../shared/models';
import { DataBrPipe, TelefonePipe } from '../../../shared/pipes/formatacao.pipes';
import { formatarTelefone } from '../../../shared/utils/formatos';
import { caracteresDeTelefone } from '../../../shared/utils/validadores';

/** Dados da própria conta (GET /usuarios/me) e telefone de contato (PUT /usuarios/me/telefone; vazio remove). */
@Component({
  selector: 'app-minha-conta',
  imports: [ReactiveFormsModule, MensagemComponent, DataBrPipe, TelefonePipe],
  templateUrl: './minha-conta.component.html',
  styleUrl: './minha-conta.component.css',
})
export class MinhaContaComponent {
  private readonly api = inject(UsuariosApi);
  private readonly auth = inject(AuthService);

  readonly usuario = this.auth.usuario;
  readonly rotuloPapel = ROTULO_PAPEL;
  readonly form = inject(NonNullableFormBuilder).group({
    telefone: [formatarTelefone(this.usuario()?.telefone), [Validators.maxLength(25), caracteresDeTelefone]],
  });
  readonly salvando = signal(false);
  readonly erroConta = signal<string | null>(null);
  readonly mensagem = signal<{ texto: string; tipo: TipoMensagem } | null>(null);

  constructor() {
    void this.atualizar();
  }

  /** Também disponível aqui porque no celular a sidebar (com "Sair") fica oculta */
  sair(): void {
    this.auth.logout();
  }

  async salvarTelefone(): Promise<void> {
    if (this.form.invalid) {
      this.mensagem.set({ texto: 'Telefone inválido. Use DDD e número, ex.: (11) 98765-4321.', tipo: 'erro' });
      return;
    }
    this.salvando.set(true);
    try {
      const usuario = await firstValueFrom(this.api.atualizarTelefone(this.form.controls.telefone.value.trim()));
      this.auth.atualizarUsuario(usuario);
      this.form.setValue({ telefone: formatarTelefone(usuario.telefone) });
      this.mensagem.set({ texto: usuario.telefone ? 'Telefone salvo.' : 'Telefone removido.', tipo: 'sucesso' });
    } catch (erro) {
      this.mensagem.set({ texto: textoDoErro(erro), tipo: 'erro' });
    } finally {
      this.salvando.set(false);
    }
  }

  private async atualizar(): Promise<void> {
    try {
      const usuario = await firstValueFrom(this.api.eu());
      this.auth.atualizarUsuario(usuario);
      this.form.setValue({ telefone: formatarTelefone(usuario.telefone) });
    } catch (erro) {
      this.erroConta.set(textoDoErro(erro));
    }
  }
}
