package br.com.projeto.dto.request;

import br.com.projeto.Enum.TipoAtividadeEnum;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AtividadeRequest(@NotNull TipoAtividadeEnum tipo,
                               @NotNull LocalDateTime dataHora,
                               @Positive @Max(1440) Integer duracaoMinutos,
                               @Size(max = 500) String descricao) {
}
