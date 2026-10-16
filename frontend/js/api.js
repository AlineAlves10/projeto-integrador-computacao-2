/**
 * api.js - Módulo de integração do Frontend com a API REST Spring Boot
 * Projeto Integrador: Babá Premium
 *
 * Depende de config.js (APP_CONFIG.API_BASE_URL).
 * Todas as rotas de dados de um bebê usam o id na URL (/bebes/{bebeId}/...); o servidor confere
 * se o usuário autenticado tem vínculo com esse bebê antes de responder.
 */

const API_BASE_URL = window.APP_CONFIG.API_BASE_URL;
const TOKEN_STORAGE_KEY = "baba_premium_token";

/** Erro de API com o status HTTP e uma mensagem pronta para exibir ao usuário. */
class ApiError extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
  }
}

// Mensagens usadas quando o back-end não envia texto próprio
const MENSAGENS_POR_STATUS = {
  400: "Dados inválidos. Verifique os campos obrigatórios.",
  401: "Sessão expirada. Faça login novamente.",
  403: "Você não tem permissão para esta operação.",
  404: "Registro não encontrado.",
  409: "Conflito com um registro existente.",
  413: "Arquivo grande demais.",
  500: "Erro interno no servidor. Tente novamente mais tarde."
};

/** O GlobalExceptionHandler devolve texto puro; erros padrão do Spring devolvem JSON. */
function mensagemDeErro(status, corpo) {
  if (corpo) {
    try {
      const json = JSON.parse(corpo);
      if (json.message || json.detail) return json.message || json.detail;
    } catch {
      return corpo;
    }
  }
  return MENSAGENS_POR_STATUS[status] || `Erro ${status} na API.`;
}

/** Sessão expirada: limpa o token e volta para o login (exceto na própria tela de login). */
function tratarNaoAutenticado() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem("baba_premium_user");
  if (!window.location.pathname.endsWith("login.html")) {
    window.location.href = "login.html?sessao=expirada";
  }
}

async function executarFetch(endpoint, options) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    options.headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  } catch (error) {
    console.error(`[API Error] Falha de conexão em ${options.method || "GET"} ${endpoint}:`, error.message);
    throw new ApiError(0, `Não foi possível conectar à API (${API_BASE_URL}). Verifique se o back-end está em execução.`);
  }

  if (response.status === 401 && token) {
    tratarNaoAutenticado();
  }
  return response;
}

/**
 * Requisição JSON padronizada
 * @param {string} endpoint - Caminho relativo (ex: '/bebes/1')
 * @param {string} method - 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'
 * @param {object|FormData|null} data - Corpo (JSON ou FormData para upload)
 */
async function requestAPI(endpoint, method = "GET", data = null) {
  const options = { method, headers: { Accept: "application/json" } };

  if (data instanceof FormData) {
    options.body = data; // o navegador define o Content-Type multipart com boundary
  } else if (data && ["POST", "PUT", "PATCH"].includes(method)) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  const response = await executarFetch(endpoint, options);
  const corpo = await response.text();

  if (!response.ok) {
    console.error(`[API Error] ${method} ${endpoint} -> ${response.status}`);
    throw new ApiError(response.status, mensagemDeErro(response.status, corpo));
  }

  return corpo ? JSON.parse(corpo) : null; // 204 No Content / corpo vazio
}

/** Baixa um binário autenticado (ex.: foto). Retorna Blob ou null quando não existe (404). */
async function requestBlob(endpoint) {
  const response = await executarFetch(endpoint, { method: "GET" });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ApiError(response.status, mensagemDeErro(response.status, await response.text()));
  }
  return response.blob();
}

/** Monta query string ignorando filtros vazios. */
function montarQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      query.append(chave, valor);
    }
  });
  const texto = query.toString();
  return texto ? `?${texto}` : "";
}

/** CRUD de um recurso do bebê: /bebes/{bebeId}/{recurso} */
function recursoDoBebe(recurso) {
  return {
    listar: (bebeId, filtros = {}) => requestAPI(`/bebes/${bebeId}/${recurso}${montarQuery(filtros)}`),
    criar: (bebeId, dados) => requestAPI(`/bebes/${bebeId}/${recurso}`, "POST", dados),
    excluir: (bebeId, id) => requestAPI(`/bebes/${bebeId}/${recurso}/${id}`, "DELETE")
  };
}

// ----------------------------------------------------
// SERVIÇOS ESPECÍFICOS DA APLICAÇÃO
// ----------------------------------------------------

const ApiService = {
  // AuthController (/auth)
  auth: {
    login: (email, senha) => requestAPI("/auth/login", "POST", { email, senha }),
    /** @param {object} dados - { nome, email, senha, tipo, bebes: [{ nome, dataNascimento, sexo, observacoes }] } */
    cadastrar: (dados) => requestAPI("/auth/cadastro", "POST", dados)
  },

  // UsuarioController (/usuarios)
  usuarios: {
    obter: (id) => requestAPI(`/usuarios/${id}`),
    eu: () => requestAPI("/usuarios/me"),
    /** Telefone da própria conta; vazio remove */
    atualizarTelefone: (telefone) => requestAPI("/usuarios/me/telefone", "PUT", { telefone })
  },

  // BebeController (/bebes)
  bebes: {
    /** @param {object} dados - { nome, dataNascimento, sexo, observacoes, nomeResponsavel } */
    cadastrar: (dados) => requestAPI("/bebes", "POST", dados),
    /** Bebês do usuário logado: [{ bebe: {...}, papel }] */
    meus: () => requestAPI("/bebes/meus"),
    obter: (id) => requestAPI(`/bebes/${id}`),
    /** Page do Spring: { content: [...], ... }. filtros: { nomeBebe, nomeResponsavel, faixaEtaria } */
    buscarDaBaba: (idBaba, filtros = {}) => requestAPI(`/bebes/baba/${idBaba}${montarQuery(filtros)}`),
    enviarFoto: (id, arquivo) => {
      const form = new FormData();
      form.append("arquivo", arquivo);
      return requestAPI(`/bebes/${id}/foto`, "PUT", form);
    },
    obterFoto: (id) => requestBlob(`/bebes/${id}/foto`),
    removerFoto: (id) => requestAPI(`/bebes/${id}/foto`, "DELETE")
  },

  // UsuarioBebeController (/bebes/{bebeId}/usuarios)
  vinculos: {
    /** O papel é definido pelo servidor (tipo da conta da pessoa vinculada) */
    vincularPorEmail: (bebeId, email) => requestAPI(`/bebes/${bebeId}/usuarios`, "POST", { email }),
    listar: (bebeId) => requestAPI(`/bebes/${bebeId}/usuarios`),
    /** { podeGerenciarVinculos, contatos: [{ usuarioId, nome, papel, telefone, linkLigacao, linkWhatsapp, podeRemover, ... }] } */
    contatos: (bebeId) => requestAPI(`/bebes/${bebeId}/contatos`),
    remover: (bebeId, usuarioId) => requestAPI(`/bebes/${bebeId}/usuarios/${usuarioId}`, "DELETE")
  },

  // MidiaController (/bebes/{bebeId}/midias) — arquivos baixados sempre com o token (sem URL pública)
  midias: {
    listar: (bebeId, pagina = 0, tamanho = 12) => requestAPI(`/bebes/${bebeId}/midias${montarQuery({ pagina, tamanho })}`),
    enviar: (bebeId, arquivo, miniatura, descricao) => {
      const form = new FormData();
      form.append("arquivo", arquivo);
      if (miniatura) form.append("miniatura", miniatura, "miniatura.jpg");
      if (descricao) form.append("descricao", descricao);
      return requestAPI(`/bebes/${bebeId}/midias`, "POST", form);
    },
    miniatura: (bebeId, id) => requestBlob(`/bebes/${bebeId}/midias/${id}/miniatura`),
    arquivo: (bebeId, id) => requestBlob(`/bebes/${bebeId}/midias/${id}/arquivo`),
    excluir: (bebeId, id) => requestAPI(`/bebes/${bebeId}/midias/${id}`, "DELETE")
  },

  // RotinaController — listagens aceitam { inicio, fim } (yyyy-MM-dd)
  alimentacoes: recursoDoBebe("alimentacoes"),
  sonos: {
    ...recursoDoBebe("sonos"),
    encerrar: (bebeId, id, fim) => requestAPI(`/bebes/${bebeId}/sonos/${id}/fim`, "PATCH", { fim })
  },
  fraldas: recursoDoBebe("fraldas"),
  higienes: recursoDoBebe("higienes"),
  atividades: recursoDoBebe("atividades"),

  // SaudeController
  crescimentos: recursoDoBebe("crescimentos"),
  vacinas: recursoDoBebe("vacinas"),
  medicamentos: recursoDoBebe("medicamentos"),

  // DiarioController
  diario: {
    ...recursoDoBebe("diario"),
    atualizar: (bebeId, id, dados) => requestAPI(`/bebes/${bebeId}/diario/${id}`, "PUT", dados)
  },

  // HorarioPrevistoController — listar aceita { status, desde }
  horarios: {
    ...recursoDoBebe("horarios-previstos"),
    alterarStatus: (bebeId, id, status) =>
      requestAPI(`/bebes/${bebeId}/horarios-previstos/${id}/status`, "PATCH", { status })
  },

  // ResumoController
  resumo: {
    doDia: (bebeId, data) => requestAPI(`/bebes/${bebeId}/resumo${montarQuery({ data })}`),
    linhaDoTempo: (bebeId, inicio, fim) => requestAPI(`/bebes/${bebeId}/linha-do-tempo${montarQuery({ inicio, fim })}`),
    estatisticas: (bebeId, inicio, fim) => requestAPI(`/bebes/${bebeId}/estatisticas${montarQuery({ inicio, fim })}`)
  }
};

/** "+5511987654321" -> "(11) 98765-4321"; outros valores são exibidos como estão. */
function formatarTelefone(valor) {
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(valor || "");
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : (valor || "");
}

/** Exibe uma mensagem (erro, sucesso ou aviso) dentro de um container. */
function mostrarMensagem(container, texto, tipo = "erro") {
  const alvo = typeof container === "string" ? document.getElementById(container) : container;
  if (!alvo) return;
  alvo.innerHTML = texto ? `<div class="aviso-integracao ${tipo}">${escaparHtml(texto)}</div>` : "";
}

// Torna o serviço acessível globalmente nas outras páginas/scripts
window.ApiService = ApiService;
window.ApiError = ApiError;
