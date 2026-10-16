import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BebesApi } from '../../../core/api/bebes.api';
import { AuthService } from '../../../core/auth/auth.service';
import { textoDoErro } from '../../../core/http/api-error';
import { CamposBebeComponent } from '../../../shared/components/campos-bebe/campos-bebe.component';
import { FormBebe, criarFormBebe, errosDoBebe, paraNovoBebe } from '../../../shared/components/campos-bebe/form-bebe';
import { FotoBebeComponent } from '../../../shared/components/foto-bebe/foto-bebe.component';
import { MensagemComponent, TipoMensagem } from '../../../shared/components/mensagem/mensagem.component';
import { CadastroRequest, TipoUsuario } from '../../../shared/models';
import { DataBrPipe, IdadePipe } from '../../../shared/pipes/formatacao.pipes';
import { caracteresDeTelefone, obrigatorio, textoOuNulo } from '../../../shared/utils/validadores';

/**
 * Cadastro em duas etapas (preencher e revisar). A conta e todos os bebês são criados em uma única transação
 * (POST /auth/cadastro); depois as fotos são enviadas, cada uma para o bebê correspondente.
 */
@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, CamposBebeComponent, FotoBebeComponent, MensagemComponent, DataBrPipe, IdadePipe],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.css',
})
export class CadastroComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly bebesApi = inject(BebesApi);
  private readonly router = inject(Router);

  readonly bebes = new FormArray<FormBebe>([criarFormBebe(this.fb)]);
  readonly form = this.fb.group({
    tipo: this.fb.control<TipoUsuario>('RESPONSAVEL'),
    nome: ['', [obrigatorio, Validators.maxLength(120)]],
    email: ['', [obrigatorio, Validators.email, Validators.maxLength(150)]],
    telefone: ['', [Validators.maxLength(25), caracteresDeTelefone]],
    senha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72)]],
    quantidade: this.fb.control<'um' | 'varios'>('um'),
  });

  readonly etapa = signal<'edicao' | 'revisao'>('edicao');
  readonly enviando = signal(false);
  readonly mensagem = signal<{ texto: string; tipo: TipoMensagem } | null>(null);

  constructor() {
    this.form.controls.quantidade.valueChanges.pipe(takeUntilDestroyed()).subscribe(valor => this.alterarQuantidade(valor));
  }

  ehResponsavel(): boolean {
    return this.form.controls.tipo.value === 'RESPONSAVEL';
  }

  variosBebes(): boolean {
    return this.form.controls.quantidade.value === 'varios';
  }

  tituloDoBebe(indice: number): string {
    return this.variosBebes() ? `Bebê ${indice + 1}` : 'Dados do Bebê';
  }

  private alterarQuantidade(valor: 'um' | 'varios'): void {
    if (valor === 'um' && this.bebes.length > 1) {
      if (!confirm('Manter apenas o primeiro bebê? Os outros formulários serão descartados.')) {
        this.form.controls.quantidade.setValue('varios', { emitEvent: false });
        return;
      }
      while (this.bebes.length > 1) this.bebes.removeAt(this.bebes.length - 1);
    }
    if (valor === 'varios' && this.bebes.length === 1) this.adicionarBebe();
  }

  adicionarBebe(): void {
    this.bebes.push(criarFormBebe(this.fb));
  }

  removerBebe(indice: number): void {
    if (this.bebes.length > 1) this.bebes.removeAt(indice);
  }

  revisar(): void {
    this.mensagem.set(null);
    this.form.markAllAsTouched();
    this.bebes.markAllAsTouched();
    const erros = this.coletarErros();
    if (erros.length) {
      this.mensagem.set({ texto: erros.join(' '), tipo: 'erro' });
      return;
    }
    this.etapa.set('revisao');
  }

  voltarParaEdicao(): void {
    this.etapa.set('edicao');
  }

  async confirmar(): Promise<void> {
    if (this.enviando()) return; // impede envios repetidos
    this.enviando.set(true);
    this.mensagem.set(null);
    const formsBebes = this.ehResponsavel() ? this.bebes.controls : [];
    const v = this.form.getRawValue();
    const dados: CadastroRequest = {
      nome: v.nome.trim(),
      email: v.email.trim(),
      senha: v.senha,
      telefone: textoOuNulo(v.telefone), // validado e normalizado pelo servidor
      tipo: v.tipo,
      bebes: formsBebes.map(paraNovoBebe),
    };

    try {
      const resposta = await this.auth.cadastrar(dados);
      const fotosComFalha: string[] = [];
      for (const [i, bebe] of resposta.bebes.entries()) {
        const foto = formsBebes[i]?.controls.foto.value;
        if (!foto) continue;
        try {
          await firstValueFrom(this.bebesApi.enviarFoto(bebe.id, foto));
        } catch (erro) {
          fotosComFalha.push(`${bebe.nome}: ${textoDoErro(erro)}`);
        }
      }
      if (resposta.bebes.length) this.auth.salvarBebePreferido(resposta.sessao.usuario.id, resposta.bebes[0].id);

      if (fotosComFalha.length) {
        this.mensagem.set({
          texto: `Cadastro concluído, mas algumas fotos não foram enviadas (${fotosComFalha.join('; ')}). Você pode enviá-las no Perfil. Redirecionando...`,
          tipo: 'sucesso',
        });
        setTimeout(() => void this.router.navigate(['/dashboard']), 4000);
      } else {
        await this.router.navigate(['/dashboard']);
      }
    } catch (erro) {
      this.mensagem.set({ texto: textoDoErro(erro) || 'Falha ao realizar cadastro.', tipo: 'erro' });
      this.etapa.set('edicao');
      this.enviando.set(false);
    }
  }

  private coletarErros(): string[] {
    const c = this.form.controls;
    const erros: string[] = [];
    if (c.nome.invalid) erros.push('Informe seu nome.');
    if (c.email.invalid) erros.push('Informe um e-mail válido.');
    if (c.senha.invalid) erros.push('A senha deve ter pelo menos 6 caracteres.');
    if (c.telefone.invalid) erros.push('Telefone inválido. Use DDD e número, ex.: (11) 98765-4321.');
    if (!this.ehResponsavel()) return erros;

    const chaves = new Set<string>();
    this.bebes.controls.forEach((bebe, i) => {
      const rotulo = this.bebes.length > 1 ? `Bebê ${i + 1}` : 'Bebê';
      erros.push(...errosDoBebe(bebe, rotulo));
      const { nome, dataNascimento } = bebe.getRawValue();
      const chave = `${nome.trim().toLowerCase()}|${dataNascimento}`;
      if (nome.trim() && chaves.has(chave)) {
        erros.push(`${rotulo}: já existe outro formulário com o mesmo nome e data de nascimento.`);
      }
      chaves.add(chave);
    });
    return erros;
  }
}
