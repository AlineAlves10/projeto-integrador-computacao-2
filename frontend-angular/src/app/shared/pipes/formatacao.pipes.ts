import { Pipe, PipeTransform } from '@angular/core';
import { calcularIdade, formatarDataBr, formatarDataHoraBr, formatarDuracao, horaDe } from '../utils/datas';
import { formatarTamanho, formatarTelefone } from '../utils/formatos';

// Pipes finos sobre as funções de shared/utils, para os templates não repetirem formatação.

@Pipe({ name: 'dataBr' })
export class DataBrPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return formatarDataBr(valor);
  }
}

@Pipe({ name: 'dataHoraBr' })
export class DataHoraBrPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return formatarDataHoraBr(valor);
  }
}

@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return horaDe(valor);
  }
}

@Pipe({ name: 'idade' })
export class IdadePipe implements PipeTransform {
  transform(dataNascimento: string | null | undefined): string {
    return calcularIdade(dataNascimento);
  }
}

@Pipe({ name: 'duracao' })
export class DuracaoPipe implements PipeTransform {
  transform(minutos: number | null | undefined): string {
    return formatarDuracao(minutos);
  }
}

@Pipe({ name: 'tamanhoArquivo' })
export class TamanhoArquivoPipe implements PipeTransform {
  transform(bytes: number): string {
    return formatarTamanho(bytes);
  }
}

@Pipe({ name: 'telefone' })
export class TelefonePipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return formatarTelefone(valor);
  }
}
