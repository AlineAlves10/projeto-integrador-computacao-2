package br.com.projeto.dto.request;

import br.com.projeto.Enum.TagDiarioEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

// dataHora opcional: quando ausente, usa o momento do registro
public record DiarioRequest(@NotBlank @Size(max = 150) String titulo,
                            @NotBlank @Size(max = 5000) String texto,
                            @NotNull TagDiarioEnum tag,
                            LocalDateTime dataHora) {
}
