package br.com.projeto.dto.request;

import br.com.projeto.Enum.ConsistenciaFezesEnum;
import br.com.projeto.Enum.TipoFraldaEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

// tipo: XIXI, COCO, MISTO (xixi e cocô na mesma troca) ou LIMPA. Volume não é registrado.
// consistenciaCoco e corCoco são opcionais e só são persistidos quando a troca tem cocô.
public record FraldaRequest(@NotNull TipoFraldaEnum tipo,
                            @NotNull LocalDateTime dataHora,
                            ConsistenciaFezesEnum consistenciaCoco,
                            @Size(max = 60) String corCoco,
                            @Size(max = 255) String observacoes) {
}
