package br.com.projeto.dto.response;

import br.com.projeto.Enum.StatusHorarioPrevistoEnum;
import br.com.projeto.Enum.TipoHorarioPrevistoEnum;

import java.time.LocalDateTime;

public record HorarioPrevistoResponse(Long id, TipoHorarioPrevistoEnum tipo, LocalDateTime dataHoraPrevista,
                                      String descricao, String detalhes, String local,
                                      StatusHorarioPrevistoEnum status, String criadoPorNome) {
}
