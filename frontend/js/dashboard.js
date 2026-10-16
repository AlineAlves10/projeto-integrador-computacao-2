/**
 * dashboard.js - Painel do dia do bebê ativo
 * Projeto Integrador: Babá Premium
 *
 * Resumo (GET /bebes/{id}/resumo), linha do tempo (GET /bebes/{id}/linha-do-tempo) e
 * próximos horários (GET/PATCH /bebes/{id}/horarios-previstos), sempre do bebê ativo.
 */

document.addEventListener("DOMContentLoaded", async () => {
  RegistroRotina.dataBase = hojeIsoLocal();
  RegistroRotina.aoSalvar = carregarPainel;

  // Botão "+ Registrar" do card principal do bebê
  const btnAbrirReg = document.getElementById("btn-abrir-registro");
  if (btnAbrirReg) {
    btnAbrirReg.addEventListener("click", () => abrirModal("alimentacao"));
  }

  let bebe;
  try {
    bebe = await BebeAtivo.inicializar();
  } catch {
    return;
  }
  if (!bebe) {
    const semBebe = '<p class="estado-vazio">Nenhum bebê selecionado.</p>';
    document.getElementById("dashboard-timeline").innerHTML = semBebe;
    document.getElementById("lista-horarios").innerHTML = semBebe;
    return;
  }
  await carregarPainel();
});

async function carregarPainel() {
  const bebeId = BebeAtivo.atual.id;
  const hoje = hojeIsoLocal();
  await Promise.all([carregarResumo(bebeId, hoje), carregarLinhaDoTempo(bebeId, hoje)]);
}

async function carregarResumo(bebeId, data) {
  try {
    const r = await ApiService.resumo.doDia(bebeId, data);
    const texto = (id, valor) => { document.getElementById(id).textContent = valor; };
    const vazio = r.totalRegistros === 0;

    mostrarMensagem("msg-resumo", vazio ? "Nenhum cuidado registrado hoje. Use os botões acima para registrar." : "", "sucesso");

    texto("resumo-sono", r.sono.minutosTotais !== null ? formatarDuracao(r.sono.minutosTotais) : "—");
    texto("resumo-sono-detalhe", [
      r.sono.periodos ? `${r.sono.periodos} período(s)` : "",
      r.sono.emAndamento ? "dormindo agora" : ""
    ].filter(Boolean).join(" • "));

    texto("resumo-leite", r.alimentacao.volumeTotalMl !== null ? `${r.alimentacao.volumeTotalMl} ml` : "—");
    texto("resumo-leite-detalhe", [
      r.alimentacao.mamadeirasLeiteMaterno ? `${r.alimentacao.mamadeirasLeiteMaterno} de leite materno` : "",
      r.alimentacao.mamadeirasFormula ? `${r.alimentacao.mamadeirasFormula} de fórmula` : "",
      r.alimentacao.mamadeirasSemVolume ? `${r.alimentacao.mamadeirasSemVolume} sem volume informado` : ""
    ].filter(Boolean).join(" • "));

    texto("resumo-fraldas", vazio ? "—" : `${r.fraldas.trocas} ${r.fraldas.trocas === 1 ? "troca" : "trocas"}`);
    // Contagens por troca: uma troca com xixi e cocô entra nas duas, mas conta uma vez no total de trocas
    texto("resumo-fraldas-detalhe", r.fraldas.trocas ? [
      `${r.fraldas.trocasComXixi} com xixi`,
      `${r.fraldas.trocasComCoco} com cocô`,
      r.fraldas.misto ? `${r.fraldas.misto} com ambos` : "",
      r.fraldas.limpa ? `${r.fraldas.limpa} limpa(s)` : ""
    ].filter(Boolean).join(" • ") : "");

    texto("resumo-refeicoes", vazio ? "—" : String(r.alimentacao.refeicoes));
    texto("resumo-atividades", [
      r.alimentacao.amamentacoes ? `${r.alimentacao.amamentacoes} no peito` : "",
      r.atividades ? `${r.atividades} atividade(s)` : "",
      r.medicamentos ? `${r.medicamentos} medicamento(s)` : ""
    ].filter(Boolean).join(" • "));

    document.getElementById("resumo-observacoes").innerHTML = r.observacoesDiario.length
      ? `<p class="texto-apoio"><strong>Diário de hoje:</strong> ${r.observacoesDiario.map(escaparHtml).join(" • ")}</p>` : "";

    renderizarHorarios(r.proximosHorarios);
  } catch (error) {
    mostrarMensagem("msg-resumo", error.message);
    document.getElementById("lista-horarios").innerHTML = "";
  }
}

async function carregarLinhaDoTempo(bebeId, data) {
  const lista = document.getElementById("dashboard-timeline");
  try {
    const itens = await ApiService.resumo.linhaDoTempo(bebeId, data, data);
    RegistroRotina.renderizarLinhaDoTempo(lista, itens, { vazio: "Nenhuma atividade registrada hoje." });
  } catch (error) {
    mostrarMensagem(lista, error.message);
  }
}

function renderizarHorarios(horarios) {
  const lista = document.getElementById("lista-horarios");
  if (!horarios.length) {
    lista.innerHTML = '<p class="estado-vazio">Nenhum horário previsto. Use "+ Agendar".</p>';
    return;
  }
  const agora = agoraIsoLocal();
  lista.innerHTML = horarios.map(h => {
    const atrasado = h.dataHoraPrevista < agora;
    const quando = h.dataHoraPrevista.slice(0, 10) === hojeIsoLocal() ? horaDe(h.dataHoraPrevista) : formatarDataHoraBr(h.dataHoraPrevista);
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
        <span style="font-size: 0.85rem;">${TIPOS_HORARIO[h.tipo]?.rotulo || h.tipo}${descreverHorario(h) ? ` — ${escaparHtml(descreverHorario(h))}` : ""}</span>
        <span style="display: flex; gap: 0.3rem; align-items: center; flex-shrink: 0;">
          <span class="metric-badge" ${atrasado ? 'style="background:#fef2f2;color:#b91c1c;" title="Horário já passou"' : ""}>${quando}</span>
          <button type="button" class="btn-outline" title="Marcar como feito" onclick="alterarHorario(${h.id}, 'CONCLUIDO')">✓</button>
          <button type="button" class="btn-outline perigo" title="Cancelar" onclick="alterarHorario(${h.id}, 'CANCELADO')">✕</button>
        </span>
      </div>`;
  }).join("");
}

// Concluir um horário não registra a atividade: o registro é feito pelos botões de rotina
async function alterarHorario(id, status) {
  if (!BebeAtivo.garantirContexto()) return;
  try {
    await ApiService.horarios.alterarStatus(BebeAtivo.atual.id, id, status);
    await carregarResumo(BebeAtivo.atual.id, hojeIsoLocal());
  } catch (error) {
    mostrarMensagem("msg-horarios", error.message);
  }
}
