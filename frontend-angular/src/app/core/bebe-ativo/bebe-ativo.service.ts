import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Bebe, BebeVinculado } from '../../shared/models';
import { BebesApi } from '../api/bebes.api';
import { AuthService } from '../auth/auth.service';
import { PREFIXO_BEBE_ATIVO } from '../config/armazenamento';

/**
 * Bebê ativo de todas as telas internas. A lista vem de GET /bebes/meus (apenas bebês vinculados ao usuário);
 * a escolha fica salva neste navegador. As telas reagem ao sinal `atual` e recarregam os dados do bebê.
 *
 * Formulários capturam o id do bebê ao abrir e chamam `confirmarContexto(id)` antes de gravar, para não
 * registrar no bebê errado se a seleção mudar (inclusive em outra aba).
 */
@Injectable({ providedIn: 'root' })
export class BebeAtivoService {
  private readonly api = inject(BebesApi);
  private readonly auth = inject(AuthService);

  private readonly vinculos = signal<BebeVinculado[]>([]);
  private readonly idAtual = signal<number | null>(null);
  private readonly carregado = signal(false);

  readonly lista = this.vinculos.asReadonly();
  readonly pronto = this.carregado.asReadonly();
  readonly erro = signal<string | null>(null);

  private readonly vinculoAtual = computed(() => this.vinculos().find(v => v.bebe.id === this.idAtual()) ?? null);
  readonly atual = computed<Bebe | null>(() => this.vinculoAtual()?.bebe ?? null);
  readonly papel = computed(() => this.vinculoAtual()?.papel ?? null);
  readonly id = computed(() => this.vinculoAtual()?.bebe.id ?? null);

  constructor() {
    // Logout ou sessão expirada: nada do usuário anterior fica em memória
    effect(() => {
      if (!this.auth.usuario()) untracked(() => this.limpar());
    });

    // Seleção trocada em outra aba: acompanha aqui também
    const aoMudarEmOutraAba = (e: StorageEvent) => {
      const usuario = this.auth.usuario();
      if (!usuario || e.key !== PREFIXO_BEBE_ATIVO + usuario.id || !e.newValue) return;
      const novo = Number(e.newValue);
      if (novo === this.idAtual()) return;
      if (this.vinculos().some(v => v.bebe.id === novo)) {
        this.idAtual.set(novo);
      } else {
        void this.carregar(); // bebê novo cadastrado na outra aba
      }
    };
    window.addEventListener('storage', aoMudarEmOutraAba);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', aoMudarEmOutraAba));
  }

  /** Carrega os bebês do usuário e define o ativo (o preferido, se ainda permitido, ou o primeiro). */
  async carregar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    this.erro.set(null);
    try {
      const lista = await firstValueFrom(this.api.meus());
      const preferido = this.auth.bebePreferido(usuario.id);
      const escolhido = lista.find(v => v.bebe.id === preferido) ?? lista[0] ?? null;
      this.vinculos.set(lista);
      this.idAtual.set(escolhido?.bebe.id ?? null);
      this.auth.salvarBebePreferido(usuario.id, escolhido?.bebe.id ?? null);
    } catch (erro) {
      this.erro.set(erro instanceof Error ? erro.message : 'Não foi possível carregar os bebês.');
    } finally {
      this.carregado.set(true);
    }
  }

  /** Troca o bebê ativo (só entre os bebês permitidos). */
  selecionar(bebeId: number): void {
    const usuario = this.auth.usuario();
    if (!usuario || !this.vinculos().some(v => v.bebe.id === bebeId)) return;
    this.auth.salvarBebePreferido(usuario.id, bebeId);
    this.idAtual.set(bebeId);
  }

  /** Dados do bebê alterados (ex.: foto) sem recarregar a lista */
  atualizarBebe(bebe: Bebe): void {
    this.vinculos.update(lista => lista.map(v => (v.bebe.id === bebe.id ? { ...v, bebe } : v)));
  }

  /**
   * Antes de gravar: o bebê do formulário ainda é o ativo? Se não, avisa e devolve false
   * (quem chamou deve fechar o formulário sem enviar).
   */
  confirmarContexto(bebeIdDoFormulario: number | null): boolean {
    const usuario = this.auth.usuario();
    const salvo = usuario ? this.auth.bebePreferido(usuario.id) : null;
    if (bebeIdDoFormulario === null || bebeIdDoFormulario !== this.idAtual() || salvo !== bebeIdDoFormulario) {
      if (salvo !== null && salvo !== this.idAtual() && this.vinculos().some(v => v.bebe.id === salvo)) {
        this.idAtual.set(salvo);
      }
      alert('O bebê selecionado mudou. O formulário foi fechado para evitar registrar no bebê errado.');
      return false;
    }
    return true;
  }

  private limpar(): void {
    this.vinculos.set([]);
    this.idAtual.set(null);
    this.carregado.set(false);
  }
}
