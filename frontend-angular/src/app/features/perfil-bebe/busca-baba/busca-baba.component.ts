import { Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BebesApi } from '../../../core/api/bebes.api';
import { BebeAtivoService } from '../../../core/bebe-ativo/bebe-ativo.service';
import { textoDoErro } from '../../../core/http/api-error';
import { MensagemComponent } from '../../../shared/components/mensagem/mensagem.component';
import { Bebe, FAIXAS_ETARIAS, FaixaEtaria } from '../../../shared/models';
import { IdadePipe } from '../../../shared/pipes/formatacao.pipes';

/** Busca da babá entre os bebês sob os seus cuidados (GET /bebes/baba/{id}: o servidor só aceita o próprio id). */
@Component({
  selector: 'app-busca-baba',
  imports: [ReactiveFormsModule, MensagemComponent, IdadePipe],
  templateUrl: './busca-baba.component.html',
  styleUrl: './busca-baba.component.css',
})
export class BuscaBabaComponent implements OnInit {
  private readonly api = inject(BebesApi);
  readonly bebeAtivo = inject(BebeAtivoService);

  readonly babaId = input.required<number>();

  private readonly fb = inject(NonNullableFormBuilder);
  readonly faixas = FAIXAS_ETARIAS;
  readonly form = this.fb.group({
    nomeBebe: '',
    nomeResponsavel: '',
    faixaEtaria: this.fb.control<FaixaEtaria | ''>(''),
  });
  readonly resultado = signal<Bebe[] | null>(null);
  readonly buscando = signal(false);
  readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    void this.buscar();
  }

  async buscar(): Promise<void> {
    this.erro.set(null);
    this.buscando.set(true);
    try {
      const pagina = await firstValueFrom(this.api.buscarDaBaba(this.babaId(), this.form.getRawValue()));
      this.resultado.set(pagina?.content ?? []);
    } catch (erro) {
      this.resultado.set(null);
      this.erro.set(textoDoErro(erro));
    } finally {
      this.buscando.set(false);
    }
  }
}
