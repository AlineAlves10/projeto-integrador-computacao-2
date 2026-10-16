import { Component, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BebesApi } from '../../../core/api/bebes.api';
import { ArquivosService } from '../../../core/arquivos/arquivos.service';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../../core/http/api-error';
import { FotoBebeComponent } from '../../../shared/components/foto-bebe/foto-bebe.component';
import { MensagemComponent, TipoMensagem } from '../../../shared/components/mensagem/mensagem.component';
import { ROTULO_PAPEL, ROTULO_SEXO } from '../../../shared/models';
import { DataBrPipe, IdadePipe } from '../../../shared/pipes/formatacao.pipes';

/** Dados do bebê ativo e troca/remoção da foto (PUT/DELETE /bebes/{id}/foto). */
@Component({
  selector: 'app-bebe-selecionado',
  imports: [FotoBebeComponent, MensagemComponent, DataBrPipe, IdadePipe],
  templateUrl: './bebe-selecionado.component.html',
  styleUrl: './bebe-selecionado.component.css',
})
export class BebeSelecionadoComponent {
  private readonly api = inject(BebesApi);
  private readonly arquivos = inject(ArquivosService);
  readonly bebeAtivo = inject(BebeAtivoService);

  readonly rotuloPapel = ROTULO_PAPEL;
  readonly rotuloSexo = ROTULO_SEXO;
  readonly novaFoto = signal<File | null>(null);
  readonly salvando = signal(false);
  readonly mensagem = signal<{ texto: string; tipo: TipoMensagem } | null>(null);

  constructor() {
    // Outro bebê selecionado: descarta a prévia e os avisos do anterior
    effect(() => {
      this.bebeAtivo.id();
      untracked(() => {
        this.novaFoto.set(null);
        this.mensagem.set(null);
      });
    });
  }

  async escolherFoto(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const arquivo = entrada.files?.[0] ?? null;
    entrada.value = '';
    if (!arquivo) return;
    const problema = await this.arquivos.validarFotoPerfil(arquivo);
    this.mensagem.set(problema ? { texto: problema, tipo: 'erro' } : null);
    if (!problema) this.novaFoto.set(arquivo);
  }

  async salvarFoto(): Promise<void> {
    const arquivo = this.novaFoto();
    const bebeId = this.bebeAtivo.id();
    if (!arquivo || bebeId === null || !this.bebeAtivo.confirmarContexto(bebeId)) return;
    this.salvando.set(true);
    try {
      this.bebeAtivo.atualizarBebe(await firstValueFrom(this.api.enviarFoto(bebeId, arquivo)));
      this.novaFoto.set(null);
      this.mensagem.set({ texto: 'Foto atualizada.', tipo: 'sucesso' });
    } catch (erro) {
      this.mensagem.set({ texto: textoDoErro(erro), tipo: 'erro' });
    } finally {
      this.salvando.set(false);
    }
  }

  async removerFoto(): Promise<void> {
    const bebe = this.bebeAtivo.atual();
    if (!bebe || !this.bebeAtivo.confirmarContexto(bebe.id) || !confirm('Remover a foto deste bebê?')) return;
    try {
      await firstValueFrom(this.api.removerFoto(bebe.id));
      this.bebeAtivo.atualizarBebe({ ...bebe, possuiFoto: false });
      this.mensagem.set({ texto: 'Foto removida.', tipo: 'sucesso' });
    } catch (erro) {
      this.mensagem.set({ texto: textoDoErro(erro), tipo: 'erro' });
    }
  }
}
