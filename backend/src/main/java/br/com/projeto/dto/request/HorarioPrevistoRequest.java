package br.com.projeto.dto.request;

import br.com.projeto.Enum.TipoHorarioPrevistoEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

// descricao é obrigatória para MEDICAMENTO (nome) e OUTRO; detalhes vale para MEDICAMENTO e CONSULTA;
// local vale para CONSULTA e VACINA. Campos que não se aplicam ao tipo são descartados.
public record HorarioPrevistoRequest(@NotNull TipoHorarioPrevistoEnum tipo,
                                     @NotNull LocalDateTime dataHoraPrevista,
                                     @Size(max = 300) String descricao,
                                     @Size(max = 300) String detalhes,
                                     @Size(max = 150) String local) {
}
