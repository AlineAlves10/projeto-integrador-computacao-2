/**
 * estatisticas.js - Estatísticas de sono, alimentação e fraldas do bebê ativo
 * Projeto Integrador: Babá Premium
 *
 * GET /bebes/{id}/estatisticas?inicio=&fim= . Dias sem registro chegam como null e aparecem como lacunas
 * (não como zero); as médias consideram apenas os dias com a informação.
 */

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function rotuloDia(dataIso) {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia);
  return `${DIAS_SEMANA[d.getDay()]} ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`;
}

// "↑ 12% vs. período anterior" quando os dois períodos têm dados
function comparar(atual, anterior) {
  if (atual === null || anterior === null || anterior === 0) return "Sem dados do período anterior para comparar";
  const variacao = Math.round(((atual - anterior) / anterior) * 100);
  if (variacao === 0) return "Igual ao período anterior";
  return `${variacao > 0 ? "↑" : "↓"} ${Math.abs(variacao)}% vs. período anterior`;
}

async function carregarEstatisticas() {
  const dias = Number(document.getElementById("periodo-estatisticas").value);
  const fim = hojeIsoLocal();
  const inicio = somarDias(fim, -(dias - 1));
  mostrarMensagem("aviso-estatisticas", "");

  let dados;
  try {
    dados = await ApiService.resumo.estatisticas(BebeAtivo.atual.id, inicio, fim);
  } catch (error) {
    mostrarMensagem("aviso-estatisticas", error.message);
    return;
  }

  const p = dados.periodo;
  const ant = dados.periodoAnterior;
  const texto = (id, valor) => { document.getElementById(id).textContent = valor; };

  if (p.diasComRegistro === 0) {
    mostrarMensagem("aviso-estatisticas", "Nenhum registro de rotina neste período. As estatísticas aparecem conforme os cuidados forem registrados.", "sucesso");
  } else {
    mostrarMensagem("aviso-estatisticas", `Baseado em ${p.diasComRegistro} de ${dados.dias.length} dias com registros.`, "sucesso");
  }

  texto("media-sono", p.mediaSonoMinutos !== null ? formatarDuracao(p.mediaSonoMinutos) : "—");
  texto("comparacao-sono", p.mediaSonoMinutos !== null ? comparar(p.mediaSonoMinutos, ant.mediaSonoMinutos) : "Sem períodos de sono encerrados");
  texto("media-leite", p.mediaVolumeMl !== null ? `${Math.round(p.mediaVolumeMl)} ml` : "—");
  texto("comparacao-leite", p.mediaVolumeMl !== null
    ? `${comparar(p.mediaVolumeMl, ant.mediaVolumeMl)} • ${(p.mediaRefeicoes ?? 0).toLocaleString("pt-BR")} refeições/dia`
    : "Sem mamadeiras com volume informado");
  texto("media-fraldas", p.mediaFraldas !== null ? p.mediaFraldas.toLocaleString("pt-BR") : "—");
  texto("comparacao-fraldas", p.mediaFraldas !== null ? comparar(p.mediaFraldas, ant.mediaFraldas) : "Sem registros no período");
  // Médias de trocas em que houve cada eliminação (uma troca com ambos entra nas duas)
  texto("detalhe-fraldas", p.mediaFraldas !== null
    ? `Com xixi: ${(p.mediaTrocasComXixi ?? 0).toLocaleString("pt-BR")}/dia • com cocô: ${(p.mediaTrocasComCoco ?? 0).toLocaleString("pt-BR")}/dia`
    : "");

  const rotulos = dados.dias.map(d => rotuloDia(d.data));
  const horasSono = dados.dias.map(d => d.sonoMinutos === null ? null : Math.round(d.sonoMinutos / 6) / 10);
  const volumes = dados.dias.map(d => d.volumeMl);

  desenharOuVazio("graficoSono", "vazio-sono", horasSono, () => ChartsModule.criarGraficoSono("graficoSono", rotulos, horasSono));
  desenharOuVazio("graficoAlimentacao", "vazio-alimentacao", volumes, () => ChartsModule.criarGraficoAlimentacao("graficoAlimentacao", rotulos, volumes));
}

function desenharOuVazio(canvasId, vazioId, valores, desenhar) {
  const temDados = valores.some(v => v !== null);
  document.getElementById(canvasId).hidden = !temDados;
  document.getElementById(vazioId).hidden = temDados;
  ChartsModule.destruirSeExistir(canvasId);
  if (!temDados) return;
  if (typeof Chart === "undefined") {
    document.getElementById(vazioId).hidden = false;
    document.getElementById(vazioId).textContent = "Não foi possível carregar a biblioteca de gráficos (sem acesso à internet?).";
    return;
  }
  desenhar();
}

document.addEventListener("DOMContentLoaded", async () => {
  let bebe;
  try {
    bebe = await BebeAtivo.inicializar();
  } catch {
    return;
  }
  if (!bebe) {
    mostrarMensagem("aviso-estatisticas", "Nenhum bebê selecionado.");
    return;
  }
  document.getElementById("periodo-estatisticas").addEventListener("change", carregarEstatisticas);
  await carregarEstatisticas();
});
