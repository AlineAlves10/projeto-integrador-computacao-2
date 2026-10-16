import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CadastroRequest, CadastroResponse, Sessao, Usuario } from '../../shared/models';
import { API_URL } from '../config/api-url.token';
import { CHAVE_TOKEN, CHAVE_USUARIO, PREFIXO_BEBE_ATIVO } from '../config/armazenamento';

/**
 * Sessão do usuário (token JWT emitido por POST /auth/login e /auth/cadastro). A validação definitiva é sempre
 * do servidor; aqui só se evita mostrar telas internas com um token já expirado.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(API_URL);

  private readonly tokenAtual = signal<string | null>(localStorage.getItem(CHAVE_TOKEN));
  private readonly usuarioAtual = signal<Usuario | null>(lerUsuario());

  readonly token = this.tokenAtual.asReadonly();
  readonly usuario = this.usuarioAtual.asReadonly();
  readonly ehBaba = computed(() => this.usuarioAtual()?.tipo === 'BABA');

  async login(email: string, senha: string): Promise<Usuario> {
    const sessao = await firstValueFrom(this.http.post<Sessao>(`${this.apiUrl}/auth/login`, { email, senha }));
    this.salvarSessao(sessao);
    return sessao.usuario;
  }

  /** Conta e bebês em uma única transação no servidor; a sessão já volta autenticada. */
  async cadastrar(dados: CadastroRequest): Promise<CadastroResponse> {
    const resposta = await firstValueFrom(this.http.post<CadastroResponse>(`${this.apiUrl}/auth/cadastro`, dados));
    this.salvarSessao(resposta.sessao);
    return resposta;
  }

  /** Dados da própria conta atualizados (ex.: telefone) */
  atualizarUsuario(usuario: Usuario): void {
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    this.usuarioAtual.set(usuario);
  }

  /** Há token e ele ainda não expirou? */
  estaAutenticado(): boolean {
    const token = this.tokenAtual();
    if (!token || !this.usuarioAtual()) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
      return !payload.exp || payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  logout(): void {
    this.encerrarSessao(false);
  }

  /** Limpa a sessão e volta ao login; expirada = mostra o aviso de sessão expirada. */
  encerrarSessao(expirada: boolean): void {
    this.descartarSessaoLocal();
    void this.router.navigate(['/login'], expirada ? { queryParams: { sessao: 'expirada' } } : {});
  }

  /** Remove token e usuário salvos (ex.: token vencido encontrado ao abrir o app), sem navegar. */
  descartarSessaoLocal(): void {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    this.tokenAtual.set(null);
    this.usuarioAtual.set(null);
  }

  // Bebê escolhido: preferência deste navegador por usuário (a lista permitida vem sempre de GET /bebes/meus)
  bebePreferido(usuarioId: number): number | null {
    const valor = localStorage.getItem(PREFIXO_BEBE_ATIVO + usuarioId);
    return valor ? Number(valor) : null;
  }

  salvarBebePreferido(usuarioId: number, bebeId: number | null): void {
    if (bebeId === null) {
      localStorage.removeItem(PREFIXO_BEBE_ATIVO + usuarioId);
    } else {
      localStorage.setItem(PREFIXO_BEBE_ATIVO + usuarioId, String(bebeId));
    }
  }

  private salvarSessao(sessao: Sessao): void {
    localStorage.setItem(CHAVE_TOKEN, sessao.token);
    this.tokenAtual.set(sessao.token);
    this.atualizarUsuario(sessao.usuario);
  }
}

function lerUsuario(): Usuario | null {
  try {
    const bruto = localStorage.getItem(CHAVE_USUARIO);
    return bruto ? (JSON.parse(bruto) as Usuario) : null;
  } catch {
    return null;
  }
}
