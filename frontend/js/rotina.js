/**
 * rotina.js - Histórico de atividades do bebê ativo por data
 * Projeto Integrador: Babá Premium
 *
 * Lista: GET /bebes/{id}/linha-do-tempo?inicio=&fim= ; registros e exclusões via registro-rotina.js.
 */

let filtroAtual = "todos";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Ajusta a data do seletor para o dia atual (não permite datas futuras)
  const dataInput = document.getElementById("rotina-data-input");
  dataInput.value = hojeIsoLocal();
  dataInput.max = hojeIsoLocal();
  atualizarRotuloData(dataInput.value);
  RegistroRotina.dataBase = dataInput.value;
  RegistroRotina.aoSalvar = carregarAtividadesDoDia;

  dataInput.addEventListener("change", () => {
    if (!dataInput.value) return;
    RegistroRotina.dataBase = dataInput.value;
    atualizarRotuloData(dataInput.value);
    carregarAtividadesDoDia();
  });

  // 2. Bebê ativo e histórico do dia
  let bebe;
  try {
    bebe = await BebeAtivo.inicializar();
  } catch {
    return;
  }
  if (!bebe) {
    document.getElementById("lista-atividades").innerHTML = '<p class="estado-vazio">Nenhum bebê selecionado.</p>';
    return;
  }
  await carregarAtividadesDoDia();
});

// Mostra a data selecionada no cabeçalho (ex.: "Hoje, 15 de outubro")
function atualizarRotuloData(dataIso) {
  const rotulo = document.getElementById("data-hoje");
  if (!rotulo || !dataIso) return;
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const texto = new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  rotulo.textContent = dataIso === hojeIsoLocal() ? `Hoje, ${texto}` : texto;
}

async function carregarAtividadesDoDia() {
  const lista = document.getElementById("lista-atividades");
  const data = RegistroRotina.dataBase;
  lista.innerHTML = '<p class="estado-vazio">Carregando...</p>';
  try {
    const itens = await ApiService.resumo.linhaDoTempo(BebeAtivo.atual.id, data, data);
    RegistroRotina.renderizarLinhaDoTempo(lista, itens, { comAcoes: true, vazio: "Nenhuma atividade registrada neste dia." });
    aplicarFiltro();
  } catch (error) {
    mostrarMensagem(lista, error.message);
  }
}

// Filtro da Timeline
function filtrarTimeline(categoria, botao) {
  document.querySelectorAll(".filter-tab").forEach(tab => tab.classList.remove("active"));
  botao.classList.add("active");
  filtroAtual = categoria;
  aplicarFiltro();
}

function aplicarFiltro() {
  document.querySelectorAll("#lista-atividades .timeline-item").forEach(item => {
    item.style.display = filtroAtual === "todos" || item.dataset.tipo === filtroAtual ? "flex" : "none";
  });
}
