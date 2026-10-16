package br.com.projeto.dto.response;

import java.time.LocalDateTime;

// Item da linha do tempo montado a partir dos registros reais.
// categoria: ALIMENTACAO, SONO, FRALDA, HIGIENE, MEDICAMENTO ou ATIVIDADE; id: id do registro na sua categoria.
public record LinhaDoTempoItemResponse(String categoria,
                                       Long id,
                                       String tipo,
                                       LocalDateTime dataHora,
                                       LocalDateTime fim,
                                       String titulo,
                                       String descricao) {
}
