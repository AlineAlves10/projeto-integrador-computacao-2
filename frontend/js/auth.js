/**
 * auth.js - Gerenciador de Autenticação e Sessão
 * Projeto Integrador: Babá Premium
 *
 * login() e cadastrar() dependem de config.js e api.js. protegerRota() e logout() funcionam sozinhos.
 * A API emite um token JWT em POST /auth/login e POST /auth/cadastro; ele é enviado em todas as requisições.
 */

const TOKEN_KEY = "baba_premium_token";
const USER_KEY = "baba_premium_user";
const BEBE_KEY_PREFIX = "baba_premium_bebe_";

const AuthService = {
  /**
   * Autentica no back-end (e-mail e senha conferidos pelo servidor)
   * @returns {Promise<object>} UsuarioResponse
   */
  async login(email, senha) {
    try {
      const sessao = await ApiService.auth.login(email, senha);
      this.salvarSessao(sessao);
      return sessao.usuario;
    } catch (error) {
      if (error.status === 401) throw new Error("E-mail ou senha inválidos.");
      throw error;
    }
  },

  /**
   * Cadastra a conta e todos os bebês em uma única transação no servidor (POST /auth/cadastro).
   * Depois envia as fotos escolhidas, cada uma para o bebê correspondente (mesma ordem do formulário).
   * @param {object} dados - { nome, email, senha, tipo, bebes: [{ ..., foto: File|null }] }
   * @returns {Promise<{usuario, bebes, fotosComFalha: string[]}>}
   */
  async cadastrar(dados) {
    const bebes = dados.bebes || [];
    const resposta = await ApiService.auth.cadastrar({
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      tipo: dados.tipo,
      bebes: bebes.map(({ foto, ...campos }) => campos)
    });
    this.salvarSessao(resposta.sessao);

    const fotosComFalha = [];
    for (let i = 0; i < resposta.bebes.length; i++) {
      const foto = bebes[i]?.foto;
      if (!foto) continue;
      try {
        await ApiService.bebes.enviarFoto(resposta.bebes[i].id, foto);
      } catch (error) {
        fotosComFalha.push(`${resposta.bebes[i].nome}: ${error.message}`);
      }
    }

    if (resposta.bebes.length) {
      this.setBebeAtivoId(resposta.sessao.usuario.id, resposta.bebes[0].id);
    }
    return { usuario: resposta.sessao.usuario, bebes: resposta.bebes, fotosComFalha };
  },

  salvarSessao(sessao) {
    localStorage.setItem(TOKEN_KEY, sessao.token);
    localStorage.setItem(USER_KEY, JSON.stringify(sessao.usuario));
  },

  /**
   * Encerra a sessão atual e redireciona para o login
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "login.html";
  },

  /**
   * Retorna o token JWT salvo
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Retorna o usuário logado
   * @returns {object|null}
   */
  getUsuarioLogado() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Há token e ele ainda não expirou? (a validação definitiva é sempre feita pelo servidor)
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token || !this.getUsuarioLogado()) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return !payload.exp || payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  /**
   * Protege páginas restritas (chamar no topo de dashboard.html, rotina.html, etc.)
   * @param {string} rotaLogin Caminho da tela de login
   */
  protegerRota(rotaLogin = "login.html") {
    if (!this.isAuthenticated()) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = rotaLogin;
    }
  },

  // ----------------------------------------------------
  // BEBÊ ATIVO (preferência do navegador; a lista de bebês permitidos vem de GET /bebes/meus)
  // ----------------------------------------------------

  getBebeAtivoId(usuarioId) {
    const valor = localStorage.getItem(BEBE_KEY_PREFIX + usuarioId);
    return valor ? Number(valor) : null;
  },

  setBebeAtivoId(usuarioId, bebeId) {
    localStorage.setItem(BEBE_KEY_PREFIX + usuarioId, String(bebeId));
  },

  limparBebeAtivo(usuarioId) {
    localStorage.removeItem(BEBE_KEY_PREFIX + usuarioId);
  }
};

// Disponibiliza globalmente
window.AuthService = AuthService;
