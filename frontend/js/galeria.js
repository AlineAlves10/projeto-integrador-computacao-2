/**
 * galeria.js - Galeria privada de fotos e vídeos do bebê ativo
 * Projeto Integrador: Babá Premium
 *
 *   GET    /bebes/{id}/midias?pagina=&tamanho=     lista paginada (mais recentes primeiro)
 *   POST   /bebes/{id}/midias                      envio (arquivo, miniatura do vídeo, descrição)
 *   GET    /bebes/{id}/midias/{m}/miniatura        miniatura (baixada só quando aparece na tela)
 *   GET    /bebes/{id}/midias/{m}/arquivo          original (vídeo: só quando o usuário pede)
 *   DELETE /bebes/{id}/midias/{m}                  exclusão (quem enviou ou responsável)
 *
 * Os arquivos são baixados com o token e exibidos por URLs temporárias do navegador (blob:), que só
 * existem nesta aba e são liberadas ao sair da página ou fechar a mídia.
 */

const Galeria = {
  TAMANHO_PAGINA: 12,
  TIPOS_FOTO: ["image/jpeg", "image/png", "image/webp"],
  TIPOS_VIDEO: ["video/mp4", "video/quicktime", "video/webm"],
  MAX_FOTO: 10 * 1024 * 1024,
  MAX_VIDEO: 50 * 1024 * 1024,
  MAX_DURACAO_VIDEO_S: 5 * 60, // conferido no navegador; o servidor limita o tamanho

  proximaPagina: 0,
  midias: new Map(),
  urlsTemporarias: [],
  urlVisualizador: null,
  atual: null,
  observador: null,

  bebeId() {
    return BebeAtivo.atual.id;
  },

  guardarUrl(blob) {
    const url = URL.createObjectURL(blob);
    this.urlsTemporarias.push(url);
    return url;
  },

  // ----------------------------------------------------
  // LISTAGEM PAGINADA
  // ----------------------------------------------------
  async carregarPagina(reiniciar = false) {
    const grade = document.getElementById("galeria-grade");
    const botaoMais = document.getElementById("btn-mais");
    if (reiniciar) {
      this.proximaPagina = 0;
      this.midias.clear();
      grade.innerHTML = "";
      this.urlsTemporarias.forEach(URL.revokeObjectURL);
      this.urlsTemporarias = [];
    }
    botaoMais.disabled = true;
    try {
      const pagina = await ApiService.midias.listar(this.bebeId(), this.proximaPagina, this.TAMANHO_PAGINA);
      if (pagina.totalItens === 0) {
        grade.innerHTML = '<p class="estado-vazio" style="grid-column: 1 / -1;">Nenhuma foto ou vídeo ainda.</p>';
      }
      pagina.itens.forEach(m => {
        this.midias.set(m.id, m);
        grade.insertAdjacentHTML("beforeend", this.cartao(m));
        const img = grade.querySelector(`[data-miniatura="${m.id}"]`);
        if (img) this.observador.observe(img);
      });
      this.proximaPagina = pagina.pagina + 1;
      botaoMais.hidden = this.proximaPagina >= pagina.totalPaginas;
    } catch (error) {
      mostrarMensagem("msg-galeria", error.message);
    } finally {
      botaoMais.disabled = false;
    }
  },

  cartao(m) {
    const quando = formatarDataHoraBr(m.dataEnvio);
    const visual = m.possuiMiniatura
      ? `<img class="midia-miniatura" data-miniatura="${m.id}" alt="${escaparHtml(m.descricao || "Mídia do bebê")}">`
      : '<div class="midia-miniatura" aria-hidden="true">🎬</div>';
    return `
      <button type="button" class="midia-item" onclick="Galeria.abrir(${m.id})">
        ${visual}
        ${m.tipo === "VIDEO" ? '<span class="midia-selo-video">▶ vídeo</span>' : ""}
        <span class="midia-legenda">${escaparHtml(quando)}<br>por ${escaparHtml(m.enviadoPorNome)}</span>
      </button>`;
  },

  // Miniaturas baixadas só quando o cartão entra na tela (economia de dados)
  criarObservador() {
    this.observador = new IntersectionObserver(entradas => {
      entradas.filter(e => e.isIntersecting).forEach(async e => {
        const img = e.target;
        this.observador.unobserve(img);
        try {
          const blob = await ApiService.midias.miniatura(this.bebeId(), Number(img.dataset.miniatura));
          if (blob) img.src = this.guardarUrl(blob);
        } catch {
          img.alt = "Miniatura indisponível";
        }
      });
    }, { rootMargin: "200px" });
  },

  // ----------------------------------------------------
  // VISUALIZAÇÃO INDIVIDUAL
  // ----------------------------------------------------
  async abrir(id) {
    const m = this.midias.get(id);
    if (!m) return;
    this.atual = m;
    const conteudo = document.getElementById("visualizador-conteudo");
    mostrarMensagem("msg-visualizador", "");
    document.getElementById("visualizador-titulo").textContent = m.tipo === "VIDEO" ? "Vídeo" : "Foto";
    document.getElementById("visualizador-info").textContent = [
      m.descricao,
      `Enviado em ${formatarDataHoraBr(m.dataEnvio)} por ${m.enviadoPorNome}`,
      formatarTamanho(m.tamanhoBytes)
    ].filter(Boolean).join(" • ");
    document.getElementById("btn-excluir-midia").hidden = !m.podeExcluir;
    document.getElementById("visualizador").classList.add("open");

    if (m.tipo === "VIDEO") {
      // O vídeo só é baixado quando o usuário pede
      conteudo.innerHTML = `
        <button type="button" class="btn-action-small" id="btn-carregar-video">
          ▶ Carregar vídeo (${escaparHtml(formatarTamanho(m.tamanhoBytes))})
        </button>`;
      document.getElementById("btn-carregar-video").addEventListener("click", () => this.carregarOriginal(m, conteudo));
    } else {
      conteudo.innerHTML = '<p class="estado-vazio">Carregando...</p>';
      await this.carregarOriginal(m, conteudo);
    }
  },

  async carregarOriginal(m, conteudo) {
    conteudo.innerHTML = '<p class="estado-vazio">Carregando...</p>';
    try {
      const blob = await ApiService.midias.arquivo(this.bebeId(), m.id);
      if (this.atual?.id !== m.id) return; // o usuário já fechou ou abriu outra mídia
      if (!blob) throw new Error("Arquivo não encontrado.");
      this.liberarVisualizador();
      this.urlVisualizador = URL.createObjectURL(blob);
      conteudo.innerHTML = m.tipo === "VIDEO"
        ? `<video controls autoplay playsinline src="${this.urlVisualizador}"></video>`
        : `<img src="${this.urlVisualizador}" alt="${escaparHtml(m.descricao || "Foto do bebê")}">`;
    } catch (error) {
      conteudo.innerHTML = "";
      mostrarMensagem("msg-visualizador", error.message);
    }
  },

  liberarVisualizador() {
    if (this.urlVisualizador) URL.revokeObjectURL(this.urlVisualizador);
    this.urlVisualizador = null;
  },

  fechar() {
    document.getElementById("visualizador").classList.remove("open");
    document.getElementById("visualizador-conteudo").innerHTML = "";
    this.liberarVisualizador();
    this.atual = null;
  },

  async excluirAtual() {
    if (!this.atual || !BebeAtivo.garantirContexto()) return;
    if (!confirm("Excluir esta mídia? Esta ação não pode ser desfeita.")) return;
    try {
      await ApiService.midias.excluir(this.bebeId(), this.atual.id);
      this.fechar();
      await this.carregarPagina(true);
    } catch (error) {
      mostrarMensagem("msg-visualizador", error.message);
    }
  },

  // ----------------------------------------------------
  // ENVIO
  // ----------------------------------------------------
  async enviar(e) {
    e.preventDefault();
    if (!BebeAtivo.garantirContexto()) return;
    const input = document.getElementById("midia-arquivo");
    const arquivo = input.files[0];
    const botao = document.getElementById("btn-enviar-midia");
    mostrarMensagem("msg-envio", "");
    if (!arquivo) return;

    botao.disabled = true;
    try {
      let miniatura = null;
      if (this.TIPOS_FOTO.includes(arquivo.type)) {
        if (arquivo.size > this.MAX_FOTO) throw new Error("A foto deve ter no máximo 10 MB.");
      } else if (this.TIPOS_VIDEO.includes(arquivo.type)) {
        if (arquivo.size > this.MAX_VIDEO) throw new Error("O vídeo deve ter no máximo 50 MB.");
        miniatura = await this.miniaturaDoVideo(arquivo);
      } else {
        throw new Error("Formato não suportado. Envie foto JPEG, PNG ou WebP, ou vídeo MP4, MOV ou WebM.");
      }
      botao.textContent = "Enviando...";
      await ApiService.midias.enviar(this.bebeId(), arquivo, miniatura,
        document.getElementById("midia-descricao").value.trim());
      document.getElementById("form-midia").reset();
      mostrarMensagem("msg-envio", "Mídia enviada.", "sucesso");
      await this.carregarPagina(true);
    } catch (error) {
      mostrarMensagem("msg-envio", error.message);
    } finally {
      botao.disabled = false;
      botao.textContent = "Enviar";
    }
  },

  // Gera no navegador um JPEG de um quadro do vídeo (o servidor valida e redimensiona).
  // Também confere a duração. Se o navegador não conseguir ler o vídeo, envia sem miniatura.
  miniaturaDoVideo(arquivo) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(arquivo);
      const video = document.createElement("video");
      video.muted = true;
      video.preload = "metadata";
      const terminar = (valor, erro) => {
        URL.revokeObjectURL(url);
        erro ? reject(erro) : resolve(valor);
      };
      video.onerror = () => terminar(null);
      video.onloadedmetadata = () => {
        if (video.duration > this.MAX_DURACAO_VIDEO_S) {
          terminar(null, new Error("O vídeo deve ter no máximo 5 minutos."));
          return;
        }
        video.currentTime = Math.min(1, video.duration / 2);
      };
      video.onseeked = () => {
        const escala = Math.min(1, 320 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * escala));
        canvas.height = Math.max(1, Math.round(video.videoHeight * escala));
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => terminar(blob), "image/jpeg", 0.75);
      };
      video.src = url;
    });
  }
};

function formatarTamanho(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

window.addEventListener("pagehide", () => {
  Galeria.urlsTemporarias.forEach(URL.revokeObjectURL);
  Galeria.liberarVisualizador();
});

document.addEventListener("keydown", (e) => { if (e.key === "Escape") Galeria.fechar(); });

document.addEventListener("DOMContentLoaded", async () => {
  let bebe;
  try {
    bebe = await BebeAtivo.inicializar();
  } catch {
    return;
  }
  if (!bebe) {
    mostrarMensagem("msg-galeria", "Nenhum bebê selecionado.");
    return;
  }
  document.getElementById("card-envio").hidden = false;
  Galeria.criarObservador();
  await Galeria.carregarPagina(true);
});

window.Galeria = Galeria;
