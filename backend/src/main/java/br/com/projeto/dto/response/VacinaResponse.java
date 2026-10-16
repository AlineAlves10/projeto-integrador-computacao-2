package br.com.projeto.dto.response;

import java.time.LocalDate;

public record VacinaResponse(Long id, String nomeVacina, String dose, LocalDate dataAplicacao, LocalDate proximaDose,
                             String observacoes) {
}
