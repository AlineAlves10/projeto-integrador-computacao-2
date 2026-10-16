import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BebesApi } from '../../../core/api/bebes.api';
import { AuthService } from '../../../core/auth/auth.service';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../../core/http/api-error';
import { CamposBebeComponent } from '../../../shared/components/campos-bebe/campos-bebe.component';
import { criarFormBebe, errosDoBebe, paraNovoBebe } from '../../../shared/components/campos-bebe/form-bebe';
import { MensagemComponent, TipoMensagem } from '../../../shared/components/mensagem/mensagem.component';

/** Cadastro de mais um bebê, já vinculado a quem cadastra. Babás informam o nome do responsável. */
@Component({
  selector: 'app-novo-bebe',
  imports: [ReactiveFormsModule, CamposBebeComponent, MensagemComponent],
  templateUrl: './novo-bebe.component.html',
  styleUrl: './novo-bebe.component.css',
})
export class NovoBebeComponent {
  private readonly api = inject(BebesApi);
  private readonly auth = inject(AuthService);
  private readonly bebeAtivo = inject(BebeAtivoService);

  readonly ehBaba = this.auth.ehBaba();
  readonly form = criarFormBebe(inject(NonNullableFormBuilder), this.ehBaba);
  readonly enviando = signal(false);
  readonly mensagem = signal<{ texto: string; tipo: TipoMensagem } | null>(null);

  async cadastrar(): Promise<void> {
    if (this.enviando()) return; // evita cadastro duplicado por duplo clique
    this.form.markAllAsTouched();
    const erros = errosDoBebe(this.form, 'Bebê');
    if (erros.length) {
      this.mensagem.set({ texto: erros.join(' '), tipo: 'erro' });
      return;
    }
    this.enviando.set(true);
    this.mensagem.set(null);
    try {
      const bebe = await firstValueFrom(this.api.cadastrar({
        ...paraNovoBebe(this.form),
        nomeResponsavel: this.ehBaba ? this.form.controls.nomeResponsavel.value.trim() : null,
      }));
      const foto = this.form.controls.foto.value;
      let avisoFoto = '';
      if (foto) {
        try {
          await firstValueFrom(this.api.enviarFoto(bebe.id, foto));
        } catch (erro) {
          avisoFoto = ` A foto não foi enviada (${textoDoErro(erro)}); tente novamente em "Bebê Selecionado".`;
        }
      }
      const usuario = this.auth.usuario();
      if (usuario) this.auth.salvarBebePreferido(usuario.id, bebe.id);
      await this.bebeAtivo.carregar();
      this.form.reset();
      this.mensagem.set({ texto: `${bebe.nome} foi cadastrado(a) e selecionado(a).${avisoFoto}`, tipo: 'sucesso' });
    } catch (erro) {
      this.mensagem.set({ texto: textoDoErro(erro), tipo: 'erro' });
    } finally {
      this.enviando.set(false);
    }
  }
}
