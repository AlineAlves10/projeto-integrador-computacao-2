package br.com.projeto.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record SonoFimRequest(@NotNull LocalDateTime fim) {
}
