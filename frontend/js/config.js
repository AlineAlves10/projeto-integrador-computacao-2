/**
 * config.js - Configuração central do Frontend
 * Projeto Integrador: Babá Premium
 *
 * Único lugar onde a URL da API é definida. Deve ser carregado antes de api.js e auth.js.
 * Os controllers do Spring Boot não usam prefixo (/usuarios, /bebes, ...), por isso não há "/api" aqui.
 */
window.APP_CONFIG = {
  API_BASE_URL: "http://localhost:8080"
};

/** Data de hoje no formato yyyy-MM-dd usando o fuso local (toISOString usaria UTC e viraria o dia após as 21h). */
function hojeIsoLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Escapa texto vindo da API antes de inseri-lo via innerHTML. */
function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Idade legível a partir de uma data yyyy-MM-dd (ex.: "6 meses e 14 dias"). */
function calcularIdade(dataNascimentoIso) {
  if (!dataNascimentoIso) return "";
  const [ano, mes, dia] = dataNascimentoIso.split("-").map(Number);
  const nasc = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  let meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
  let dias = hoje.getDate() - nasc.getDate();
  if (dias < 0) {
    meses -= 1;
    dias += new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
  }
  if (meses < 0) return "Data de nascimento no futuro";

  const anos = Math.floor(meses / 12);
  const restoMeses = meses % 12;
  const partes = [];
  if (anos) partes.push(`${anos} ${anos === 1 ? "ano" : "anos"}`);
  if (restoMeses) partes.push(`${restoMeses} ${restoMeses === 1 ? "mês" : "meses"}`);
  if (dias || partes.length === 0) partes.push(`${dias} ${dias === 1 ? "dia" : "dias"}`);
  return partes.join(" e ");
}

/** Formata yyyy-MM-dd como dd/MM/yyyy. */
function formatarDataBr(dataIso) {
  if (!dataIso) return "—";
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** "2026-10-15T08:30:00" -> "08:30" */
function horaDe(dataHoraIso) {
  return dataHoraIso ? dataHoraIso.slice(11, 16) : "--:--";
}

/** "2026-10-15T08:30:00" -> "15/10/2026 08:30" */
function formatarDataHoraBr(dataHoraIso) {
  return dataHoraIso ? `${formatarDataBr(dataHoraIso)} ${horaDe(dataHoraIso)}` : "—";
}

/** Data (yyyy-MM-dd) somada de n dias, no fuso local. */
function somarDias(dataIso, n) {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Data e hora local atual no formato aceito pela API (yyyy-MM-ddTHH:mm:00). */
function agoraIsoLocal() {
  const d = new Date();
  return `${hojeIsoLocal()}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
}

/** 95 -> "1h 35min"; null -> "—" */
function formatarDuracao(minutos) {
  if (minutos === null || minutos === undefined) return "—";
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (!h) return `${m}min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}
