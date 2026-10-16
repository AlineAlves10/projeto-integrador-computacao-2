package br.com.projeto.dto.response;

import br.com.projeto.Enum.TipoFraldaEnum;

import java.time.LocalDateTime;

public record FraldaResponse(Long id, TipoFraldaEnum tipo, LocalDateTime dataHora, String consistenciaCoco,
                             String corCoco, String observacoes) {
}
