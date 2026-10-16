package br.com.projeto.dto.response;

import br.com.projeto.Enum.TipoHigieneEnum;

import java.time.LocalDateTime;

public record HigieneResponse(Long id, TipoHigieneEnum tipo, LocalDateTime dataHora, String observacoes) {
}
