import { DataHoraIso, DataIso } from '../models';

const doisDigitos = (n: number) => String(n).padStart(2, '0');

function paraIso(d: Date): DataIso {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

function deIso(dataIso: DataIso): Date {
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/** Hoje (yyyy-MM-dd) no fuso local; toISOString usaria UTC e viraria o dia após as 21h. */
export function hojeIsoLocal(): DataIso {
  return paraIso(new Date());
}

/** Data e hora local atual no formato aceito pela API (yyyy-MM-ddTHH:mm:00). */
export function agoraIsoLocal(): DataHoraIso {
  const d = new Date();
  return `${hojeIsoLocal()}T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}:00`;
}

/** Hora atual "HH:mm" (valor inicial de campos de horário). */
export function horaAtual(): string {
  return agoraIsoLocal().slice(11, 16);
}

/** Data (yyyy-MM-dd) somada de n dias, no fuso local. */
export function somarDias(dataIso: DataIso, n: number): DataIso {
  const d = deIso(dataIso);
  d.setDate(d.getDate() + n);
  return paraIso(d);
}

/** Idade legível a partir de yyyy-MM-dd (ex.: "6 meses e 14 dias"). */
export function calcularIdade(dataNascimentoIso: DataIso | null | undefined): string {
  if (!dataNascimentoIso) return '';
  const nasc = deIso(dataNascimentoIso);
  const hoje = new Date();

  let meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
  let dias = hoje.getDate() - nasc.getDate();
  if (dias < 0) {
    meses -= 1;
    dias += new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
  }
  if (meses < 0) return 'Data de nascimento no futuro';

  const anos = Math.floor(meses / 12);
  const restoMeses = meses % 12;
  const partes: string[] = [];
  if (anos) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  if (restoMeses) partes.push(`${restoMeses} ${restoMeses === 1 ? 'mês' : 'meses'}`);
  if (dias || partes.length === 0) partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`);
  return partes.join(' e ');
}

/** yyyy-MM-dd(...) -> dd/MM/yyyy */
export function formatarDataBr(dataIso: string | null | undefined): string {
  if (!dataIso) return '—';
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

/** "2026-10-15T08:30:00" -> "08:30" */
export function horaDe(dataHoraIso: string | null | undefined): string {
  return dataHoraIso ? dataHoraIso.slice(11, 16) : '--:--';
}

/** "2026-10-15T08:30:00" -> "15/10/2026 08:30" */
export function formatarDataHoraBr(dataHoraIso: string | null | undefined): string {
  return dataHoraIso ? `${formatarDataBr(dataHoraIso)} ${horaDe(dataHoraIso)}` : '—';
}

/** 95 -> "1h 35min"; null -> "—" */
export function formatarDuracao(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined) return '—';
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (!h) return `${m}min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/** "15 de outubro" (com "Hoje, " quando for o dia atual) */
export function rotuloDiaPorExtenso(dataIso: DataIso): string {
  const texto = deIso(dataIso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  return dataIso === hojeIsoLocal() ? `Hoje, ${texto}` : texto;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** "Seg 13/10" (eixo dos gráficos) */
export function rotuloDiaSemana(dataIso: DataIso): string {
  const d = deIso(dataIso);
  return `${DIAS_SEMANA[d.getDay()]} ${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`;
}
