package br.com.projeto.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CrescimentoResponse(Long id, LocalDate dataRegistro, BigDecimal pesoKg, BigDecimal alturaCm,
                                  BigDecimal perimetroCefalicoCm, String observacoes) {
}
