package br.com.projeto.dto.response;

import java.util.List;

public record MidiaPaginaResponse(List<MidiaResponse> itens, int pagina, int tamanho, long totalItens, int totalPaginas) {
}
