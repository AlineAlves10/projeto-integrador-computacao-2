package br.com.projeto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record VacinaRequest(@NotBlank @Size(max = 120) String nomeVacina,
                            @NotBlank @Size(max = 60) String dose,
                            @NotNull @PastOrPresent LocalDate dataAplicacao,
                            LocalDate proximaDose,
                            @Size(max = 255) String observacoes) {
}
