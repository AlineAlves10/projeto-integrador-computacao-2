// Variável para rastrear qual modal está ativo no momento
let modalTipoAtual = null;

document.addEventListener("DOMContentLoaded", () => {
  const hojeIso = new Date().toISOString().split("T")[0];

  // Carrega as atividades salvas para preencher a timeline da dashboard
  carregarAtividadesDoDia(hojeIso);

  // Botão "+ Registrar" do card principal do bebê
  const btnAbrirReg = document.getElementById("btn-abrir-registro");
  if (btnAbrirReg) {
    btnAbrirReg.addEventListener("click", () => abrirModal("alimentacao"));
  }
});

// ----------------------------------------------------
// ABERTURA DINÂMICA DO MODAL (9 BOTÕES DE AÇÃO)
// ----------------------------------------------------
function abrirModal(tipo) {
  modalTipoAtual = tipo;
  const modal = document.getElementById("modal-registro");
  const titulo = document.getElementById("modal-titulo");
  const container = document.getElementById("campos-dinamicos");
  const agora = new Date().toTimeString().slice(0, 5);

  if (!modal || !container || !titulo) return;

  container.innerHTML = "";

  switch (tipo) {
    case "alimentacao":
      titulo.innerText = "🍼 Registrar Alimentação";
      container.innerHTML = `
        <div class="form-group">
          <label>Tipo de Alimentação</label>
          <select class="form-control" id="reg-tipo-alimento">
            <option value="MAMADEIRA">Mamadeira (Fórmula / Leite)</option>
            <option value="PEITO">Amamentação (Peito)</option>
            <option value="SOLIDO">Papinha / Comida Sólida</option>
          </select>
        </div>
        <div class="form-group">
          <label>Quantidade (ml ou gramas)</label>
          <input type="number" class="form-control" id="reg-qtd" placeholder="Ex: 150" min="0">
        </div>
        <div class="form-group">
          <label>Horário</label>
          <input type="time" class="form-control" id="reg-hora" value="${agora}" required>
        </div>
      `;
      break;

    case "fralda":
      titulo.innerText = "🧷 Registrar Troca de Fralda";
      container.innerHTML = `
        <div class="form-group">
          <label>Condição da Fralda</label>
          <select class="form-control" id="reg-fralda-tipo">
            <option value="XIXI">Apenas Xixi</option>
            <option value="COCO">Cocô</option>
            <option value="AMBOS">Xixi e Cocô</option>
            <option value="LIMPA">Limpa</option>
          </select>
        </div>
        <div class="form-group">
          <label>Horário da Troca</label>
          <input type="time" class="form-control" id="reg-hora" value="${agora}" required>
        </div>
        <div class="form-group">
          <label>Observação (Opcional)</label>
          <input type="text" class="form-control" id="reg-obs" placeholder="Ex: Pomada aplicada, assadura leve">
        </div>
      `;
      break;

    case "sono":
      titulo.innerText = "💤 Registrar Período de Sono";
      container.innerHTML = `
        <div class="form-group">
          <label>Início do Sono</label>
          <input type="time" class="form-control" id="reg-sono-inicio" value="${agora}" required>
        </div>
        <div class="form-group">
          <label>Fim do Sono (vazio se ainda dormindo)</label>
          <input type="time" class="form-control" id="reg-sono-fim">
        </div>
      `;
      break;

    case "remedios":
      titulo.innerText = "💊 Registrar Medicação";
      container.innerHTML = `
        <div class="form-group">
          <label>Nome do Remédio / Vitamina</label>
          <input type="text" class="form-control" id="reg-remedio-nome" placeholder="Ex: Paracetamol, Vitamina D" required>
        </div>
        <div class="form-group">
          <label>Dosagem</label>
          <input type="text" class="form-control" id="reg-remedio-dose" placeholder="Ex: 4 gotas, 2.5 ml" required>
        </div>
        <div class="form-group">
          <label>Horário</label>
          <input type="time" class="form-control" id="reg-hora" value="${agora}" required>
        </div>
      `;
      break;

    case "acordou":
      titulo.innerText = "🦥 Hora que Acordou";
      container.innerHTML = `
        <div class="form-group">
          <label>Horário do Despertar</label>
          <input type="time" class="form-control" id="reg-hora" value="${agora}" required>
        </div>
        <div class="form-group">
          <label>Humor ao Acordar</label>
          <select class="form-control" id="reg-humor">
            <option value="TRANQUILO">Calmo e bem-disposto</option>
            <option value="CHORANDO">Choroso / Irritado</option>
            <option value="FOME">Pedindo comida logo</option>
          </select>
        </div>
      `;
      break;

    case "ritual_bom_dia":
      titulo.innerText = "☀️ Ritual do Bom Dia";
      container.innerHTML = `
        <div class="form-group">
          <label>Horário</label>
          <input type="time" class="form-control" id="reg-hora" value="${agora}" required>
        </div>
        <div class="form-group">
          <label>Atividades Realizadas</label>
          <input type="text" class="form-control" id="reg-obs" placeholder="Ex: Troca de roupa, cortinas abertas, banho de sol">
        </div>
      `;
      break;

    case "ritual_sono":
      titulo.innerText = "🌙 Ritual do Sono";
      container.innerHTML = `
        <div class="form-group">
          <label>Horário de Início</label>
          <input type="time" class="form-control" id="reg-hora" value="${agora}" required>
        </div>
        <div class="form-group">
          <label>Etapas do Ritual</label>
          <input type="text" class="form-control" id="reg-obs" placeholder="Ex: Banho morno, massagem, ruído branco">
        </div>
      `;
      break;

    case "brincar":
      titulo.innerText = "🧸 Momento de Brincar";
      container.innerHTML = `
        <div class="form-group">
          <label>Atividade / Brincadeira</label>
          <input type="text" class="form-control" id="reg-brincar-tipo" placeholder="Ex: Tummy time, mordedor, historinha" required>
        </div>
        <div class="form-group">
          <label>Duração (minutos)</label>
          <input type="number" class="form-control" id="reg-duracao" placeholder="Ex: 25" min="1">
        </div>
        <div class="form-group">
          <label>Horário</label>
          <input type="time" class="form-control" id="reg-hora" value="${agora}" required>
        </div>
      `;
      break;

    case "banho":
      titulo.innerText = "🫧 Banho do Bebê";
      container.innerHTML = `
        <div class="form-group">
          <label>Horário</label>
          <input type="time" class="form-control" id="reg-hora" value="${agora}" required>
        </div>
        <div class="form-group">
          <label>Observações</label>
          <input type="text" class="form-control" id="reg-obs" placeholder="Ex: Banho relaxante antes da soneca">
        </div>
      `;
      break;
  }

  modal.style.display = "flex";
}

function fecharModal() {
  const modal = document.getElementById("modal-registro");
  if (modal) {
    modal.style.display = "none";
  }
  modalTipoAtual = null;
}

// ----------------------------------------------------
// SALVAR REGISTRO (API OU FALLBACK LOCAL)
// ----------------------------------------------------
async function salvarRegistro(e) {
  e.preventDefault();

  const dataHoje = new Date().toISOString().split("T")[0];
  const hora = document.getElementById("reg-hora")?.value || new Date().toTimeString().slice(0, 5);

  let payload = {
    bebeId: 1,
    dataRegistro: dataHoje,
    tipo: modalTipoAtual,
    detalhe: {}
  };

  switch (modalTipoAtual) {
    case "alimentacao":
      payload.detalhe = {
        subTipo: document.getElementById("reg-tipo-alimento")?.value,
        quantidade: parseFloat(document.getElementById("reg-qtd")?.value) || 0,
        horario: `${dataHoje}T${hora}:00`
      };
      break;

    case "fralda":
      payload.detalhe = {
        condicao: document.getElementById("reg-fralda-tipo")?.value,
        horario: `${dataHoje}T${hora}:00`,
        observacao: document.getElementById("reg-obs")?.value.trim() || ""
      };
      break;

    case "sono":
      const inicio = document.getElementById("reg-sono-inicio")?.value || hora;
      const fim = document.getElementById("reg-sono-fim")?.value;
      payload.detalhe = {
        inicio: `${dataHoje}T${inicio}:00`,
        fim: fim ? `${dataHoje}T${fim}:00` : null
      };
      break;

    case "remedios":
      payload.detalhe = {
        nome: document.getElementById("reg-remedio-nome")?.value,
        dosagem: document.getElementById("reg-remedio-dose")?.value,
        horario: `${dataHoje}T${hora}:00`
      };
      break;

    case "acordou":
      payload.detalhe = {
        horario: `${dataHoje}T${hora}:00`,
        humor: document.getElementById("reg-humor")?.value
      };
      break;

    case "ritual_bom_dia":
    case "ritual_sono":
    case "banho":
      payload.detalhe = {
        horario: `${dataHoje}T${hora}:00`,
        observacao: document.getElementById("reg-obs")?.value.trim() || ""
      };
      break;

    case "brincar":
      payload.detalhe = {
        atividade: document.getElementById("reg-brincar-tipo")?.value,
        duracao: parseInt(document.getElementById("reg-duracao")?.value, 10) || 0,
        horario: `${dataHoje}T${hora}:00`
      };
      break;
  }

  try {
    if (window.ApiService && window.ApiService.rotina) {
      await ApiService.rotina.registrarAtividade(payload);
    }
  } catch (err) {
    console.warn("Backend indisponível. Salvando em modo offline na tela:", err);
  }

  // Renderiza imediatamente na Timeline da Dashboard
  renderizarItemNaTimeline(payload);
  fecharModal();
}

// ----------------------------------------------------
// RENDERIZAÇÃO NA TIMELINE DA DASHBOARD
// ----------------------------------------------------
function renderizarItemNaTimeline(item) {
  const lista = document.querySelector(".timeline-list");
  if (!lista) return;

  const card = document.createElement("div");
  card.className = "timeline-item";
  card.dataset.tipo = item.tipo;

  const extrairHora = (horarioStr) => (horarioStr || "").split("T")[1]?.slice(0, 5) || "--:--";

  let htmlContent = "";

  switch (item.tipo) {
    case "alimentacao": {
      const hora = extrairHora(item.detalhe.horario);
      const sub = item.detalhe.subTipo === "PEITO" ? "Amamentação (Peito)" : item.detalhe.subTipo === "SOLIDO" ? "Papinha" : "Mamadeira";
      const qtd = item.detalhe.quantidade ? `${item.detalhe.quantidade} ml/g` : "Refeição";
      htmlContent = `
        <div class="timeline-dot" style="background: var(--primary);"></div>
        <div>
          <strong style="font-size: 0.85rem;">${hora} - ${sub}</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${qtd}</p>
        </div>`;
      break;
    }

    case "fralda": {
      const hora = extrairHora(item.detalhe.horario);
      htmlContent = `
        <div class="timeline-dot" style="background: var(--secondary);"></div>
        <div>
          <strong style="font-size: 0.85rem;">${hora} - Troca de Fralda</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${item.detalhe.condicao} ${item.detalhe.observacao ? `• ${item.detalhe.observacao}` : ""}</p>
        </div>`;
      break;
    }

    case "sono": {
      const inicio = extrairHora(item.detalhe.inicio);
      const fim = item.detalhe.fim ? extrairHora(item.detalhe.fim) : "Dormindo";
      htmlContent = `
        <div class="timeline-dot" style="background: #8b5cf6;"></div>
        <div>
          <strong style="font-size: 0.85rem;">${inicio} às ${fim} - Soneca</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Período de sono</p>
        </div>`;
      break;
    }

    case "remedios": {
      const hora = extrairHora(item.detalhe.horario);
      htmlContent = `
        <div class="timeline-dot" style="background: #ef4444;"></div>
        <div>
          <strong style="font-size: 0.85rem;">${hora} - Remédio</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${item.detalhe.nome} (${item.detalhe.dosagem})</p>
        </div>`;
      break;
    }

    case "acordou": {
      const hora = extrairHora(item.detalhe.horario);
      htmlContent = `
        <div class="timeline-dot" style="background: #f59e0b;"></div>
        <div>
          <strong style="font-size: 0.85rem;">${hora} - Hora que Acordou</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Humor: ${item.detalhe.humor || "Tranquilo"}</p>
        </div>`;
      break;
    }

    case "ritual_bom_dia": {
      const hora = extrairHora(item.detalhe.horario);
      htmlContent = `
        <div class="timeline-dot" style="background: #eab308;"></div>
        <div>
          <strong style="font-size: 0.85rem;">${hora} - Ritual Bom Dia</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${item.detalhe.observacao || "Começo do dia"}</p>
        </div>`;
      break;
    }

    case "ritual_sono": {
      const hora = extrairHora(item.detalhe.horario);
      htmlContent = `
        <div class="timeline-dot" style="background: #6366f1;"></div>
        <div>
          <strong style="font-size: 0.85rem;">${hora} - Ritual do Sono</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${item.detalhe.observacao || "Preparação para dormir"}</p>
        </div>`;
      break;
    }

    case "brincar": {
      const hora = extrairHora(item.detalhe.horario);
      htmlContent = `
        <div class="timeline-dot" style="background: #ec4899;"></div>
        <div>
          <strong style="font-size: 0.85rem;">${hora} - Brincadeira</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${item.detalhe.atividade} ${item.detalhe.duracao ? `(${item.detalhe.duracao} min)` : ""}</p>
        </div>`;
      break;
    }

    case "banho": {
      const hora = extrairHora(item.detalhe.horario);
      htmlContent = `
        <div class="timeline-dot" style="background: #06b6d4;"></div>
        <div>
          <strong style="font-size: 0.85rem;">${hora} - Banho</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${item.detalhe.observacao || "Banho relaxante"}</p>
        </div>`;
      break;
    }
  }

  card.innerHTML = htmlContent;
  lista.prepend(card);
}

// ----------------------------------------------------
// CARREGAR DADOS EXISTENTES
// ----------------------------------------------------
async function carregarAtividadesDoDia(dataIso) {
  if (!window.ApiService || !window.ApiService.rotina) return;
  try {
    const itens = await ApiService.rotina.listarPorData(1, dataIso);
    if (Array.isArray(itens) && itens.length > 0) {
      const lista = document.querySelector(".timeline-list");
      if (lista) {
        lista.innerHTML = "";
        itens.forEach(renderizarItemNaTimeline);
      }
    }
  } catch (e) {
    console.info("Backend offline ou sem itens para hoje.");
  }
}