package br.com.projeto.dto.response;

import java.time.LocalDate;

// possuiFoto indica se há foto em GET /bebes/{id}/foto (o nome do arquivo no servidor não é exposto)
public record BebeResponse(Long id,
                           String nome,
                           LocalDate dataNascimento,
                           String sexo,
                           boolean possuiFoto,
                           String observacoes,
                           String nomeResponsavel) {
}
