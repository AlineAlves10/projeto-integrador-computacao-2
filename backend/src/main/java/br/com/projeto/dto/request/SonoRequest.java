package br.com.projeto.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

// fim nulo = bebê ainda dormindo (pode ser encerrado depois em PATCH .../sonos/{id}/fim)
public record SonoRequest(@NotNull LocalDateTime inicio,
                          LocalDateTime fim,
                          @Size(max = 60) String local) {
}
