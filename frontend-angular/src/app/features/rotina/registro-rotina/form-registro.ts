import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { ConsistenciaFezes, LadoAmamentacao, TipoHorario } from '../../../shared/models';
import { HUMORES_AO_ACORDAR, OpcaoAlimentacao } from './tipos-registro';

/**
 * Um único formulário tipado com os campos de todos os tipos de registro. Cada tipo mostra (e torna
 * obrigatórios, no template) só os seus campos; o RegistroRotinaService envia apenas os campos do tipo.
 */
export type FormRegistro = FormGroup<{
  hora: FormControl<string>;
  observacao: FormControl<string>;
  tipoAlimento: FormControl<OpcaoAlimentacao | ''>;
  lado: FormControl<LadoAmamentacao | ''>;
  duracaoMamada: FormControl<number | null>;
  volume: FormControl<number | null>;
  alimento: FormControl<string>;
  quantidade: FormControl<string>;
  xixi: FormControl<boolean>;
  coco: FormControl<boolean>;
  limpa: FormControl<boolean>;
  consistencia: FormControl<ConsistenciaFezes | ''>;
  sonoInicio: FormControl<string>;
  sonoFim: FormControl<string>;
  sonoLocal: FormControl<string>;
  remedioNome: FormControl<string>;
  remedioDose: FormControl<string>;
  remedioVia: FormControl<string>;
  humor: FormControl<string>;
  encerrarSono: FormControl<boolean>;
  duracao: FormControl<number | null>;
  horarioTipo: FormControl<TipoHorario | ''>;
  horarioQuando: FormControl<string>;
  horarioDescricao: FormControl<string>;
  horarioDetalhes: FormControl<string>;
  horarioLocal: FormControl<string>;
}>;

export type ValoresRegistro = ReturnType<FormRegistro['getRawValue']>;

export function criarFormRegistro(fb: NonNullableFormBuilder): FormRegistro {
  return fb.group({
    hora: '',
    observacao: '',
    tipoAlimento: fb.control<OpcaoAlimentacao | ''>(''),
    lado: fb.control<LadoAmamentacao | ''>(''),
    duracaoMamada: new FormControl<number | null>(null),
    volume: new FormControl<number | null>(null),
    alimento: '',
    quantidade: '',
    xixi: fb.control<boolean>(false),
    coco: fb.control<boolean>(false),
    limpa: fb.control<boolean>(false),
    consistencia: fb.control<ConsistenciaFezes | ''>(''),
    sonoInicio: '',
    sonoFim: '',
    sonoLocal: '',
    remedioNome: '',
    remedioDose: '',
    remedioVia: '',
    humor: HUMORES_AO_ACORDAR[0],
    encerrarSono: fb.control<boolean>(true),
    duracao: new FormControl<number | null>(null),
    horarioTipo: fb.control<TipoHorario | ''>(''),
    horarioQuando: '',
    horarioDescricao: '',
    horarioDetalhes: '',
    horarioLocal: '',
  });
}
