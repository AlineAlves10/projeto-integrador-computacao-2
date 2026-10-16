package br.com.projeto.dto.response;

import java.time.LocalDateTime;

public record SonoResponse(Long id, LocalDateTime inicio, LocalDateTime fim, Integer duracaoMinutos, String local) {
}
