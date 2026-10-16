package br.com.projeto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

// Registro de administração de um medicamento já orientado por profissional (não é prescrição)
public record MedicamentoRequest(@NotBlank @Size(max = 120) String nomeMedicamento,
                                 @NotBlank @Size(max = 60) String dosagem,
                                 @NotNull LocalDateTime dataHora,
                                 @Size(max = 60) String viaAdministracao,
                                 @Size(max = 255) String observacoes) {
}
