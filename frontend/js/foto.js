/**
 * foto.js - Seleção (com prévia) e exibição da foto do bebê
 * Projeto Integrador: Babá Premium
 *
 * A foto fica gravada no servidor (PUT /bebes/{id}/foto). Para exibi-la, o arquivo é baixado com o token
 * (GET /bebes/{id}/foto) e mostrado via URL temporária do navegador — usada só para exibição.
 */

const FotoBebe = {
  PADRAO: "../assets/images/bebe-padrao.svg",
  TIPOS_ACEITOS: ["image/jpeg", "image/png", "image/webp"],
  TAMANHO_MAXIMO: 5 * 1024 * 1024,

  /**
   * Validação no navegador: tipo, tamanho e assinatura do conteúdo (o servidor repete a checagem).
   * @returns {Promise<string|null>} mensagem de erro ou null
   */
  async validar(arquivo) {
    if (!arquivo) return null;
    const invalido = "Formato não suportado. Escolha uma imagem JPEG, PNG ou WebP.";
    if (!this.TIPOS_ACEITOS.includes(arquivo.type)) return invalido;
    if (arquivo.size > this.TAMANHO_MAXIMO) return "A foto deve ter no máximo 5 MB.";
    const b = new Uint8Array(await arquivo.slice(0, 12).arrayBuffer());
    const texto = (i, n) => String.fromCharCode(...b.slice(i, i + n));
    const jpeg = b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
    const png = b[0] === 0x89 && texto(1, 3) === "PNG";
    const webp = texto(0, 4) === "RIFF" && texto(8, 4) === "WEBP";
    return jpeg || png || webp ? null : invalido;
  },

  /** Mostra a foto persistida do bebê no <img>, ou a imagem padrão quando não houver. */
  async exibir(bebe, img) {
    if (!img) return;
    this.trocarSrc(img, this.PADRAO);
    img.dataset.bebeId = bebe ? bebe.id : "";
    if (!bebe || !bebe.possuiFoto) return;
    try {
      const blob = await ApiService.bebes.obterFoto(bebe.id);
      // Ignora a resposta se o <img> já passou a mostrar outro bebê
      if (blob && img.dataset.bebeId === String(bebe.id)) {
        this.trocarSrc(img, URL.createObjectURL(blob));
      }
    } catch (error) {
      console.warn("Foto indisponível:", error.message);
    }
  },

  trocarSrc(img, src) {
    if (img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
    img.src = src;
  },

  /**
   * Cria um seletor de foto dentro do container.
   * @returns {{ arquivo: () => File|null, limpar: () => void }}
   */
  criarSeletor(container) {
    container.innerHTML = `
      <div class="foto-upload">
        <img class="foto-bebe grande" alt="Prévia da foto do bebê">
        <div style="display: flex; flex-direction: column; gap: 0.35rem;">
          <input type="file" accept="image/jpeg,image/png,image/webp">
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <button type="button" class="btn-outline" data-acao="escolher">Escolher foto</button>
            <button type="button" class="btn-outline perigo" data-acao="remover" hidden>Remover</button>
          </div>
          <span class="texto-apoio">Opcional • JPEG, PNG ou WebP, até 5 MB</span>
          <span class="texto-apoio" data-erro style="color: #b91c1c;"></span>
        </div>
      </div>`;

    const img = container.querySelector("img");
    const input = container.querySelector("input[type=file]");
    const btnEscolher = container.querySelector("[data-acao=escolher]");
    const btnRemover = container.querySelector("[data-acao=remover]");
    const erro = container.querySelector("[data-erro]");
    let selecionado = null;

    const atualizar = () => {
      this.trocarSrc(img, selecionado ? URL.createObjectURL(selecionado) : this.PADRAO);
      btnRemover.hidden = !selecionado;
      btnEscolher.textContent = selecionado ? "Trocar foto" : "Escolher foto";
    };

    btnEscolher.addEventListener("click", () => input.click());
    btnRemover.addEventListener("click", () => {
      selecionado = null;
      input.value = "";
      erro.textContent = "";
      atualizar();
    });
    input.addEventListener("change", async () => {
      const arquivo = input.files[0] || null;
      const problema = await this.validar(arquivo);
      erro.textContent = problema || "";
      if (problema) {
        input.value = "";
        return;
      }
      if (arquivo) selecionado = arquivo;
      atualizar();
    });

    atualizar();
    return {
      arquivo: () => selecionado,
      limpar: () => btnRemover.click()
    };
  }
};

window.FotoBebe = FotoBebe;
