import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { textoDoErro } from '../../../core/http/api-error';
import { MensagemComponent, TipoMensagem } from '../../../shared/components/mensagem/mensagem.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MensagemComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });
  readonly enviando = signal(false);
  readonly mensagem = signal<{ texto: string; tipo: TipoMensagem } | null>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('sessao') === 'expirada'
      ? { texto: 'Sua sessão expirou. Faça login novamente.', tipo: 'erro' }
      : null,
  );

  async entrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagem.set({ texto: 'Informe e-mail e senha válidos.', tipo: 'erro' });
      return;
    }
    this.enviando.set(true);
    this.mensagem.set(null);
    try {
      const { email, senha } = this.form.getRawValue();
      await this.auth.login(email.trim(), senha);
      await this.router.navigate(['/dashboard']);
    } catch (erro) {
      this.mensagem.set({ texto: textoDoErro(erro), tipo: 'erro' });
    } finally {
      this.enviando.set(false);
    }
  }
}
