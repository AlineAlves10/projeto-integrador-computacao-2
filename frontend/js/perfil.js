/**
 * perfil.js - Conta do usuário, bebês acessíveis, foto, vínculos e cadastro de bebê
 * Projeto Integrador: Babá Premium
 *
 * Endpoints utilizados:
 *   GET  /usuarios/{id}                      dados da conta
 *   PUT  /usuarios/me/telefone               telefone de contato da conta
 *   GET  /bebes/{id}/contatos                pessoas vinculadas (telefone só quando permitido)
 *   GET  /bebes/meus                         bebês acessíveis (via BebeAtivo)
 *   POST /bebes                              cadastrar bebê (já vinculado a quem cadastra)
 *   PUT/GET/DELETE /bebes/{id}/foto          foto do bebê
 *   GET  /bebes/baba/{idBaba}                busca da babá (com filtros)
 *   POST/DELETE /bebes/{id}/usuarios         vincular por e-mail / remover (regras conferidas no servidor)
 */

const ROTULO_SEXO = { M: "Masculino", F: "Feminino" };

let usuarioLogado = null;
let seletorFotoNovoBebe = null;

// ----------------------------------------------------
// CONTA
// ----------------------------------------------------
async function carregarUsuario() {
  const lista = document.getElementById("dados-usuario");
  try {
    usuarioLogado = await ApiService.usuarios.obter(usuarioLogado.id);
    localStorage.setItem(USER_KEY, JSON.stringify(usuarioLogado));
  } catch (err) {
    lista.innerHTML = `<dt>Erro</dt><dd>${escaparHtml(err.message)}</dd>`;
    return;
  }

  lista.innerHTML = `
    <dt>Nome</dt><dd>${escaparHtml(usuarioLogado.nome)}</dd>
    <dt>E-mail</dt><dd>${escaparHtml(usuarioLogado.email)}</dd>
    <dt>Tipo</dt><dd>${escaparHtml(ROTULO_PAPEL[usuarioLogado.tipo] || usuarioLogado.tipo)}</dd>
    <dt>Telefone</dt><dd>${escaparHtml(formatarTelefone(usuarioLogado.telefone) || "—")}</dd>
    <dt>Cadastro</dt><dd>${formatarDataBr(usuarioLogado.dataCadastro)}</dd>
  `;
  document.getElementById("conta-telefone").value = formatarTelefone(usuarioLogado.telefone);
}

async function salvarTelefone(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-telefone");
  btn.disabled = true;
  try {
    usuarioLogado = await ApiService.usuarios.atualizarTelefone(document.getElementById("conta-telefone").value.trim());
    localStorage.setItem(USER_KEY, JSON.stringify(usuarioLogado));
    mostrarMensagem("msg-telefone", usuarioLogado.telefone ? "Telefone salvo." : "Telefone removido.", "sucesso");
    await carregarUsuario();
  } catch (err) {
    mostrarMensagem("msg-telefone", err.message);
  } finally {
    btn.disabled = false;
  }
}

// ----------------------------------------------------
// BEBÊ SELECIONADO E FOTO
// ----------------------------------------------------
function renderizarBebeAtual() {
  const container = document.getElementById("dados-bebe");
  const bebe = BebeAtivo.atual;
  document.getElementById("card-vinculos").hidden = !bebe;
  document.getElementById("gerenciar-foto").hidden = !bebe;

  if (!bebe) {
    container.innerHTML = '<p class="estado-vazio">Nenhum bebê selecionado. Cadastre um bebê abaixo ou peça a um responsável para vincular você.</p>';
    return;
  }

  container.innerHTML = `
    <dl class="info-list">
      <dt>Nome</dt><dd>${escaparHtml(bebe.nome)}</dd>
      <dt>Nascimento</dt><dd>${formatarDataBr(bebe.dataNascimento)} (${escaparHtml(calcularIdade(bebe.dataNascimento))})</dd>
      <dt>Sexo</dt><dd>${escaparHtml(ROTULO_SEXO[bebe.sexo] || bebe.sexo)}</dd>
      <dt>Responsável</dt><dd>${escaparHtml(bebe.nomeResponsavel || "—")}</dd>
      <dt>Observações</dt><dd>${escaparHtml(bebe.observacoes)}</dd>
      <dt>Seu papel</dt><dd>${escaparHtml(ROTULO_PAPEL[BebeAtivo.papel] || "")}</dd>
    </dl>
  `;
  FotoBebe.exibir(bebe, document.getElementById("foto-atual"));
  document.getElementById("btn-remover-foto").hidden = !bebe.possuiFoto;
}

function configurarTrocaDeFoto() {
  const input = document.getElementById("input-nova-foto");
  const previa = document.getElementById("previa-nova-foto");
  const btnEscolher = document.getElementById("btn-escolher-foto");
  const btnSalvar = document.getElementById("btn-salvar-foto");
  const btnCancelar = document.getElementById("btn-cancelar-foto");
  const btnRemover = document.getElementById("btn-remover-foto");
  let arquivo = null;

  const modoPrevia = (ativo) => {
    previa.hidden = !ativo;
    btnSalvar.hidden = !ativo;
    btnCancelar.hidden = !ativo;
    btnEscolher.textContent = ativo ? "Escolher outra" : "Trocar foto";
  };

  btnEscolher.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const escolhido = input.files[0];
    input.value = "";
    if (!escolhido) return;
    const problema = await FotoBebe.validar(escolhido);
    if (problema) {
      mostrarMensagem("msg-bebe", problema);
      return;
    }
    mostrarMensagem("msg-bebe", "");
    arquivo = escolhido;
    FotoBebe.trocarSrc(previa, URL.createObjectURL(arquivo));
    modoPrevia(true);
  });
  btnCancelar.addEventListener("click", () => {
    arquivo = null;
    modoPrevia(false);
  });
  btnSalvar.addEventListener("click", async () => {
    if (!arquivo || !BebeAtivo.garantirContexto()) return;
    btnSalvar.disabled = true;
    try {
      BebeAtivo.atual = await ApiService.bebes.enviarFoto(BebeAtivo.atual.id, arquivo);
      arquivo = null;
      modoPrevia(false);
      mostrarMensagem("msg-bebe", "Foto atualizada.", "sucesso");
      renderizarBebeAtual();
      await BebeAtivo.inicializar(); // atualiza a foto no seletor do topo
    } catch (error) {
      mostrarMensagem("msg-bebe", error.message);
    } finally {
      btnSalvar.disabled = false;
    }
  });
  btnRemover.addEventListener("click", async () => {
    if (!BebeAtivo.garantirContexto() || !confirm("Remover a foto deste bebê?")) return;
    try {
      await ApiService.bebes.removerFoto(BebeAtivo.atual.id);
      BebeAtivo.atual = { ...BebeAtivo.atual, possuiFoto: false };
      mostrarMensagem("msg-bebe", "Foto removida.", "sucesso");
      renderizarBebeAtual();
      await BebeAtivo.inicializar();
    } catch (error) {
      mostrarMensagem("msg-bebe", error.message);
    }
  });
}

// ----------------------------------------------------
// MEUS BEBÊS (lista de crianças acessíveis)
// ----------------------------------------------------
function renderizarMeusBebes() {
  const lista = document.getElementById("lista-meus-bebes");
  if (!BebeAtivo.lista.length) {
    lista.innerHTML = `<p class="estado-vazio">${usuarioLogado.tipo === "BABA"
      ? "Você ainda não tem bebês vinculados. Cadastre um bebê abaixo ou peça ao responsável para vincular você pelo seu e-mail."
      : "Você ainda não tem bebês cadastrados. Use o formulário abaixo."}</p>`;
    return;
  }
  lista.innerHTML = BebeAtivo.lista.map(v => `
    <div class="list-row">
      <div style="display: flex; gap: 0.65rem; align-items: center;">
        <img class="foto-bebe pequena" data-foto-lista="${v.bebe.id}" alt="">
        <div>
          <strong>${escaparHtml(v.bebe.nome)}</strong>
          <p class="texto-apoio">${escaparHtml(calcularIdade(v.bebe.dataNascimento))} • ${escaparHtml(ROTULO_PAPEL[v.papel] || v.papel)}${v.bebe.nomeResponsavel ? ` • resp.: ${escaparHtml(v.bebe.nomeResponsavel)}` : ""}</p>
        </div>
      </div>
      ${v.bebe.id === BebeAtivo.atual?.id
        ? '<span class="metric-badge">Selecionado</span>'
        : `<button type="button" class="btn-outline" onclick="BebeAtivo.selecionar(${v.bebe.id})">Selecionar</button>`}
    </div>`).join("");
  BebeAtivo.lista.forEach(v => FotoBebe.exibir(v.bebe, lista.querySelector(`[data-foto-lista="${v.bebe.id}"]`)));
}

// ----------------------------------------------------
// VÍNCULOS
// ----------------------------------------------------
async function carregarVinculos() {
  const lista = document.getElementById("lista-vinculos");
  lista.innerHTML = '<p class="estado-vazio">Carregando...</p>';

  try {
    const { podeGerenciarVinculos, contatos } = await ApiService.vinculos.contatos(BebeAtivo.atual.id);
    // O formulário só aparece para quem pode vincular; o servidor recusa as demais tentativas de qualquer forma
    document.getElementById("form-vinculo").hidden = !podeGerenciarVinculos;
    if (!contatos.length) {
      lista.innerHTML = '<p class="estado-vazio">Nenhum usuário vinculado.</p>';
      return;
    }
    lista.innerHTML = contatos.map(c => {
      const acoesContato = c.voce ? "" : [
        c.linkLigacao ? `<a class="btn-outline" href="${escaparHtml(c.linkLigacao)}">📞 Ligar</a>` : "",
        c.linkWhatsapp ? `<a class="btn-outline" href="${escaparHtml(c.linkWhatsapp)}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>` : ""
      ].join("");
      return `
        <div class="list-row">
          <div>
            <strong>${escaparHtml(c.nome)}${c.voce ? " (você)" : ""}</strong>
            <p class="texto-apoio">
              ${escaparHtml(ROTULO_PAPEL[c.papel] || c.papel)} • desde ${formatarDataBr(c.dataVinculo)}${c.telefone ? " • " + escaparHtml(c.telefone) : ""}
            </p>
          </div>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; justify-content: flex-end;">
            ${acoesContato}
            ${c.podeRemover ? `<button type="button" class="btn-outline perigo" onclick="removerVinculo(${c.usuarioId})">${c.voce ? "Sair" : "Remover"}</button>` : ""}
          </div>
        </div>`;
    }).join("");
  } catch (err) {
    lista.innerHTML = "";
    mostrarMensagem("msg-vinculos", err.message);
  }
}

async function adicionarVinculo(e) {
  e.preventDefault();
  if (!BebeAtivo.garantirContexto()) return;
  mostrarMensagem("msg-vinculos", "");

  const email = document.getElementById("vinculo-email").value.trim();
  const btn = document.getElementById("btn-vincular");
  btn.disabled = true;

  try {
    await ApiService.vinculos.vincularPorEmail(BebeAtivo.atual.id, email);
    document.getElementById("form-vinculo").reset();
    mostrarMensagem("msg-vinculos", "Pessoa vinculada ao bebê.", "sucesso");
    await carregarVinculos();
  } catch (err) {
    // O back-end devolve texto descritivo (ex.: "Usuário já está vinculado a este bebê")
    mostrarMensagem("msg-vinculos", err.message);
  } finally {
    btn.disabled = false;
  }
}

async function removerVinculo(usuarioId) {
  if (!BebeAtivo.garantirContexto()) return;
  const ehVoce = usuarioId === usuarioLogado.id;
  const pergunta = ehVoce
    ? "Remover o seu próprio vínculo? Você perderá o acesso a este bebê."
    : "Remover este usuário do bebê?";
  if (!confirm(pergunta)) return;

  try {
    await ApiService.vinculos.remover(BebeAtivo.atual.id, usuarioId);
    if (ehVoce) {
      AuthService.limparBebeAtivo(usuarioLogado.id);
      window.location.reload();
      return;
    }
    mostrarMensagem("msg-vinculos", "Vínculo removido.", "sucesso");
    await carregarVinculos();
  } catch (err) {
    mostrarMensagem("msg-vinculos", err.message);
  }
}

// ----------------------------------------------------
// BUSCA DA BABÁ
// ----------------------------------------------------
async function buscarBebesDaBaba(e) {
  if (e) e.preventDefault();
  mostrarMensagem("msg-baba", "");
  const lista = document.getElementById("lista-bebes-baba");
  lista.innerHTML = '<p class="estado-vazio">Buscando...</p>';

  try {
    const pagina = await ApiService.bebes.buscarDaBaba(usuarioLogado.id, {
      nomeBebe: document.getElementById("busca-nome-bebe").value,
      nomeResponsavel: document.getElementById("busca-nome-resp").value,
      faixaEtaria: document.getElementById("busca-faixa").value
    });
    const bebes = pagina?.content || [];
    if (!bebes.length) {
      lista.innerHTML = '<p class="estado-vazio">Nenhum bebê encontrado.</p>';
      return;
    }
    lista.innerHTML = bebes.map(b => `
      <div class="list-row">
        <div>
          <strong>${escaparHtml(b.nome)}</strong>
          <p class="texto-apoio">${escaparHtml(calcularIdade(b.dataNascimento))}${b.nomeResponsavel ? ` • responsável: ${escaparHtml(b.nomeResponsavel)}` : ""}</p>
        </div>
        ${b.id === BebeAtivo.atual?.id
          ? '<span class="metric-badge">Selecionado</span>'
          : `<button type="button" class="btn-outline" onclick="BebeAtivo.selecionar(${b.id})">Selecionar</button>`}
      </div>`).join("");
  } catch (err) {
    lista.innerHTML = "";
    mostrarMensagem("msg-baba", err.message);
  }
}

// ----------------------------------------------------
// CADASTRO DE BEBÊ
// ----------------------------------------------------
async function cadastrarBebe(e) {
  e.preventDefault();
  mostrarMensagem("msg-novo-bebe", "");

  const ehBaba = usuarioLogado.tipo === "BABA";
  const dados = {
    nome: document.getElementById("novo-nome").value.trim(),
    dataNascimento: document.getElementById("novo-nasc").value,
    sexo: document.getElementById("novo-sexo").value,
    observacoes: document.getElementById("novo-obs").value.trim(),
    nomeResponsavel: ehBaba ? document.getElementById("novo-responsavel").value.trim() : null
  };
  if (!dados.nome) return mostrarMensagem("msg-novo-bebe", "Informe o nome do bebê.");
  if (dados.dataNascimento > hojeIsoLocal()) return mostrarMensagem("msg-novo-bebe", "A data de nascimento não pode estar no futuro.");
  if (ehBaba && !dados.nomeResponsavel) {
    document.getElementById("novo-responsavel").focus();
    return mostrarMensagem("msg-novo-bebe", "Informe o nome do responsável pelo bebê.");
  }

  const btn = document.getElementById("btn-novo-bebe");
  btn.disabled = true; // evita cadastro duplicado por duplo clique
  try {
    const bebe = await ApiService.bebes.cadastrar(dados);
    const foto = seletorFotoNovoBebe.arquivo();
    let avisoFoto = "";
    if (foto) {
      try {
        await ApiService.bebes.enviarFoto(bebe.id, foto);
      } catch (error) {
        avisoFoto = ` A foto não foi enviada (${error.message}); tente novamente em "Bebê Selecionado".`;
      }
    }
    AuthService.setBebeAtivoId(usuarioLogado.id, bebe.id);
    alert(`${bebe.nome} foi cadastrado(a) e selecionado(a).${avisoFoto}`);
    window.location.reload();
  } catch (err) {
    mostrarMensagem("msg-novo-bebe", err.message);
    btn.disabled = false;
  }
}

// ----------------------------------------------------
// INICIALIZAÇÃO
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  usuarioLogado = AuthService.getUsuarioLogado();
  if (!usuarioLogado) return;

  const ehBaba = usuarioLogado.tipo === "BABA";
  document.getElementById("grupo-nome-responsavel").hidden = !ehBaba;
  document.getElementById("novo-responsavel").required = ehBaba;
  document.getElementById("novo-nasc").max = hojeIsoLocal();
  seletorFotoNovoBebe = FotoBebe.criarSeletor(document.getElementById("novo-foto"));
  configurarTrocaDeFoto();

  carregarUsuario();
  try {
    await BebeAtivo.inicializar();
  } catch (error) {
    mostrarMensagem("msg-meus", error.message);
    return;
  }
  renderizarBebeAtual();
  renderizarMeusBebes();
  if (ehBaba) {
    document.getElementById("card-baba").hidden = false;
    buscarBebesDaBaba();
  }
  if (BebeAtivo.atual) await carregarVinculos();
});
