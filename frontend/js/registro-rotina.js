/**
 * registro-rotina.js - Formulários de registro de rotina e linha do tempo (dashboard e rotina)
 * Projeto Integrador: Babá Premium
 *
 * Cada tipo de botão grava no endpoint correspondente do bebê ativo:
 *   alimentacao -> /alimentacoes   fralda -> /fraldas       sono -> /sonos
 *   remedios    -> /medicamentos   banho  -> /higienes      horario -> /horarios-previstos
 *   acordou, ritual_bom_dia, ritual_sono, brincar -> /atividades
 */

const CATEGORIAS = {
  ALIMENTACAO: { filtro: "alimentacao", cor: "var(--primary)", recurso: "alimentacoes" },
  FRALDA: { filtro: "fralda", cor: "var(--secondary)", recurso: "fraldas" },
  SONO: { filtro: "sono", cor: "#6366f1", recurso: "sonos" },
  HIGIENE: { filtro: "outros", cor: "#06b6d4", recurso: "higienes" },
  MEDICAMENTO: { filtro: "outros", cor: "#ef4444", recurso: "medicamentos" },
  ATIVIDADE: { filtro: "outros", cor: "#ec4899", recurso: "atividades" }
};

// Tipos de alimentação do formulário -> campos da API. Mamadeira de leite materno e de fórmula usam tipo MAMADEIRA.
const OPCOES_ALIMENTACAO = {
  PEITO: { tipo: "PEITO", grupo: "PEITO" },
  LEITE_MATERNO: { tipo: "MAMADEIRA", tipoLeite: "LEITE_MATERNO", grupo: "MAMADEIRA" },
  FORMULA: { tipo: "MAMADEIRA", tipoLeite: "FORMULA", grupo: "MAMADEIRA" },
  SOLIDA: { tipo: "SOLIDA", grupo: "SOLIDA" }
};

// Rótulos, exemplos e campos de cada tipo de horário previsto. Campo ausente = não se aplica ao tipo.
// BANHO é o valor já existente na API e representa os cuidados de higiene em geral.
const TIPOS_HORARIO = {
  ALIMENTACAO: { rotulo: "🍼 Alimentação",
    descricao: { rotulo: "Alimento ou tipo de leite (opcional)", exemplo: "Ex.: leite materno, fórmula, papinha de legumes" } },
  SONO: { rotulo: "💤 Sono / soneca",
    descricao: { rotulo: "Rotina de descanso (opcional)", exemplo: "Ex.: soneca da tarde no berço" } },
  MEDICAMENTO: { rotulo: "💊 Medicamento",
    descricao: { rotulo: "Nome do medicamento", exemplo: "Ex.: vitamina D", obrigatorio: true },
    detalhes: { rotulo: "Dose e orientações (opcional)", exemplo: "Ex.: 4 gotas, via oral, conforme a receita" },
    aviso: "Agende apenas medicamentos orientados por um profissional de saúde." },
  BANHO: { rotulo: "🫧 Higiene",
    descricao: { rotulo: "Tipo de cuidado (opcional)", exemplo: "Ex.: banho, corte de unhas, lavagem nasal" } },
  CONSULTA: { rotulo: "🩺 Consulta",
    descricao: { rotulo: "Profissional ou especialidade (opcional)", exemplo: "Ex.: pediatra" },
    detalhes: { rotulo: "Motivo (opcional)", exemplo: "Ex.: acompanhamento de rotina" },
    local: { rotulo: "Local (opcional)", exemplo: "Ex.: clínica ou UBS" } },
  VACINA: { rotulo: "💉 Vacina",
    descricao: { rotulo: "Vacina e dose (opcional)", exemplo: "Ex.: pentavalente, 2ª dose" },
    local: { rotulo: "Local (opcional)", exemplo: "Ex.: posto de saúde" } },
  OUTRO: { rotulo: "📌 Outro",
    descricao: { rotulo: "Descrição", exemplo: "Descreva o que está previsto", obrigatorio: true } }
};

// Texto de um horário previsto: descrição, detalhes e local preenchidos
function descreverHorario(h) {
  return [h.descricao, h.detalhes, h.local].filter(Boolean).join(" • ");
}

// Mostra só os blocos [atributo] cujo valor está em visiveis. Campos escondidos são limpos e deixam de ser
// obrigatórios, para que valores digitados em outro tipo não sejam enviados nem bloqueiem o envio.
function mostrarGrupos(atributo, visiveis) {
  document.querySelectorAll(`[${atributo}]`).forEach(grupo => {
    const ativo = visiveis.includes(grupo.getAttribute(atributo));
    grupo.hidden = !ativo;
    grupo.querySelectorAll("input, select, textarea").forEach(campo => {
      if (!ativo) campo.value = "";
      campo.required = ativo && campo.dataset.obrigatorio === "true";
    });
  });
}

const TIPOS_ATIVIDADE = { acordou: "ACORDOU", ritual_bom_dia: "RITUAL_BOM_DIA", ritual_sono: "RITUAL_SONO", brincar: "BRINCADEIRA" };

const RegistroRotina = {
  tipoAtual: null,
  dataBase: null,      // yyyy-MM-dd usada nos campos de horário (dashboard: hoje; rotina: data escolhida)
  aoSalvar: null,      // callback para recarregar a tela
  sonoAberto: null,

  // ----------------------------------------------------
  // ABERTURA DINÂMICA DO MODAL
  // ----------------------------------------------------
  async abrir(tipo) {
    if (!BebeAtivo.atual) {
      alert("Selecione ou cadastre um bebê antes de registrar atividades.");
      return;
    }
    this.tipoAtual = tipo;
    const modal = document.getElementById("modal-registro");
    const titulo = document.getElementById("modal-titulo");
    const container = document.getElementById("campos-dinamicos");
    const agora = new Date().toTimeString().slice(0, 5);
    const hora = (rotulo = "Horário") => `
      <div class="form-group">
        <label for="reg-hora">${rotulo}</label>
        <input type="time" class="form-control" id="reg-hora" value="${agora}" required>
      </div>`;
    const obs = (placeholder, rotulo = "Observações (opcional)") => `
      <div class="form-group">
        <label for="reg-obs">${rotulo}</label>
        <input type="text" class="form-control" id="reg-obs" maxlength="255" placeholder="${placeholder}">
      </div>`;

    const formularios = {
      alimentacao: ["🍼 Registrar Alimentação", `
        <div class="form-group">
          <label for="reg-tipo-alimento">Tipo de alimentação</label>
          <select class="form-control" id="reg-tipo-alimento" onchange="RegistroRotina.ajustarAlimentacao()" required>
            <option value="">Selecione o tipo</option>
            <option value="PEITO">Amamentação no peito</option>
            <option value="LEITE_MATERNO">Leite materno na mamadeira</option>
            <option value="FORMULA">Fórmula infantil</option>
            <option value="SOLIDA">Papinha ou refeição</option>
          </select>
        </div>
        <div class="form-row" data-alimento="PEITO" hidden>
          <div class="form-group">
            <label for="reg-lado">Lado</label>
            <select class="form-control" id="reg-lado" data-obrigatorio="true">
              <option value="">Selecione o lado</option>
              <option value="ESQUERDO">Esquerdo</option>
              <option value="DIREITO">Direito</option>
              <option value="AMBOS">Ambos</option>
            </select>
          </div>
          <div class="form-group">
            <label for="reg-duracao-mamada">Duração (min, opcional)</label>
            <input type="number" class="form-control" id="reg-duracao-mamada" min="1" max="300">
          </div>
        </div>
        <div class="form-group" data-alimento="MAMADEIRA" hidden>
          <label for="reg-volume">Volume (ml)</label>
          <input type="number" class="form-control" id="reg-volume" placeholder="Ex: 150" min="1" max="2000" data-obrigatorio="true">
        </div>
        <div class="form-row" data-alimento="SOLIDA" hidden>
          <div class="form-group">
            <label for="reg-alimento">Alimento</label>
            <input type="text" class="form-control" id="reg-alimento" maxlength="120" placeholder="Ex: papinha de banana" data-obrigatorio="true">
          </div>
          <div class="form-group">
            <label for="reg-quantidade">Quantidade consumida (opcional)</label>
            <input type="text" class="form-control" id="reg-quantidade" maxlength="60" placeholder="Ex: 3 colheres, metade do prato">
          </div>
        </div>
        ${hora()}
        ${obs("")}`],

      fralda: ["🧷 Registrar Troca de Fralda", `
        <fieldset class="form-group" style="border: none; padding: 0;">
          <legend style="font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 0.35rem;">O que havia na fralda?</legend>
          <div class="opcoes-marcaveis">
            <label><input type="checkbox" id="reg-fralda-xixi" onchange="RegistroRotina.ajustarFralda(this)"> 💧 Xixi</label>
            <label><input type="checkbox" id="reg-fralda-coco" onchange="RegistroRotina.ajustarFralda(this)"> 💩 Cocô</label>
            <label><input type="checkbox" id="reg-fralda-limpa" onchange="RegistroRotina.ajustarFralda(this)"> Fralda limpa / seca</label>
          </div>
          <span class="texto-apoio">Marque xixi e cocô juntos quando houver os dois na mesma troca.</span>
        </fieldset>
        <div class="form-group" data-fralda="COCO" hidden>
          <label for="reg-fralda-consistencia">Consistência do cocô (opcional)</label>
          <select class="form-control" id="reg-fralda-consistencia">
            <option value="">Não informar</option>
            <option value="LIQUIDA">Líquida</option>
            <option value="PASTOSA">Pastosa</option>
            <option value="FIRME">Firme</option>
            <option value="ENDURECIDA">Endurecida</option>
          </select>
        </div>
        ${hora("Horário da Troca")}
        ${obs("Ex: Pomada aplicada, assadura leve")}`],

      sono: ["💤 Registrar Período de Sono", `
        <div class="form-group">
          <label for="reg-sono-inicio">Início do Sono</label>
          <input type="time" class="form-control" id="reg-sono-inicio" value="${agora}" required>
        </div>
        <div class="form-group">
          <label for="reg-sono-fim">Fim do Sono (vazio se ainda dormindo)</label>
          <input type="time" class="form-control" id="reg-sono-fim">
          <span class="texto-apoio">Se o fim for menor que o início, o início é considerado no dia anterior.</span>
        </div>
        <div class="form-group">
          <label for="reg-sono-local">Local (opcional)</label>
          <input type="text" class="form-control" id="reg-sono-local" maxlength="60" placeholder="Ex: berço">
        </div>`],

      remedios: ["💊 Registrar Medicação", `
        <p class="texto-apoio">Registre apenas medicamentos orientados por um profissional de saúde.</p>
        <div class="form-group">
          <label for="reg-remedio-nome">Nome do Remédio / Vitamina</label>
          <input type="text" class="form-control" id="reg-remedio-nome" maxlength="120" placeholder="Ex: Vitamina D" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="reg-remedio-dose">Dosagem</label>
            <input type="text" class="form-control" id="reg-remedio-dose" maxlength="60" placeholder="Ex: 4 gotas" required>
          </div>
          <div class="form-group">
            <label for="reg-remedio-via">Via (opcional)</label>
            <input type="text" class="form-control" id="reg-remedio-via" maxlength="60" placeholder="Ex: oral">
          </div>
        </div>
        ${hora()}`],

      acordou: ["🦥 Hora que Acordou", `
        ${hora("Horário do Despertar")}
        <div class="form-group">
          <label for="reg-humor">Humor ao Acordar</label>
          <select class="form-control" id="reg-humor">
            <option value="Calmo e bem-disposto">Calmo e bem-disposto</option>
            <option value="Choroso / Irritado">Choroso / Irritado</option>
            <option value="Pedindo comida logo">Pedindo comida logo</option>
          </select>
        </div>
        <div id="reg-sono-aberto"></div>`],

      ritual_bom_dia: ["☀️ Ritual do Bom Dia", `${hora()}${obs("Ex: Troca de roupa, cortinas abertas, banho de sol", "Atividades Realizadas")}`],
      ritual_sono: ["🌙 Ritual do Sono", `${hora("Horário de Início")}${obs("Ex: Banho morno, massagem, ruído branco", "Etapas do Ritual")}`],

      brincar: ["🧸 Momento de Brincar", `
        <div class="form-group">
          <label for="reg-obs">Atividade / Brincadeira</label>
          <input type="text" class="form-control" id="reg-obs" maxlength="255" placeholder="Ex: Tummy time, mordedor, historinha" required>
        </div>
        <div class="form-group">
          <label for="reg-duracao">Duração (minutos)</label>
          <input type="number" class="form-control" id="reg-duracao" placeholder="Ex: 25" min="1" max="1440">
        </div>
        ${hora()}`],

      banho: ["🫧 Banho do Bebê", `${hora()}${obs("Ex: Banho relaxante antes da soneca")}`],

      horario: ["⏰ Agendar Próximo Horário", `
        <p class="texto-apoio">O horário previsto é só um lembrete: ao realizar o cuidado, registre-o pelos botões de rotina.</p>
        <div class="form-group">
          <label for="reg-horario-tipo">Tipo</label>
          <select class="form-control" id="reg-horario-tipo" onchange="RegistroRotina.ajustarHorario()" required>
            <option value="">Selecione o tipo</option>
            ${Object.entries(TIPOS_HORARIO).map(([valor, t]) => `<option value="${valor}">${t.rotulo}</option>`).join("")}
          </select>
        </div>
        <p class="texto-apoio" id="reg-horario-aviso" hidden></p>
        <div class="form-group">
          <label for="reg-horario-quando">Data e hora previstas</label>
          <input type="datetime-local" class="form-control" id="reg-horario-quando" required>
        </div>
        ${["descricao", "detalhes", "local"].map(campo => `
        <div class="form-group" data-horario-campo="${campo}" hidden>
          <label for="reg-horario-${campo}"></label>
          <input type="text" class="form-control" id="reg-horario-${campo}" maxlength="${campo === "local" ? 150 : 300}">
        </div>`).join("")}`]
    };

    const [textoTitulo, campos] = formularios[tipo];
    titulo.innerText = `${textoTitulo} — ${BebeAtivo.atual.nome}`;
    container.innerHTML = `<div id="msg-registro"></div>${campos}`;
    modal.classList.add("open");
    modal.style.display = "flex";

    if (tipo === "acordou") await this.oferecerEncerrarSono();
  },

  fechar() {
    const modal = document.getElementById("modal-registro");
    if (modal) {
      modal.classList.remove("open");
      modal.style.display = "none";
    }
    this.tipoAtual = null;
  },

  ajustarAlimentacao() {
    const opcao = OPCOES_ALIMENTACAO[document.getElementById("reg-tipo-alimento").value];
    mostrarGrupos("data-alimento", opcao ? [opcao.grupo] : []);
  },

  // Xixi e cocô podem ser marcados juntos; "limpa" exclui os dois
  ajustarFralda(origem) {
    const xixi = document.getElementById("reg-fralda-xixi");
    const coco = document.getElementById("reg-fralda-coco");
    const limpa = document.getElementById("reg-fralda-limpa");
    if (origem === limpa && limpa.checked) {
      xixi.checked = false;
      coco.checked = false;
    } else if (origem !== limpa && origem.checked) {
      limpa.checked = false;
    }
    mostrarGrupos("data-fralda", coco.checked ? ["COCO"] : []);
  },

  // Troca rótulos, exemplos e campos conforme o tipo; ao mudar de tipo, os campos começam vazios
  ajustarHorario() {
    const config = TIPOS_HORARIO[document.getElementById("reg-horario-tipo").value] || {};
    ["descricao", "detalhes", "local"].forEach(campo => {
      const grupo = document.querySelector(`[data-horario-campo="${campo}"]`);
      const input = document.getElementById(`reg-horario-${campo}`);
      const def = config[campo];
      grupo.hidden = !def;
      input.value = "";
      input.required = Boolean(def?.obrigatorio);
      input.placeholder = def?.exemplo || "";
      grupo.querySelector("label").textContent = def?.rotulo || "";
    });
    const aviso = document.getElementById("reg-horario-aviso");
    aviso.textContent = config.aviso || "";
    aviso.hidden = !config.aviso;
  },

  // "Hora que acordou" pode encerrar o sono em andamento
  async oferecerEncerrarSono() {
    this.sonoAberto = null;
    try {
      const sonos = await ApiService.sonos.listar(BebeAtivo.atual.id,
        { inicio: somarDias(this.dataBase, -1), fim: this.dataBase });
      this.sonoAberto = sonos.find(s => !s.fim) || null;
    } catch {
      return;
    }
    const alvo = document.getElementById("reg-sono-aberto");
    if (this.sonoAberto && alvo) {
      alvo.innerHTML = `
        <label style="display: flex; gap: 0.5rem; align-items: center; font-size: 0.85rem;">
          <input type="checkbox" id="reg-encerrar-sono" checked>
          Encerrar o sono iniciado em ${formatarDataHoraBr(this.sonoAberto.inicio)}
        </label>`;
    }
  },

  // ----------------------------------------------------
  // SALVAR REGISTRO (API)
  // ----------------------------------------------------
  async salvar(e) {
    e.preventDefault();
    if (!BebeAtivo.garantirContexto()) return;

    const bebeId = BebeAtivo.atual.id;
    const data = this.dataBase;
    const valor = (id) => document.getElementById(id)?.value.trim() || "";
    const numero = (id) => valor(id) ? Number(valor(id)) : null;
    const dataHora = `${data}T${valor("reg-hora")}:00`;
    const botao = e.target.querySelector("button[type=submit]");
    botao.disabled = true; // evita registros duplicados por duplo clique

    try {
      switch (this.tipoAtual) {
        case "alimentacao": {
          const opcao = OPCOES_ALIMENTACAO[valor("reg-tipo-alimento")];
          if (!opcao) throw new Error("Selecione o tipo de alimentação.");
          // Envia apenas os campos do tipo escolhido
          const corpo = { tipo: opcao.tipo, dataHora, observacao: valor("reg-obs") || null };
          if (opcao.tipo === "PEITO") {
            Object.assign(corpo, { lado: valor("reg-lado"), duracaoMinutos: numero("reg-duracao-mamada") });
          } else if (opcao.tipo === "MAMADEIRA") {
            Object.assign(corpo, { tipoLeite: opcao.tipoLeite, volumeMl: numero("reg-volume") });
          } else {
            Object.assign(corpo, { alimento: valor("reg-alimento"), quantidade: valor("reg-quantidade") || null });
          }
          await ApiService.alimentacoes.criar(bebeId, corpo);
          break;
        }
        case "fralda": {
          const xixi = document.getElementById("reg-fralda-xixi").checked;
          const coco = document.getElementById("reg-fralda-coco").checked;
          const limpa = document.getElementById("reg-fralda-limpa").checked;
          if (!xixi && !coco && !limpa) throw new Error("Marque xixi, cocô ou fralda limpa.");
          const tipo = xixi && coco ? "MISTO" : coco ? "COCO" : xixi ? "XIXI" : "LIMPA";
          await ApiService.fraldas.criar(bebeId, {
            tipo, dataHora,
            consistenciaCoco: coco ? (valor("reg-fralda-consistencia") || null) : null,
            observacoes: valor("reg-obs") || null
          });
          break;
        }
        case "sono": {
          const inicio = valor("reg-sono-inicio");
          const fim = valor("reg-sono-fim");
          const diaInicio = fim && fim < inicio ? somarDias(data, -1) : data;
          await ApiService.sonos.criar(bebeId, {
            inicio: `${diaInicio}T${inicio}:00`,
            fim: fim ? `${data}T${fim}:00` : null,
            local: valor("reg-sono-local") || null
          });
          break;
        }
        case "remedios":
          await ApiService.medicamentos.criar(bebeId, {
            nomeMedicamento: valor("reg-remedio-nome"), dosagem: valor("reg-remedio-dose"),
            viaAdministracao: valor("reg-remedio-via") || null, dataHora
          });
          break;
        case "acordou":
          if (this.sonoAberto && document.getElementById("reg-encerrar-sono")?.checked) {
            await ApiService.sonos.encerrar(bebeId, this.sonoAberto.id, dataHora);
          }
          await ApiService.atividades.criar(bebeId, { tipo: "ACORDOU", dataHora, descricao: valor("reg-humor") });
          break;
        case "ritual_bom_dia":
        case "ritual_sono":
        case "brincar":
          await ApiService.atividades.criar(bebeId, {
            tipo: TIPOS_ATIVIDADE[this.tipoAtual], dataHora,
            duracaoMinutos: numero("reg-duracao"), descricao: valor("reg-obs") || null
          });
          break;
        case "banho":
          await ApiService.higienes.criar(bebeId, { tipo: "BANHO", dataHora, observacoes: valor("reg-obs") || null });
          break;
        case "horario":
          await ApiService.horarios.criar(bebeId, {
            tipo: valor("reg-horario-tipo"),
            dataHoraPrevista: `${valor("reg-horario-quando")}:00`,
            descricao: valor("reg-horario-descricao") || null,
            detalhes: valor("reg-horario-detalhes") || null,
            local: valor("reg-horario-local") || null
          });
          break;
      }
      this.fechar();
      if (this.aoSalvar) await this.aoSalvar();
    } catch (error) {
      mostrarMensagem("msg-registro", error.message);
    } finally {
      botao.disabled = false;
    }
  },

  // ----------------------------------------------------
  // LINHA DO TEMPO
  // ----------------------------------------------------
  /**
   * @param {HTMLElement} lista - container .timeline-list
   * @param {Array} itens - LinhaDoTempoItemResponse (ordem cronológica)
   * @param {object} opcoes - { comAcoes: boolean, vazio: string }
   */
  renderizarLinhaDoTempo(lista, itens, opcoes = {}) {
    if (!itens.length) {
      lista.innerHTML = `<p class="estado-vazio">${opcoes.vazio || "Nenhum registro neste dia."}</p>`;
      return;
    }
    // Mais recentes primeiro
    lista.innerHTML = [...itens].reverse().map(item => {
      const cat = CATEGORIAS[item.categoria] || CATEGORIAS.ATIVIDADE;
      const horario = item.fim ? `${horaDe(item.dataHora)} às ${horaDe(item.fim)}` : horaDe(item.dataHora);
      const acoes = !opcoes.comAcoes ? "" : `
        <div style="display: flex; gap: 0.35rem; flex-shrink: 0;">
          ${item.categoria === "SONO" && item.tipo === "EM_ANDAMENTO"
            ? `<button type="button" class="btn-outline" onclick="RegistroRotina.encerrarSonoAgora(${item.id})">Acordou agora</button>` : ""}
          <button type="button" class="btn-outline perigo" onclick="RegistroRotina.excluir('${item.categoria}', ${item.id})">Excluir</button>
        </div>`;
      return `
        <div class="timeline-item" data-tipo="${cat.filtro}">
          <div class="timeline-dot" style="background: ${cat.cor};"></div>
          <div style="flex: 1;">
            <strong style="font-size: 0.88rem;">${horario} • ${escaparHtml(item.titulo)}</strong>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${escaparHtml(item.descricao || "")}</p>
          </div>
          ${acoes}
        </div>`;
    }).join("");
  },

  async excluir(categoria, id) {
    if (!BebeAtivo.garantirContexto()) return;
    if (!confirm("Excluir este registro?")) return;
    try {
      await ApiService[CATEGORIAS[categoria].recurso].excluir(BebeAtivo.atual.id, id);
      if (this.aoSalvar) await this.aoSalvar();
    } catch (error) {
      alert(error.message);
    }
  },

  async encerrarSonoAgora(id) {
    if (!BebeAtivo.garantirContexto()) return;
    try {
      await ApiService.sonos.encerrar(BebeAtivo.atual.id, id, agoraIsoLocal());
      if (this.aoSalvar) await this.aoSalvar();
    } catch (error) {
      alert(error.message);
    }
  }
};

// Nomes usados pelos atributos onclick/onsubmit já existentes nas páginas
function abrirModal(tipo) { RegistroRotina.abrir(tipo); }
function fecharModal() { RegistroRotina.fechar(); }
function salvarRegistro(e) { RegistroRotina.salvar(e); }

window.RegistroRotina = RegistroRotina;
window.TIPOS_HORARIO = TIPOS_HORARIO;
