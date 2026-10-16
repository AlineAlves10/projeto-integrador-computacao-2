package br.com.projeto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

// A foto é enviada separadamente por upload (PUT /bebes/{id}/foto).
// nomeResponsavel é obrigatório quando quem cadastra é uma babá (validado em BebeService).
public record BebeRequest(@NotBlank @Size(max = 120) String nome,
                          @NotNull @PastOrPresent LocalDate dataNascimento,
                          @NotBlank String sexo,
                          @NotBlank @Size(max = 255) String observacoes,
                          @Size(max = 120) String nomeResponsavel) {

}
