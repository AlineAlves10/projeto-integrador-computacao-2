package br.com.projeto.dto.response;

import java.time.LocalDateTime;

public record MedicamentoResponse(Long id, String nomeMedicamento, String dosagem, LocalDateTime dataHora,
                                  String viaAdministracao, String observacoes) {
}
