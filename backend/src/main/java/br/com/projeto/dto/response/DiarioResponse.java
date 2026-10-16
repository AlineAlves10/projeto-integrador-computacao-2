package br.com.projeto.dto.response;

import br.com.projeto.Enum.TagDiarioEnum;

import java.time.LocalDateTime;

public record DiarioResponse(Long id, LocalDateTime dataHora, String titulo, String texto, TagDiarioEnum tag,
                             Long autorId, String autorNome, LocalDateTime atualizadoEm) {
}
