package br.com.projeto.dto.response;

import br.com.projeto.Enum.TipoAtividadeEnum;

import java.time.LocalDateTime;

public record AtividadeResponse(Long id, TipoAtividadeEnum tipo, LocalDateTime dataHora, Integer duracaoMinutos,
                                String descricao) {
}
