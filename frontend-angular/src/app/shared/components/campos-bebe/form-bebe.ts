import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { NovoBebe, Sexo } from '../../models';
import { naoFuturo, obrigatorio } from '../../utils/validadores';

export type FormBebe = FormGroup<{
  nome: FormControl<string>;
  dataNascimento: FormControl<string>;
  sexo: FormControl<Sexo | ''>;
  observacoes: FormControl<string>;
  nomeResponsavel: FormControl<string>;
  foto: FormControl<File | null>;
}>;

/** Formulário de um bebê (cadastro da conta e "Cadastrar Novo Bebê"). Babás informam o nome do responsável. */
export function criarFormBebe(fb: NonNullableFormBuilder, exigirResponsavel = false): FormBebe {
  return fb.group({
    nome: fb.control('', [obrigatorio, Validators.maxLength(120)]),
    dataNascimento: fb.control('', [obrigatorio, naoFuturo]),
    sexo: fb.control<Sexo | ''>('', obrigatorio),
    observacoes: fb.control('', [obrigatorio, Validators.maxLength(255)]),
    nomeResponsavel: fb.control('', exigirResponsavel ? [obrigatorio, Validators.maxLength(120)] : Validators.maxLength(120)),
    foto: new FormControl<File | null>(null),
  });
}

/** Mensagens no padrão das telas anteriores (ex.: "Bebê 2: informe o nome."). */
export function errosDoBebe(form: FormBebe, rotulo: string): string[] {
  const c = form.controls;
  const erros: string[] = [];
  if (c.nome.hasError('obrigatorio')) erros.push(`${rotulo}: informe o nome.`);
  if (c.dataNascimento.hasError('obrigatorio')) erros.push(`${rotulo}: informe a data de nascimento.`);
  if (c.dataNascimento.hasError('futuro')) erros.push(`${rotulo}: a data de nascimento não pode estar no futuro.`);
  if (c.sexo.hasError('obrigatorio')) erros.push(`${rotulo}: selecione o sexo.`);
  if (c.observacoes.hasError('obrigatorio')) erros.push(`${rotulo}: preencha as observações (ex.: "Nenhuma").`);
  if (c.nomeResponsavel.hasError('obrigatorio')) erros.push(`${rotulo}: informe o nome do responsável pelo bebê.`);
  return erros;
}

/** Dados do bebê para a API (a foto segue à parte, em PUT /bebes/{id}/foto). */
export function paraNovoBebe(form: FormBebe): NovoBebe {
  const v = form.getRawValue();
  return {
    nome: v.nome.trim(),
    dataNascimento: v.dataNascimento,
    sexo: v.sexo as Sexo,
    observacoes: v.observacoes.trim(),
    nomeResponsavel: v.nomeResponsavel.trim() || null,
  };
}
