package br.com.projeto.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

// Limites largos apenas para barrar erros de digitação (ex.: 75 kg no lugar de 7,5 kg); ao menos uma medida é exigida
public record CrescimentoRequest(@NotNull @PastOrPresent LocalDate dataRegistro,
                                 @DecimalMin("0.2") @DecimalMax("60") BigDecimal pesoKg,
                                 @DecimalMin("20") @DecimalMax("150") BigDecimal alturaCm,
                                 @DecimalMin("15") @DecimalMax("70") BigDecimal perimetroCefalicoCm,
                                 @Size(max = 255) String observacoes) {
}
