/** Erro de API com o status HTTP e uma mensagem pronta para exibir ao usuário. */
export class ApiError extends Error {
  constructor(readonly status: number, mensagem: string) {
    super(mensagem);
    this.name = 'ApiError';
  }
}

// Mensagens usadas quando o back-end não envia texto próprio
const MENSAGENS_POR_STATUS: Record<number, string> = {
  0: 'Não foi possível conectar à API. Verifique se o back-end está em execução.',
  400: 'Dados inválidos. Verifique os campos obrigatórios.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para esta operação.',
  404: 'Registro não encontrado.',
  409: 'Conflito com um registro existente.',
  413: 'Arquivo grande demais.',
  500: 'Erro interno no servidor. Tente novamente mais tarde.',
};

/** O GlobalExceptionHandler devolve texto puro; erros padrão do Spring devolvem JSON ({ message } / { detail }). */
export function mensagemDeErro(status: number, corpo: unknown): string {
  if (typeof corpo === 'string' && corpo.trim()) {
    try {
      const json = JSON.parse(corpo) as { message?: string; detail?: string };
      if (json.message || json.detail) return (json.message || json.detail)!;
    } catch {
      return corpo;
    }
  } else if (corpo && typeof corpo === 'object') {
    const json = corpo as { message?: string; detail?: string };
    if (json.message || json.detail) return (json.message || json.detail)!;
  }
  return MENSAGENS_POR_STATUS[status] || `Erro ${status} na API.`;
}

/** Mensagem de qualquer erro capturado (ApiError, validação local com Error ou desconhecido). */
export function textoDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.';
}
