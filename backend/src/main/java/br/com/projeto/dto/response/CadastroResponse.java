package br.com.projeto.dto.response;

import java.util.List;

// Sessão já autenticada (para o envio das fotos logo após o cadastro) e os bebês criados, na ordem enviada
public record CadastroResponse(LoginResponse sessao, List<BebeResponse> bebes) {
}
