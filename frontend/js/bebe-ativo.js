/**
 * bebe-ativo.js - Seletor do bebê ativo (usado em todas as páginas internas)
 * Projeto Integrador: Babá Premium
 *
 * A lista vem de GET /bebes/meus (apenas bebês vinculados ao usuário logado).
 * Trocar de bebê recarrega a página: os dados da criança anterior e formulários não enviados são descartados.
 * Antes de cada envio, as telas chamam BebeAtivo.garantirContexto() para não gravar no bebê errado
 * caso a seleção tenha mudado em outra aba.
 */

const ROTULO_PAPEL = { RESPONSAVEL: "Responsável", BABA: "Babá" };

const BebeAtivo = {
  lista: [],
  atual: null,
  papel: null,
  idDaTela: null,

  /**
   * Carrega os bebês do usuário, define o ativo e desenha o seletor no container.
   * @returns {Promise<object|null>} BebeResponse do bebê ativo ou null se não houver nenhum
   */
  async inicializar(containerId = "seletor-bebe") {
    const container = document.getElementById(containerId);
    const usuario = AuthService.getUsuarioLogado();
    if (container) container.innerHTML = '<span class="texto-apoio">Carregando bebês...</span>';

    try {
      this.lista = await ApiService.bebes.meus();
    } catch (error) {
      if (container) mostrarMensagem(container, error.message);
      throw error;
    }

    const salvo = AuthService.getBebeAtivoId(usuario.id);
    const item = this.lista.find(v => v.bebe.id === salvo) || this.lista[0] || null;

    if (item) {
      AuthService.setBebeAtivoId(usuario.id, item.bebe.id);
    } else {
      AuthService.limparBebeAtivo(usuario.id);
    }
    this.atual = item ? item.bebe : null;
    this.papel = item ? item.papel : null;
    this.idDaTela = this.atual ? this.atual.id : null;

    if (container) this.desenhar(container);
    this.observarOutrasAbas(usuario.id);
    return this.atual;
  },

  desenhar(container) {
    if (!this.atual) {
      container.innerHTML = `
        <div class="seletor-bebe">
          <img class="foto-bebe" src="${FotoBebe.PADRAO}" alt="">
          <div class="seletor-info">
            <h3>Nenhum bebê vinculado</h3>
            <p class="texto-apoio">Cadastre um bebê ou peça para ser vinculado(a) por um responsável.</p>
          </div>
          <a href="perfil-bebe.html" class="btn-outline" style="text-decoration: none;">Cadastrar bebê</a>
        </div>`;
      return;
    }

    const outros = this.lista.length > 1;
    container.innerHTML = `
      <div class="seletor-bebe">
        <img class="foto-bebe" data-foto-ativo alt="Foto de ${escaparHtml(this.atual.nome)}">
        <div class="seletor-info">
          <h3 id="bebe-nome">${escaparHtml(this.atual.nome)}</h3>
          <p class="texto-apoio" id="bebe-idade">${escaparHtml(calcularIdade(this.atual.dataNascimento))} • você é ${escaparHtml((ROTULO_PAPEL[this.papel] || "").toLowerCase())}</p>
        </div>
        ${outros ? '<button type="button" class="btn-outline" id="btn-trocar-bebe" aria-haspopup="true" aria-expanded="false">Trocar bebê ▾</button>' : ""}
        <div class="seletor-lista" id="lista-trocar-bebe" hidden>
          ${this.lista.map(v => `
            <button type="button" data-bebe-id="${v.bebe.id}" class="${v.bebe.id === this.atual.id ? "ativo" : ""}">
              <img class="foto-bebe pequena" data-foto-bebe="${v.bebe.id}" alt="">
              <span><strong>${escaparHtml(v.bebe.nome)}</strong><br>
              <span class="texto-apoio">${escaparHtml(calcularIdade(v.bebe.dataNascimento))} • ${escaparHtml(ROTULO_PAPEL[v.papel] || v.papel)}</span></span>
            </button>`).join("")}
        </div>
      </div>`;

    FotoBebe.exibir(this.atual, container.querySelector("[data-foto-ativo]"));

    if (!outros) return;
    const botao = container.querySelector("#btn-trocar-bebe");
    const lista = container.querySelector("#lista-trocar-bebe");
    let fotosCarregadas = false;

    botao.addEventListener("click", (e) => {
      e.stopPropagation();
      lista.hidden = !lista.hidden;
      botao.setAttribute("aria-expanded", String(!lista.hidden));
      if (!fotosCarregadas) {
        fotosCarregadas = true;
        this.lista.forEach(v => FotoBebe.exibir(v.bebe, lista.querySelector(`[data-foto-bebe="${v.bebe.id}"]`)));
      }
    });
    lista.querySelectorAll("[data-bebe-id]").forEach(item =>
      item.addEventListener("click", () => this.selecionar(Number(item.dataset.bebeId))));
    const fecharLista = () => {
      lista.hidden = true;
      botao.setAttribute("aria-expanded", "false");
    };
    document.addEventListener("click", fecharLista);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharLista(); });
  },

  /** Troca o bebê ativo e recarrega a página com os dados dele. */
  selecionar(bebeId) {
    const usuario = AuthService.getUsuarioLogado();
    if (!this.lista.some(v => v.bebe.id === bebeId)) return;
    AuthService.setBebeAtivoId(usuario.id, bebeId);
    window.location.reload();
  },

  /**
   * Confere, antes de gravar, se o bebê ativo ainda é o mesmo exibido na tela.
   * @returns {boolean} false se a seleção mudou (a página é recarregada)
   */
  garantirContexto() {
    const usuario = AuthService.getUsuarioLogado();
    if (!this.idDaTela || AuthService.getBebeAtivoId(usuario.id) !== this.idDaTela) {
      alert("O bebê selecionado mudou. A página será atualizada para evitar registrar no bebê errado.");
      window.location.reload();
      return false;
    }
    return true;
  },

  // Seleção trocada em outra aba: recarrega esta também
  observarOutrasAbas(usuarioId) {
    window.addEventListener("storage", (e) => {
      if (e.key === BEBE_KEY_PREFIX + usuarioId && Number(e.newValue) !== this.idDaTela) {
        window.location.reload();
      }
    });
  }
};

window.BebeAtivo = BebeAtivo;
