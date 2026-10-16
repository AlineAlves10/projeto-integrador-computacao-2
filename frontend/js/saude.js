/**
 * saude.js - Caderneta de saúde do bebê ativo
 * Projeto Integrador: Babá Premium
 *
 * Biometria: /bebes/{id}/crescimentos    Vacinas: /bebes/{id}/vacinas
 * Medicamentos: /bebes/{id}/medicamentos Próxima consulta: /bebes/{id}/horarios-previstos (tipo CONSULTA)
 * Cada medição é um novo registro: o histórico anterior é preservado.
 */

const formatarNumero = (valor, casas) =>
  valor === null || valor === undefined ? null : Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

function linhaComExcluir(conteudo, recurso, id) {
  return `
    <div class="list-row">
      <div>${conteudo}</div>
      <button type="button" class="btn-outline perigo" onclick="excluirRegistroSaude('${recurso}', ${id})">Excluir</button>
    </div>`;
}

function listaOuVazio(containerId, itens, vazio, renderizar) {
  document.getElementById(containerId).innerHTML = itens.length
    ? itens.map(renderizar).join("")
    : `<p class="estado-vazio">${vazio}</p>`;
}

async function carregarSaude() {
  const bebeId = BebeAtivo.atual.id;
  mostrarMensagem("aviso-saude", "");
  try {
    const [crescimentos, vacinas, medicamentos, consultas] = await Promise.all([
      ApiService.crescimentos.listar(bebeId),
      ApiService.vacinas.listar(bebeId),
      ApiService.medicamentos.listar(bebeId),
      ApiService.horarios.listar(bebeId, { status: "PENDENTE", desde: agoraIsoLocal() })
    ]);
    renderizarBiometria(crescimentos);
    renderizarProximaConsulta(consultas.filter(h => h.tipo === "CONSULTA"));

    listaOuVazio("lista-vacinas", vacinas, "Nenhuma vacina registrada.", v => linhaComExcluir(`
      <strong>${escaparHtml(v.nomeVacina)}</strong> <span class="badge-applied">✓ ${escaparHtml(v.dose)}</span>
      <p class="texto-apoio">Aplicada em ${formatarDataBr(v.dataAplicacao)}${v.proximaDose ? ` • próxima dose: ${formatarDataBr(v.proximaDose)}` : ""}${v.observacoes ? ` • ${escaparHtml(v.observacoes)}` : ""}</p>`,
      "vacinas", v.id));

    listaOuVazio("lista-medicamentos", medicamentos, "Nenhum medicamento registrado.", m => linhaComExcluir(`
      <strong>${escaparHtml(m.nomeMedicamento)}</strong>
      <p class="texto-apoio">${escaparHtml(m.dosagem)}${m.viaAdministracao ? ` • ${escaparHtml(m.viaAdministracao)}` : ""} • ${formatarDataHoraBr(m.dataHora)}${m.observacoes ? ` • ${escaparHtml(m.observacoes)}` : ""}</p>`,
      "medicamentos", m.id));
  } catch (error) {
    mostrarMensagem("aviso-saude", error.message);
  }
}

function renderizarBiometria(crescimentos) {
  // Últimos valores conhecidos de cada medida (podem vir de medições diferentes)
  const ultimoPeso = crescimentos.find(c => c.pesoKg !== null);
  const ultimaAltura = crescimentos.find(c => c.alturaCm !== null);
  document.getElementById("ultimo-peso").textContent = ultimoPeso ? `${formatarNumero(ultimoPeso.pesoKg, 2)} kg` : "—";
  document.getElementById("ultimo-peso-data").textContent = ultimoPeso ? `Medido em ${formatarDataBr(ultimoPeso.dataRegistro)}` : "Sem registros de peso";
  document.getElementById("ultima-altura").textContent = ultimaAltura ? `${formatarNumero(ultimaAltura.alturaCm, 1)} cm` : "—";
  document.getElementById("ultima-altura-data").textContent = ultimaAltura ? `Medido em ${formatarDataBr(ultimaAltura.dataRegistro)}` : "Sem registros de comprimento";

  listaOuVazio("lista-crescimentos", crescimentos, "Nenhuma medida registrada.", c => linhaComExcluir(`
    <strong>${formatarDataBr(c.dataRegistro)}</strong>
    <p class="texto-apoio">${[
      c.pesoKg !== null ? `Peso ${formatarNumero(c.pesoKg, 2)} kg` : "",
      c.alturaCm !== null ? `Comprimento ${formatarNumero(c.alturaCm, 1)} cm` : "",
      c.perimetroCefalicoCm !== null ? `Perímetro cefálico ${formatarNumero(c.perimetroCefalicoCm, 1)} cm` : "",
      c.observacoes ? escaparHtml(c.observacoes) : ""
    ].filter(Boolean).join(" • ")}</p>`, "crescimentos", c.id));
}

function renderizarProximaConsulta(consultas) {
  const proxima = consultas[0];
  document.getElementById("proxima-consulta").textContent = proxima ? formatarDataHoraBr(proxima.dataHoraPrevista) : "—";
  document.getElementById("proxima-consulta-desc").textContent = proxima ? ([proxima.descricao, proxima.detalhes, proxima.local].filter(Boolean).join(" • ") || "Consulta agendada") : "Sem consultas agendadas";
}

// ----------------------------------------------------
// MODAL DE NOVO REGISTRO
// ----------------------------------------------------

// Botão "+ Novo Registro" do cabeçalho
function novoRegistroSaude() {
  if (!BebeAtivo.atual) {
    mostrarMensagem("aviso-saude", "Selecione ou cadastre um bebê antes de registrar.");
    return;
  }
  document.getElementById("form-saude").reset();
  mostrarMensagem("msg-saude", "");
  document.getElementById("modal-saude-titulo").textContent = `Novo Registro de Saúde — ${BebeAtivo.atual.nome}`;
  document.getElementById("cresc-data").value = hojeIsoLocal();
  document.getElementById("cresc-data").max = hojeIsoLocal();
  document.getElementById("vac-data").value = hojeIsoLocal();
  document.getElementById("vac-data").max = hojeIsoLocal();
  document.getElementById("med-quando").value = agoraIsoLocal().slice(0, 16);
  ajustarFormularioSaude();
  document.getElementById("modal-saude").classList.add("open");
}

function fecharModalSaude() {
  document.getElementById("modal-saude").classList.remove("open");
}

function ajustarFormularioSaude() {
  const tipo = document.getElementById("saude-tipo").value;
  document.querySelectorAll("[data-saude]").forEach(bloco => {
    const ativo = bloco.dataset.saude === tipo;
    bloco.hidden = !ativo;
    bloco.querySelectorAll("input").forEach(campo => campo.disabled = !ativo);
  });
  const obrigatorios = { vacina: ["vac-nome", "vac-dose", "vac-data"], medicamento: ["med-nome", "med-dose", "med-quando"], consulta: ["cons-quando"], crescimento: ["cresc-data"] };
  document.querySelectorAll("#form-saude input").forEach(campo => campo.required = (obrigatorios[tipo] || []).includes(campo.id));
  document.getElementById("saude-obs").parentElement.hidden = tipo === "consulta";
}

async function salvarRegistroSaude(e) {
  e.preventDefault();
  if (!BebeAtivo.garantirContexto()) return;

  const bebeId = BebeAtivo.atual.id;
  const valor = (id) => document.getElementById(id).value.trim();
  const numero = (id) => valor(id) ? Number(valor(id)) : null;
  const observacoes = valor("saude-obs") || null;
  const botao = e.target.querySelector("button[type=submit]");

  botao.disabled = true;
  try {
    switch (valor("saude-tipo")) {
      case "crescimento":
        if (numero("cresc-peso") === null && numero("cresc-altura") === null && numero("cresc-perimetro") === null) {
          throw new Error("Informe ao menos uma medida.");
        }
        await ApiService.crescimentos.criar(bebeId, {
          dataRegistro: valor("cresc-data"), pesoKg: numero("cresc-peso"), alturaCm: numero("cresc-altura"),
          perimetroCefalicoCm: numero("cresc-perimetro"), observacoes
        });
        break;
      case "vacina":
        await ApiService.vacinas.criar(bebeId, {
          nomeVacina: valor("vac-nome"), dose: valor("vac-dose"), dataAplicacao: valor("vac-data"),
          proximaDose: valor("vac-proxima") || null, observacoes
        });
        break;
      case "medicamento":
        await ApiService.medicamentos.criar(bebeId, {
          nomeMedicamento: valor("med-nome"), dosagem: valor("med-dose"), viaAdministracao: valor("med-via") || null,
          dataHora: `${valor("med-quando")}:00`, observacoes
        });
        break;
      case "consulta":
        await ApiService.horarios.criar(bebeId, {
          tipo: "CONSULTA", dataHoraPrevista: `${valor("cons-quando")}:00`, descricao: valor("cons-desc") || null,
          detalhes: valor("cons-motivo") || null, local: valor("cons-local") || null
        });
        break;
    }
    fecharModalSaude();
    await carregarSaude();
  } catch (error) {
    mostrarMensagem("msg-saude", error.message);
  } finally {
    botao.disabled = false;
  }
}

async function excluirRegistroSaude(recurso, id) {
  if (!BebeAtivo.garantirContexto()) return;
  if (!confirm("Excluir este registro da caderneta?")) return;
  try {
    await ApiService[recurso].excluir(BebeAtivo.atual.id, id);
    await carregarSaude();
  } catch (error) {
    mostrarMensagem("aviso-saude", error.message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  let bebe;
  try {
    bebe = await BebeAtivo.inicializar();
  } catch {
    return;
  }
  if (!bebe) {
    ["lista-crescimentos", "lista-vacinas", "lista-medicamentos"].forEach(id =>
      document.getElementById(id).innerHTML = '<p class="estado-vazio">Nenhum bebê selecionado.</p>');
    return;
  }
  await carregarSaude();
});
