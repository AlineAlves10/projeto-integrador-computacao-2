package br.com.projeto.dto.response;

import java.util.List;

// podeGerenciarVinculos: o usuário logado pode vincular pessoas a este bebê
public record ContatosBebeResponse(boolean podeGerenciarVinculos, List<ContatoResponse> contatos) {
}
