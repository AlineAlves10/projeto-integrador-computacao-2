package br.com.projeto.dto.request;

import br.com.projeto.Enum.TipoHigieneEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record HigieneRequest(@NotNull TipoHigieneEnum tipo,
                             @NotNull LocalDateTime dataHora,
                             @Size(max = 255) String observacoes) {
}
