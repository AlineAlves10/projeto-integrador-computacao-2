import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { hojeIsoLocal } from '../../utils/datas';
import { SeletorFotoComponent } from '../seletor-foto/seletor-foto.component';
import { FormBebe } from './form-bebe';

let proximoId = 0;

/** Campos de um bebê: nome, nascimento, sexo, (responsável), observações e foto. */
@Component({
  selector: 'app-campos-bebe',
  imports: [ReactiveFormsModule, SeletorFotoComponent],
  templateUrl: './campos-bebe.component.html',
  styleUrl: './campos-bebe.component.css',
})
export class CamposBebeComponent {
  readonly form = input.required<FormBebe>();
  readonly mostrarResponsavel = input(false);
  readonly emLinha = input(false);

  readonly hoje = hojeIsoLocal();
  /** Prefixo único para os ids dos campos (vários formulários de bebê na mesma tela) */
  readonly prefixo = `bebe-${++proximoId}`;
}
